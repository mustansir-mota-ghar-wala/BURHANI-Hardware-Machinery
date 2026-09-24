from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='category_images', null=True, blank=True)
    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='products_image', null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Selling Price Incl GST
    is_spare_part = models.BooleanField(default=False)
    is_machinery = models.BooleanField(default=False)
    is_power_tools = models.BooleanField(default=False)
    
    # Business Management Fields
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Last purchase price
    avg_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Weighted Average Cost (Taxable)
    stock_qty = models.IntegerField(default=0)
    gst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    barcode = models.CharField(max_length=200, null=True, blank=True)
    low_stock_limit = models.IntegerField(default=5)
    show_on_website = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    product_quantity = models.IntegerField()
    product_total = models.DecimalField(max_digits=10, decimal_places=2)

class Order(models.Model):
    ORDER_STATUS_CHOICES = (
        ('Placed', 'Order Placed'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Out for Delivery', 'Out for Delivery'),
        ('Delivered', 'Delivered'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    address = models.TextField()
    bill = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, default='Pending')
    delivery_status = models.CharField(max_length=50, choices=ORDER_STATUS_CHOICES, default='Placed')
    razorpay_order_id = models.CharField(max_length=100, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True,null=True,blank=True)
    def save(self, *args, **kwargs):
        # Automatically set payment status to 'Paid' when delivery is 'Delivered'
        if self.delivery_status == 'Delivered':
            self.payment_status = 'Paid'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"
    
class Order_Item(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    product_quantity = models.IntegerField()
    product_total = models.DecimalField(max_digits=10, decimal_places=2)
    def __str__(self):
        return self.product.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products_image')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Image for {self.product.name}"

class ProductVideo(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='videos')
    video = models.FileField(upload_to='products_video')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Video for {self.product.name}"


class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('owner', 'Business Owner'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Party(models.Model):
    PARTY_TYPES = (
        ('customer', 'Customer'),
        ('supplier', 'Supplier'),
    )

    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    gstin = models.CharField(max_length=15, blank=True, null=True)
    party_type = models.CharField(max_length=20, choices=PARTY_TYPES)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.name} ({self.party_type})"


class Sale(models.Model):
    customer = models.ForeignKey(Party, on_delete=models.SET_NULL, null=True, blank=True)
    sale_date = models.DateTimeField(default=timezone.now)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_mode = models.CharField(max_length=20, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    order = models.OneToOneField(Order, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Sale #{self.id}"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.IntegerField()
    price_incl_gst = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    taxable_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, default=0) # Cost price at time of sale for profit calculation
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class Purchase(models.Model):
    supplier = models.ForeignKey(Party, on_delete=models.SET_NULL, null=True, blank=True)
    invoice_no = models.CharField(max_length=50, blank=True, null=True)
    purchase_date = models.DateTimeField(default=timezone.now)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_mode = models.CharField(max_length=20, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Purchase #{self.id}"


class PurchaseItem(models.Model):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.IntegerField()
    price_incl_gst = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    taxable_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    sgst_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


class Payment(models.Model):
    PAYMENT_TYPES = (
        ('received', 'Received'),
        ('paid', 'Paid'),
    )

    PAYMENT_MODES = (
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('bank', 'Bank'),
    )

    party = models.ForeignKey(Party, on_delete=models.CASCADE)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODES)
    payment_date = models.DateTimeField(default=timezone.now)
    note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.payment_type} {self.amount} - {self.party.name}"


class Transaction(models.Model):
    """Hidden Accounting Entries"""
    date = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255)
    account_name = models.CharField(max_length=100) # e.g. 'Purchase Account', 'Cash', 'Input CGST'
    debit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reference_id = models.IntegerField(null=True, blank=True)
    reference_type = models.CharField(max_length=50, null=True, blank=True) # Purchase, Sale, Payment

    def __str__(self):
        return f"{self.date} - {self.account_name} - D:{self.debit} C:{self.credit}"