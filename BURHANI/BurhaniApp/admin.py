from django.contrib import admin
from .models import Category, Product, Cart, Order, ProductImage
# Register your models here.

admin.site.register(Category)
admin.site.register(Cart)

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3

class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline]

admin.site.register(Product, ProductAdmin)

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'bill', 'payment_status', 'delivery_status', 'created_at')
    list_editable = ('delivery_status',)

admin.site.register(Order, OrderAdmin)