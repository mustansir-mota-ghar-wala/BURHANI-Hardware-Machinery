from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Sum, Q
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import Category, Product, Cart, Order, Order_Item
import razorpay
import time
import requests
import random
import json
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from groq import Groq
import os
import base64
from PIL import Image
from io import BytesIO


def robots_txt(request):
    content = f"""User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /your_orders/
Disallow: /payment-callback/

Sitemap: {settings.SITE_URL}/sitemap.xml
"""
    return HttpResponse(content, content_type='text/plain')


def sitemap_xml(request):
    today = timezone.now().date().isoformat()
    urls = [
        (f"{settings.SITE_URL}/", "daily", "1.0"),
    ]

    for category in Category.objects.all().order_by('id'):
        urls.append((f"{settings.SITE_URL}/product/{category.id}/", "weekly", "0.8"))

    xml_urls = "\n".join(
        f"""    <url>
        <loc>{loc}</loc>
        <lastmod>{today}</lastmod>
        <changefreq>{changefreq}</changefreq>
        <priority>{priority}</priority>
    </url>"""
        for loc, changefreq, priority in urls
    )

    content = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{xml_urls}
</urlset>
"""
    return HttpResponse(content, content_type='application/xml')


def register(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        username = request.POST.get('username')  # This is the phone number
        password = request.POST.get('password')
        user_otp = request.POST.get('otp')
        saved_otp = request.session.get('verification_otp')

        # 1. Validate Phone Number Length
        phone_digits = ''.join(filter(str.isdigit, str(username)))
        if len(phone_digits) != 10:
            messages.error(request, 'Phone number must be 10 digits.')
            return redirect('register')

        # 2. Validate OTP
        if user_otp != "000000" and user_otp != saved_otp:
            messages.error(request, 'Invalid OTP. Please try again.')
            return redirect('register')

        # 3. Check if User Exists
        user = User.objects.filter(username=username)
        if user.exists():
            messages.info(request, 'Phone number already registered.')
            return redirect('register')

        # 4. Strong Password Validation
        try:
            validate_password(password)
        except ValidationError as e:
            for error in e.messages:
                messages.error(request, error)
            return redirect('register')

        # Create the user
        new_user = User.objects.create(
            first_name=first_name,
            username=username,
        )
        new_user.set_password(password)
        new_user.save()
        messages.success(request, 'Account created successfully')
        return redirect('login')

    return render(request, 'register.html')


def Login(request):
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')

        if not User.objects.filter(username=username).exists():
            messages.info(request, 'Username not exists, Register Yourself')
            return redirect('register')

        user = authenticate(username=username, password=password)
        if user is None:
            messages.error(request, 'Invalid Credentials')
        else:
            login(request, user)
            return redirect('/')

    return render(request, 'login.html')


def Logout(request):
    logout(request)
    messages.success(request, 'Logged out successfully')
    return redirect('login')


def home(request):
    query = request.GET.get('q')
    categories = Category.objects.all()
    products = Product.objects.all()

    if query:
        from django.db.models import Q
        query_words = query.split()
        product_q = Q()
        category_q = Q()
        for word in query_words:
            # Ignore extremely common filler words from voice search
            if word.lower() not in ['show', 'me', 'a', 'the', 'some', 'for']:
                product_q |= Q(name__icontains=word) | Q(category__name__icontains=word)
                category_q |= Q(name__icontains=word)
        
        products = products.filter(product_q).distinct()
        categories = categories.filter(category_q).distinct()

    if not query:
        products = products.order_by('-id')[:12]

    context = {
        'categories': categories,
        'products': products,
        'query': query
    }
    return render(request, 'home.html', context)


def product(request, id):
    categories = Category.objects.all().order_by('name')
    selected_category = get_object_or_404(Category, id=id)
    products = Product.objects.filter(category=selected_category)

    context = {
        'categories': categories,
        'selected_category': selected_category,
        'products': products
    }
    return render(request, 'product.html', context)


@login_required(login_url='login')
def add_to_cart(request, id):
    product = get_object_or_404(Product, id=id)

    cart_item, created = Cart.objects.get_or_create(
        user=request.user,
        product=product,
        defaults={
            'product_quantity': 1,
            'product_total': product.price
        }
    )

    if not created:
        cart_item.product_quantity += 1
        cart_item.product_total = cart_item.product_quantity * product.price
        cart_item.save()

    return redirect('cart')


@login_required(login_url='login')
def cart(request):
    user = request.user
    cart_items = Cart.objects.filter(user=user)
    total_data = cart_items.aggregate(total=Sum('product_total'))
    grand_total = total_data['total'] if total_data['total'] else 0

    context = {
        'cart': cart_items,
        'grand_total': grand_total
    }
    return render(request, 'cart.html', context)


@login_required(login_url='login')
def remove_from_cart(request, id):
    cart_item = get_object_or_404(Cart, id=id, user=request.user)
    cart_item.delete()
    return redirect('cart')


@login_required(login_url='login')
def decrease_product(request, id):
    product = get_object_or_404(Product, id=id)
    cart_item = Cart.objects.filter(user=request.user, product=product).first()

    if cart_item:
        if cart_item.product_quantity > 1:
            cart_item.product_quantity -= 1
            cart_item.product_total = cart_item.product_quantity * product.price
            cart_item.save()
        else:
            cart_item.delete()

    return redirect('cart')


@login_required(login_url='login')
def checkout(request):
    user = request.user
    cart_items = Cart.objects.filter(user=user)

    if not cart_items.exists():
        messages.warning(request, "Your cart is empty.")
        return redirect('cart')

    # Server-side price recalculation: use DB product price × quantity, ignore stored product_total
    total = 0
    for item in cart_items:
        correct_total = item.product.price * item.product_quantity
        if item.product_total != correct_total:
            item.product_total = correct_total
            item.save()
        total += correct_total
    grand_total = total
    order_amount = int(grand_total * 100)
    order_currency = 'INR'
    order_receipt = f"receipt_{user.id}_{int(time.time())}"

    try:
        client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

        razorpay_order = client.order.create({
            'amount': order_amount,
            'currency': order_currency,
            'receipt': order_receipt,
        })

        razorpay_order_id = razorpay_order['id']

    except Exception as e:
        print("RAZORPAY ORDER CREATION ERROR:", str(e))
        messages.error(request, "Unable to start online payment right now. Please try again later.")
        return redirect('cart')

    new_order = Order.objects.create(
        user=user,
        address='',
        bill=grand_total,
        razorpay_order_id=razorpay_order_id,
        payment_status='Pending'
    )

    last_order = Order.objects.filter(user=user).exclude(address='').order_by('-id').first()
    last_address = last_order.address if last_order else ''

    context = {
        'cart': cart_items,
        'grand_total': grand_total,
        'razorpay_order_id': razorpay_order_id,
        'razorpay_key_id': settings.RAZORPAY_KEY_ID,
        'amount': order_amount,
        'order_instance': new_order,
        'last_address': last_address
    }

    return render(request, 'checkout.html', context)


@csrf_exempt
def payment_callback(request):
    if request.method == "POST":
        try:
            payment_id = request.POST.get("razorpay_payment_id")
            razorpay_order_id = request.POST.get("razorpay_order_id")
            signature = request.POST.get("razorpay_signature")

            params_dict = {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": payment_id,
                "razorpay_signature": signature
            }

            client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
            client.utility.verify_payment_signature(params_dict)

            order = Order.objects.get(razorpay_order_id=razorpay_order_id)
            order.payment_status = "Paid"
            order.razorpay_payment_id = payment_id
            order.razorpay_signature = signature

            address = request.POST.get("address")
            if address:
                order.address = address
            elif not order.address:
                order.address = "Online Order"

            order.save()

            user_cart = Cart.objects.filter(user=order.user)
            for item in user_cart:
                Order_Item.objects.create(
                    order=order,
                    product=item.product,
                    product_quantity=item.product_quantity,
                    product_total=item.product_total
                )
            user_cart.delete()

            messages.success(request, "Payment successful! Order placed.")
            return redirect("your_orders")

        except razorpay.errors.SignatureVerificationError:
            messages.error(request, "Payment signature verification failed.")
            return redirect("checkout")

        except Order.DoesNotExist:
            messages.error(request, "Order not found.")
            return redirect("cart")

        except Exception as e:
            print("PAYMENT CALLBACK ERROR:", str(e))
            messages.error(request, f"Payment failed: {str(e)}")
            return redirect("cart")

    messages.error(request, "Invalid payment callback request.")
    return redirect("home")


import re

def validate_shipping_address(address):
    if not address or not address.strip():
        return False, "Shipping address is required."

    contact_match = re.match(r'^\[CONTACT:\s*([^|]+)\s*\|\s*([0-9]{10})\]\s*(.+)$', address, re.IGNORECASE)
    if not contact_match:
        return False, "Please provide a valid shipping address with a 10-digit mobile number."

    name = contact_match.group(1).strip()
    phone = contact_match.group(2).strip()
    actual_address = contact_match.group(3).strip()

    if len(name) < 2 or not re.match(r'^[a-zA-Z\s]+$', name):
        return False, "Recipient name must be at least 2 characters and contain only letters and spaces."

    if len(phone) != 10 or not phone.isdigit():
        return False, "Phone number must be exactly 10 numeric digits."

    # Flexible PIN code search: find a 6-digit number anywhere in the actual address
    pin_match = re.search(r'\b[0-9]{6}\b', actual_address)
    if not pin_match:
        return False, "Address must contain a valid 6-digit PIN code."

    return True, ""


@login_required(login_url='login')
def save_address(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            address = data.get('address', '').strip()
            order_id = data.get('order_id')
            
            is_valid, err_msg = validate_shipping_address(address)
            if not is_valid:
                return JsonResponse({'status': 'error', 'message': err_msg})

            order = Order.objects.get(id=order_id, user=request.user)
            order.address = address
            order.save()
            return JsonResponse({'status': 'success'})
        except Order.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Order not found.'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'})


@login_required(login_url='login')
def place_order(request):
    if request.method == "POST":
        user = request.user
        address = request.POST.get('address', '').strip()
        order_id = request.POST.get('order_id')
        user_cart = Cart.objects.filter(user=user)

        if not user_cart.exists():
            messages.warning(request, "Your cart is empty.")
            return redirect('cart')

        # Strict Backend Validation
        is_valid, err_msg = validate_shipping_address(address)
        if not is_valid:
            messages.error(request, err_msg)
            return redirect('checkout')

        # Server-side price recalculation for COD
        total = 0
        for item in user_cart:
            correct_total = item.product.price * item.product_quantity
            if item.product_total != correct_total:
                item.product_total = correct_total
                item.save()
            total += correct_total
        grand_total = total

        if order_id:
            try:
                new_order = Order.objects.get(id=order_id, user=user)
                new_order.address = address
                new_order.payment_status = 'Pending (COD)'
                new_order.bill = grand_total
                new_order.save()
            except Order.DoesNotExist:
                new_order = Order.objects.create(
                    user=user,
                    address=address,
                    bill=grand_total,
                    payment_status='Pending (COD)'
                )
        else:
            new_order = Order.objects.create(
                user=user,
                address=address,
                bill=grand_total,
                payment_status='Pending (COD)'
            )

        for item in user_cart:
            Order_Item.objects.create(
                order=new_order,
                product=item.product,
                product_quantity=item.product_quantity,
                product_total=item.product_total
            )

        user_cart.delete()
        messages.success(request, 'Order placed successfully! (Cash on Delivery)')
        return redirect('your_orders')

    return redirect('checkout')


@login_required(login_url='login')
def your_orders(request):
    orders = Order.objects.filter(
        user=request.user,
        payment_status__in=['Paid', 'Pending (COD)', 'Refunded', 'Cancelled']
    ).order_by('-created_at')

    context = {'orders': orders}
    return render(request, 'your_order.html', context)


@login_required(login_url='login')
def cancel_order(request, id):
    if request.method == "POST":
        order = get_object_or_404(Order, id=id, user=request.user)
        
        # Only allow cancellation if not yet shipped
        cancellable_statuses = ['Placed', 'Processing']
        if order.delivery_status not in cancellable_statuses:
            messages.error(request, 'This order cannot be cancelled as it has already been shipped or delivered.')
            return redirect('your_orders')
        
        # --- Handle Refund for Online Payments (Razorpay) ---
        refund_issued = False
        if order.payment_status == 'Paid' and order.razorpay_payment_id:
            try:
                client = razorpay.Client(
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
                )
                # Process refund through Razorpay API
                refund = client.payment.refund(order.razorpay_payment_id, {
                    'amount': order.bill * 100,  # amount in paise
                    'speed': 'normal',
                    'notes': {
                        'order_id': str(order.id),
                        'reason': 'Customer cancelled order'
                    }
                })
                
                if refund.get('status') == 'processed':
                    refund_issued = True
                elif refund.get('status') == 'pending':
                    refund_issued = True  # Will be processed, mark as refund initiated
                    
            except Exception as e:
                print(f"REFUND ERROR for Order #{order.id}: {str(e)}")
                messages.error(request, f'Refund failed: {str(e)}. Please contact support for manual refund.')
                # Still proceed with cancellation, but log the issue
                # The admin can manually process the refund from Razorpay dashboard
        
        # Restore cart items (so customer can re-order if they want)
        for item in order.order_item_set.all():
            cart_item, created = Cart.objects.get_or_create(
                user=request.user,
                product=item.product,
                defaults={
                    'product_quantity': item.product_quantity,
                    'product_total': item.product_total
                }
            )
            if not created:
                cart_item.product_quantity += item.product_quantity
                cart_item.product_total = cart_item.product_quantity * item.product.price
                cart_item.save()
        
        # Mark order as cancelled
        order.delivery_status = 'Cancelled'
        order.payment_status = 'Refunded' if refund_issued else 'Cancelled'
        order.save()
        
        # Delete order items
        order.order_item_set.all().delete()
        
        if refund_issued:
            messages.success(request, f'Order #{order.id} cancelled. Refund of ₹{order.bill} has been initiated to your payment source.')
        else:
            messages.success(request, f'Order #{order.id} has been cancelled successfully.')
        return redirect('your_orders')
    
    return redirect('your_orders')


def send_otp(request):
    if request.method == 'POST':
        try:
            current_time = time.time()

            # --- IP-BASED RATE LIMITING (5 OTPs per IP per 10 minutes) ---
            ip = request.META.get('REMOTE_ADDR', 'unknown')
            rate_key = f'otp_rate_{ip}'
            rate_data = request.session.get(rate_key, {'count': 0, 'start': current_time})
            
            # Reset if 10 minutes have passed
            if current_time - rate_data['start'] > 600:
                rate_data = {'count': 0, 'start': current_time}
            
            rate_data['count'] += 1
            if rate_data['count'] > 5:
                retry_after = int(600 - (current_time - rate_data['start']))
                return JsonResponse({
                    'status': 'cooldown',
                    'message': f'Too many OTP requests. Please try again in {retry_after} seconds.'
                })
            request.session[rate_key] = rate_data

            # --- SESSION-BASED COOLDOWN (60 seconds between OTPs) ---
            last_sent = request.session.get('last_otp_time')
            if last_sent and (current_time - last_sent) < 60:
                remaining = int(60 - (current_time - last_sent))
                return JsonResponse({
                    'status': 'cooldown', 
                    'message': f'Please wait {remaining} seconds before requesting another OTP.'
                })

            # --- ReCAPTCHA-like OTP Rate Limit per phone number ---
            data = json.loads(request.body)
            phone = data.get('phone', '')
            phone = ''.join(filter(str.isdigit, phone))
            if len(phone) > 10: phone = phone[-10:]
            
            # Max 3 OTPs per phone per hour
            phone_key = f'otp_phone_{phone}'
            phone_data = request.session.get(phone_key, {'count': 0, 'start': current_time})
            if current_time - phone_data['start'] > 3600:
                phone_data = {'count': 0, 'start': current_time}
            phone_data['count'] += 1
            if phone_data['count'] > 3:
                return JsonResponse({
                    'status': 'cooldown',
                    'message': 'Maximum OTP limit reached for this number. Try again later.'
                })
            request.session[phone_key] = phone_data

            otp = str(random.randint(100000, 999999))
            request.session['verification_otp'] = otp
            request.session['last_otp_time'] = current_time
            
            url = "https://www.fast2sms.com/dev/bulkV2"
            payload = f"variables_values={otp}&route=otp&numbers={phone}"
            headers = {'authorization': settings.FAST2SMS_KEY}
            response = requests.get(url, params=payload, headers=headers)
            
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})


def verify_otp(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_otp = data.get('otp')
            saved_otp = request.session.get('verification_otp')
            
            # Master OTP for testing (FREE)
            if user_otp == "000000" or user_otp == saved_otp:
                return JsonResponse({'status': 'success'})
            else:
                return JsonResponse({'status': 'failed'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})


def product_detail(request, id):
    product = get_object_or_404(Product, id=id)
    related_products = Product.objects.filter(category=product.category).exclude(id=id)
    categories = Category.objects.all().order_by('name')
    additional_images = product.images.all()
    
    context = {
        'product': product,
        'additional_images': additional_images,
        'related_products': related_products,
        'categories': categories,
    }
    return render(request, 'product_detail.html', context)


@login_required(login_url='login')
def buy_now(request, id):
    product = get_object_or_404(Product, id=id)
    
    cart_item, created = Cart.objects.get_or_create(
        user=request.user,
        product=product,
        defaults={
            'product_quantity': 1,
            'product_total': product.price
        }
    )
    
    if not created:
        cart_item.product_quantity += 1
        cart_item.product_total = cart_item.product_quantity * product.price
        cart_item.save()
        
    return redirect('checkout')

@csrf_exempt
def chat_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message', '')
            language = data.get('language', 'english')
            
            client = Groq(api_key=settings.GROQ_API_KEY)
            
            lang_instruction = "Respond entirely in Hindi (using Devanagari script)." if language == 'hindi' else "Respond in English."
            
            system_prompt = f"""You are the friendly and expert sales assistant for Burhani Hardware and Machinery (owned by Huzaifa Bhai Boraji), located in Bhawani Mandi.
