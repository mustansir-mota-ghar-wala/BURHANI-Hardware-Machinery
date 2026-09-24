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