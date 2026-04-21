from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Q
from .models import Category, Product, Cart, Order,Order_Item

def register(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = User.objects.filter(username=username)
        if user.exists():
            messages.info(request, 'Username already taken')
            return redirect('register')
        
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
        if not User.objects.filter(username=username):
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
        defaults={'product_quantity': 1, 'product_total': product.price}
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

def checkout(request):
    user = request.user
    cart = Cart.objects.filter(user=user)
    total = 0
    for product in cart :
        total = product.product_total+total
    grand_total = total + 50 
    context = {'cart':cart,'grand_total':grand_total}
    return render(request,'checkout.html',context)


@login_required(login_url='login')
def place_order(request):
    if request.method == "POST":
        user = request.user
        address = request.POST.get('address')
        user_cart = Cart.objects.filter(user=user)
        
        if not user_cart.exists():
            return redirect('cart')

        total = 0
        for item in user_cart :
            total = total + item.product_total
        grand_total = total + 50

        new_order = Order.objects.create(
            user = user,
            address = address,
            bill = grand_total
        )
        
        for item in user_cart:
            Order_Item.objects.create(
                order = new_order,
                product = item.product,
                product_quantity = item.product_quantity,
                product_total = item.product_total
            )
        
        # Clear the cart after placing order
        user_cart.delete()
        messages.success(request, 'Order placed successfully!')
        return redirect('your_orders')
        
    return redirect('checkout')

@login_required(login_url='login')
def your_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    context = {'orders': orders}
    return render(request, 'your_order.html', context)

# TEMPORARY: Emergency Superuser Creation
def create_admin_emergency(request):
    from django.contrib.auth.models import User
    from django.contrib import messages
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        messages.success(request, 'Admin created! User: admin, Pass: admin123')
    else:
        messages.info(request, 'Admin already exists!')
    return redirect('home')