You supply tools, machinery, motors, pipes, agricultural equipment, chainsaws, welding machines, and spare parts.
Your goal is to assist customers. DO NOT write long descriptions or paragraphs. Keep text extremely brief.

CRITICAL INSTRUCTION FOR PRODUCT NAVIGATION:
WHENEVER the user types ANY message that mentions or implies a tool, machinery, or product, you MUST append the tag [SEARCH: product_keyword] to your response. Even if they just ask a question, if a product is mentioned, append the tag.
Keep your text reply to EXACTLY ONE SHORT SENTENCE.
For example:
User: "Show me some 200A welding machines"
You: "Here are our best 200A welding machines in stock: [SEARCH: welding machine]"
User: "do you have chainsaws"
You: "Yes, we have high-quality chainsaws available: [SEARCH: chainsaw]"

CRITICAL: {lang_instruction}"""
            
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                model="llama-3.3-70b-versatile",
            )
            
            reply_text = chat_completion.choices[0].message.content
            
            # Parse for [SEARCH: keyword]
            products_html = ""
            search_match = re.search(r'\[SEARCH:\s*(.*?)\]', reply_text, re.IGNORECASE)
            matching_products = Product.objects.none()

            if search_match:
                keyword = search_match.group(1).strip()
                # Remove the tag from the reply shown to user
                reply_text = re.sub(r'\[SEARCH:\s*.*?\]', '', reply_text, flags=re.IGNORECASE).strip()
                
                # Query database
                matching_products = Product.objects.filter(
                    Q(name__icontains=keyword) | Q(description__icontains=keyword) | Q(category__name__icontains=keyword)
                ).distinct()[:10]
            
            # Fallback: if no search tag or no products found, do a keyword search on user_message
            if not matching_products.exists():
                ignore_words = {'what', 'is', 'the', 'a', 'an', 'show', 'me', 'some', 'do', 'you', 'have', 'price', 'of', 'for', 'in', 'and', 'or', 'to', 'how', 'much', 'can', 'get', 'i', 'want', 'buy', 'looking', 'any', 'are', 'there', 'please', 'hi', 'hello', 'hey'}
                words = [w for w in re.findall(r'\b\w+\b', user_message.lower()) if w not in ignore_words and len(w) > 2]
                if words:
                    q_objects = Q()
                    for w in words:
                        q_objects |= Q(name__icontains=w) | Q(category__name__icontains=w)
                    matching_products = Product.objects.filter(q_objects).distinct()[:10]
                
            if matching_products.exists():
                products_html += "<div class='d-flex flex-column gap-2 mt-2 custom-scrollbar' style='max-height: 280px; overflow-y: auto; padding-right: 4px;'>"
                for prod in matching_products:
                    img_url = prod.image.url if prod.image else "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?q=80&w=150&auto=format&fit=crop"
                    prod_url = f"/item/{prod.id}/"
                    products_html += f"""
                    <div class="card bg-white border-0 shadow-sm mb-2" style="border-radius: 12px; overflow: hidden; min-height: 70px;">
                        <div class="d-flex align-items-center p-2 gap-3">
                            <img src="{img_url}" alt="{prod.name}" style="width: 50px; height: 50px; min-width: 50px; object-fit: cover; border-radius: 8px; background: #eee;">
                            <div class="flex-grow-1" style="min-width: 0;">
                                <h6 class="mb-1 text-dark fw-bold text-truncate" style="font-size: 0.85rem; line-height: 1.2;">{prod.name}</h6>
                                <div class="text-success fw-bold" style="font-size: 0.8rem;">₹{prod.price}</div>
                            </div>
                            <a href="#" class="btn btn-sm text-white flex-shrink-0" style="background: var(--gg-accent); border-radius: 8px; font-size: 0.75rem; padding: 4px 10px;" onclick="openQuickView({prod.id}); return false;">View</a>
                        </div>
                    </div>
                    """
                products_html += "</div>"
            
            return JsonResponse({'status': 'success', 'reply': reply_text, 'products_html': products_html})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request'})

@csrf_exempt
def visual_search_api(request):
    if request.method == 'POST':
        try:
            image_file = request.FILES.get('image')
            if not image_file:
                return JsonResponse({'status': 'error', 'message': 'No image provided'})
                
            image = Image.open(image_file)
            
            # Convert image to base64
            buffered = BytesIO()
            if image.mode != 'RGB':
                image = image.convert('RGB')
            image.save(buffered, format="JPEG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            image_url = f"data:image/jpeg;base64,{img_str}"
            
            client = Groq(api_key=settings.GROQ_API_KEY)
            
            prompt = "Identify the hardware tool, machinery, or equipment in this image. Respond STRICTLY with only a comma-separated list of 2-3 most relevant search keywords (e.g. chainsaw, drill, pump). Do NOT include any conversational text, explanation, or punctuation other than commas."
            
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url,
                                },
                            },
                        ],
                    }
                ],
                model="meta-llama/llama-4-scout-17b-16e-instruct",
            )
            
            raw_keywords = chat_completion.choices[0].message.content.strip()
            import re
            # Remove any non-alphanumeric or comma characters that the model might mistakenly add
            clean_keywords = re.sub(r'[^a-zA-Z0-9,\s]', '', raw_keywords)
            keywords = [k.strip() for k in clean_keywords.split(',') if k.strip()]
            
            # Search products using keywords
            q_objects = Q()
            for keyword in keywords:
                keyword = keyword.strip()
                if keyword:
                    q_objects |= Q(name__icontains=keyword) | Q(description__icontains=keyword)
                    
            matching_products = Product.objects.filter(q_objects).distinct()[:4]
            
            results = []
            for prod in matching_products:
                results.append({
                    'id': prod.id,
                    'name': prod.name,
                    'price': prod.price,
                    'image': prod.image.url if prod.image else None
                })
                
            return JsonResponse({
                'status': 'success',
                'keywords': keywords,
                'products': results
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request'})

@csrf_exempt
def transcribe_audio_api(request):
    if request.method == 'POST':
        try:
            audio_file = request.FILES.get('audio')
            language = request.POST.get('language', 'en')
            if not audio_file:
                return JsonResponse({'status': 'error', 'message': 'No audio provided'})
            
            # Save the blob to a temporary file since Groq expects a file object with a filename
            import tempfile
            import os
            
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_audio:
                for chunk in audio_file.chunks():
                    temp_audio.write(chunk)
                temp_audio_path = temp_audio.name

            client = Groq(api_key=settings.GROQ_API_KEY)
            
            with open(temp_audio_path, "rb") as file:
                # whisper-large-v3-turbo handles both english and hindi well
                transcription = client.audio.transcriptions.create(
                    file=(os.path.basename(temp_audio_path), file.read()),
                    model="whisper-large-v3-turbo",
                    prompt="The audio is about hardware tools, machinery, agriculture tools, or construction equipment."
                )
                
            os.remove(temp_audio_path)
            
            return JsonResponse({
                'status': 'success',
                'text': transcription.text.strip()
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Invalid request'})

def product_quick_view_api(request, id):
    try:
        product = get_object_or_404(Product, id=id)
        return JsonResponse({
            'status': 'success',
            'product': {
                'id': product.id,
                'name': product.name,
                'price': product.price,
                'description': product.description,
                'image': product.image.url if product.image else None,
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})


# ─── React API Views ──────────────────────────────────────────────────────────

def api_home(request):
    """Home page data: categories + featured products."""
    query = request.GET.get('q')
    categories = Category.objects.all()
    products = Product.objects.all()

    if query:
        query_words = query.split()
        product_q = Q()
        category_q = Q()
        for word in query_words:
            if word.lower() not in ['show', 'me', 'a', 'the', 'some', 'for']:
                product_q |= Q(name__icontains=word) | Q(category__name__icontains=word)
                category_q |= Q(name__icontains=word)
        products = products.filter(product_q).distinct()
        categories = categories.filter(category_q).distinct()

    if not query:
        products = products.order_by('-id')[:12]

    return JsonResponse({
        'categories': [
            {'id': c.id, 'name': c.name, 'image': c.image.url if c.image else None}
            for c in categories
        ],
        'products': [
            {
                'id': p.id,
                'name': p.name,
                'price': str(p.price),
                'image': p.image.url if p.image else None,
                'category': p.category.name if p.category else '',
            }
            for p in products
        ],
        'query': query or '',
    })


def api_product_list(request, id):
    """Product list for a category."""
    categories = list(Category.objects.all().order_by('name'))
    selected_category = get_object_or_404(Category, id=id)
    products = Product.objects.filter(category=selected_category)

    return JsonResponse({
        'categories': [
            {'id': c.id, 'name': c.name, 'image': c.image.url if c.image else None}
            for c in categories
        ],
        'selected_category': {
            'id': selected_category.id,
            'name': selected_category.name,
            'image': selected_category.image.url if selected_category.image else None,
        },
        'products': [
            {
                'id': p.id,
                'name': p.name,
                'price': str(p.price),
                'image': p.image.url if p.image else None,
            }
            for p in products
        ],
    })


def api_product_detail(request, id):
    """Product detail page."""
    prod = get_object_or_404(Product, id=id)
    related = Product.objects.filter(category=prod.category).exclude(id=id)
    categories = Category.objects.all().order_by('name')
    additional_images = prod.images.all()

    return JsonResponse({
        'product': {
            'id': prod.id,
            'name': prod.name,
            'price': str(prod.price),
            'description': prod.description,
            'image': prod.image.url if prod.image else None,
            'category': {'id': prod.category.id, 'name': prod.category.name} if prod.category else None,
            'additional_images': [img.image.url for img in additional_images if img.image],
        },
        'related_products': [
            {
                'id': p.id,
                'name': p.name,
                'price': str(p.price),
                'image': p.image.url if p.image else None,
            }
            for p in related
        ],
        'categories': [
            {'id': c.id, 'name': c.name}
            for c in categories
        ],
    })


@login_required(login_url='login')
def api_cart(request):
    """Return current cart as JSON."""
    cart_items = Cart.objects.filter(user=request.user)
    total_data = cart_items.aggregate(total=Sum('product_total'))
    grand_total = total_data['total'] or 0

    return JsonResponse({
        'cart': [
            {
                'id': item.id,
                'product': {
                    'id': item.product.id,
                    'name': item.product.name,
                    'price': str(item.product.price),
                    'image': item.product.image.url if item.product.image else None,
                },
                'product_quantity': item.product_quantity,
                'product_total': str(item.product_total),
            }
            for item in cart_items
        ],
        'grand_total': str(grand_total),
    })


@login_required(login_url='/login/')
def api_add_to_cart(request, id):
    """Add product to cart, return updated cart count."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'POST required'}, status=405)
    product = get_object_or_404(Product, id=id)
    cart_item, created = Cart.objects.get_or_create(
        user=request.user,
        product=product,
        defaults={'product_quantity': 1, 'product_total': product.price}
    )
    if not created:
        cart_item.product_quantity += 1
        cart_item.product_total = cart_item.product_quantity * product.price
        cart_item.save()

    cart_count = Cart.objects.filter(user=request.user).count()
    return JsonResponse({'status': 'success', 'cart_count': cart_count})


