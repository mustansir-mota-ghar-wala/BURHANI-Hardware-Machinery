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
        products = products.filter(
            Q(name__icontains=query) |
            Q(category__name__icontains=query)
        )
        categories = categories.filter(name__icontains=query)

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

    total = sum(item.product_total for item in cart_items)
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

        if order_id:
            try:
                new_order = Order.objects.get(id=order_id, user=user)
                new_order.address = address
                new_order.payment_status = 'Pending (COD)'
                new_order.save()
            except Order.DoesNotExist:
                total = sum(item.product_total for item in user_cart)
                grand_total = total
                new_order = Order.objects.create(
                    user=user,
                    address=address,
                    bill=grand_total,
                    payment_status='Pending (COD)'
                )
        else:
            total = sum(item.product_total for item in user_cart)
            grand_total = total
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
        payment_status__in=['Paid', 'Pending (COD)']
    ).order_by('-created_at')

    context = {'orders': orders}
    return render(request, 'your_order.html', context)


def send_otp(request):
    if request.method == 'POST':
        try:
            # --- Backend Cooldown Protection ---
            last_sent = request.session.get('last_otp_time')
            current_time = time.time()
            if last_sent and (current_time - last_sent) < 60:
                remaining = int(60 - (current_time - last_sent))
                return JsonResponse({
                    'status': 'cooldown', 
                    'message': f'Please wait {remaining} seconds before requesting another OTP.'
                })

            data = json.loads(request.body)
            phone = data.get('phone', '')
            phone = ''.join(filter(str.isdigit, phone))
            if len(phone) > 10: phone = phone[-10:]
            
            otp = str(random.randint(100000, 999999))
            request.session['verification_otp'] = otp
            request.session['last_otp_time'] = current_time # Save the time we sent it
            
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
    related_products = Product.objects.filter(category=product.category).exclude(id=id)[:4]
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
