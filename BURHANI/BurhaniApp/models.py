from django.db import models
from django.contrib.auth.models import User
# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='category_images', null=True, blank=True)
    def __str__(self):
        return self.name

class Product(models.Model):
    category = models.ForeignKey(Category,on_delete=models.CASCADE,related_name='category')
    name = models.CharField(max_length=100)
    description = models.TextField()
    image = models.ImageField(upload_to='products_image', null=True, blank=True)
    price = models.IntegerField()
    is_spare_part = models.BooleanField(default=False)
    is_machinery = models.BooleanField(default=False)
    is_power_tools = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Cart(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    product = models.ForeignKey(Product,on_delete=models.CASCADE)
    product_quantity = models.IntegerField()
    product_total = models.IntegerField()

class Order(models.Model):
    ORDER_STATUS_CHOICES = (
        ('Placed', 'Order Placed'),
        ('Processing', 'Processing'),
        ('Shipped', 'Shipped'),
        ('Out for Delivery', 'Out for Delivery'),
        ('Delivered', 'Delivered'),
    )
    user = models.ForeignKey(User,on_delete=models.CASCADE)
    address = models.TextField()
    bill = models.IntegerField()
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
    order = models.ForeignKey(Order,on_delete=models.CASCADE)
    product = models.ForeignKey(Product,on_delete=models.CASCADE)
    product_quantity = models.IntegerField()
    product_total = models.IntegerField()
    def __str__(self):
        return self.product.name


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products_image')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Image for {self.product.name}"