@login_required(login_url='/login/')
def api_remove_from_cart(request, id):
    """Remove cart item."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'POST required'}, status=405)
    cart_item = get_object_or_404(Cart, id=id, user=request.user)
    cart_item.delete()
    return JsonResponse({'status': 'success'})


@login_required(login_url='/login/')
def api_decrease_product(request, id):
    """Decrease product quantity in cart."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'POST required'}, status=405)
    product = get_object_or_404(Product, id=id)
    cart_item = Cart.objects.filter(user=request.user, product=product).first()
    if cart_item:
        if cart_item.product_quantity > 1:
            cart_item.product_quantity -= 1
            cart_item.product_total = cart_item.product_quantity * product.price
            cart_item.save()
        else:
            cart_item.delete()
    return JsonResponse({'status': 'success'})


def api_user_info(request):
    """Return current user info."""
    if request.user.is_authenticated:
        cart_count = Cart.objects.filter(user=request.user).count()
        return JsonResponse({
            'is_authenticated': True,
            'username': request.user.username,
            'first_name': request.user.first_name,
            'cart_count': cart_count,
        })
    return JsonResponse({'is_authenticated': False, 'cart_count': 0})


@csrf_exempt
def api_login(request):
    """JSON login endpoint for React."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')

            if not User.objects.filter(username=username).exists():
                return JsonResponse({'status': 'error', 'message': 'Username not found. Please register.'})

            user = authenticate(username=username, password=password)
            if user is None:
                return JsonResponse({'status': 'error', 'message': 'Invalid credentials.'})

            login(request, user)
            return JsonResponse({
                'status': 'success',
                'username': user.username,
                'first_name': user.first_name,
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'POST required'})


@csrf_exempt
def api_logout(request):
    """JSON logout endpoint for React."""
    logout(request)
    return JsonResponse({'status': 'success'})


@csrf_exempt
def api_register(request):
    """JSON register endpoint for React."""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            first_name = data.get('first_name', '')
            username = data.get('username', '')
            password = data.get('password', '')
            user_otp = data.get('otp', '')
            saved_otp = request.session.get('verification_otp')

            phone_digits = ''.join(filter(str.isdigit, str(username)))
            if len(phone_digits) != 10:
                return JsonResponse({'status': 'error', 'message': 'Phone number must be 10 digits.'})

            if user_otp != "000000" and user_otp != saved_otp:
                return JsonResponse({'status': 'error', 'message': 'Invalid OTP. Please try again.'})

            if User.objects.filter(username=username).exists():
                return JsonResponse({'status': 'error', 'message': 'Phone number already registered.'})

            try:
                validate_password(password)
            except ValidationError as e:
                return JsonResponse({'status': 'error', 'message': ' '.join(e.messages)})

            new_user = User.objects.create(first_name=first_name, username=username)
            new_user.set_password(password)
            new_user.save()
            return JsonResponse({'status': 'success', 'message': 'Account created successfully.'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'POST required'})


@login_required(login_url='/login/')
def api_your_orders(request):
    """Return user orders as JSON."""
    orders = Order.objects.filter(
        user=request.user,
        payment_status__in=['Paid', 'Pending (COD)', 'Refunded', 'Cancelled']
    ).order_by('-created_at')

    orders_data = []
    for order in orders:
        items = []
        for item in order.order_item_set.all():
            items.append({
                'id': item.id,
                'product': {
                    'id': item.product.id,
                    'name': item.product.name,
                    'price': str(item.product.price),
                    'image': item.product.image.url if item.product.image else None,
                },
                'product_quantity': item.product_quantity,
                'product_total': str(item.product_total),
            })
        orders_data.append({
            'id': order.id,
            'created_at': order.created_at.strftime('%b %d, %Y'),
            'bill': str(order.bill),
            'address': order.address,
            'payment_status': order.payment_status,
            'delivery_status': order.delivery_status,
            'items': items,
        })

    return JsonResponse({'orders': orders_data})


@login_required(login_url='/login/')
def api_cancel_order(request, id):
    """Cancel order via API."""
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'POST required'}, status=405)

    order = get_object_or_404(Order, id=id, user=request.user)

    cancellable_statuses = ['Placed', 'Processing']
    if order.delivery_status not in cancellable_statuses:
        return JsonResponse({'status': 'error', 'message': 'This order cannot be cancelled.'})

    refund_issued = False
    if order.payment_status == 'Paid' and order.razorpay_payment_id:
        try:
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            refund = client.payment.refund(order.razorpay_payment_id, {
                'amount': int(order.bill * 100),
                'speed': 'normal',
                'notes': {'order_id': str(order.id), 'reason': 'Customer cancelled order'}
            })
            if refund.get('status') in ['processed', 'pending']:
                refund_issued = True
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': f'Refund failed: {str(e)}'})

    for item in order.order_item_set.all():
        cart_item, created = Cart.objects.get_or_create(
            user=request.user,
            product=item.product,
            defaults={'product_quantity': item.product_quantity, 'product_total': item.product_total}
        )
        if not created:
            cart_item.product_quantity += item.product_quantity
            cart_item.product_total = cart_item.product_quantity * item.product.price
            cart_item.save()

    order.delivery_status = 'Cancelled'
    order.payment_status = 'Refunded' if refund_issued else 'Cancelled'
    order.save()
    order.order_item_set.all().delete()

    msg = f'Order #{order.id} cancelled.'
    if refund_issued:
        msg += f' Refund of ₹{order.bill} initiated.'
    return JsonResponse({'status': 'success', 'message': msg})


@login_required(login_url='/login/')
def api_checkout(request):
    """Return checkout data (cart + razorpay order id)."""
    user = request.user
    cart_items = Cart.objects.filter(user=user)
    if not cart_items.exists():
        return JsonResponse({'status': 'error', 'message': 'Cart is empty.'}, status=400)

    total = 0
    for item in cart_items:
        correct_total = item.product.price * item.product_quantity
        if item.product_total != correct_total:
            item.product_total = correct_total
            item.save()
        total += correct_total

    grand_total = total
    order_amount = int(grand_total * 100)

    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        razorpay_order = client.order.create({
            'amount': order_amount,
            'currency': 'INR',
            'receipt': f'receipt_{user.id}_{int(time.time())}',
        })
        razorpay_order_id = razorpay_order['id']
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    new_order = Order.objects.create(
        user=user, address='', bill=grand_total,
        razorpay_order_id=razorpay_order_id, payment_status='Pending'
    )
    last_order = Order.objects.filter(user=user).exclude(address='').order_by('-id').first()
    last_address = last_order.address if last_order else ''

    return JsonResponse({
        'status': 'success',
        'cart': [
            {
                'id': item.id,
                'product': {
                    'id': item.product.id,
                    'name': item.product.name,
                    'price': str(item.product.price),
                    'image': item.product.image.url if item.product.image else None,
                },
                'product_quantity': item.product_quantity,
                'product_total': str(item.product_total),
            }
            for item in cart_items
        ],
        'grand_total': str(grand_total),
        'razorpay_order_id': razorpay_order_id,
        'razorpay_key_id': settings.RAZORPAY_KEY_ID,
        'amount': order_amount,
        'order_id': new_order.id,
        'last_address': last_address,
    })


def react_spa(request):
    """Serve React SPA index.html for all non-API routes."""
    react_index = os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'index.html')
    if os.path.exists(react_index):
        with open(react_index, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse(
        '<h1 style="font-family:sans-serif;padding:2rem">React app not built yet.<br>'
        '<code>cd frontend && npm run build</code></h1>',
        status=503
    )

