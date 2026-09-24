from django.contrib import admin
from .models import (
    Category, Product, Cart, Order, Order_Item, ProductImage, ProductVideo,
    UserProfile, Party, Sale, SaleItem, Purchase, PurchaseItem, Payment, Transaction
)
# Register your models here.

admin.site.register(Category)
admin.site.register(Cart)
admin.site.register(Order_Item)
admin.site.register(UserProfile)
admin.site.register(Party)
admin.site.register(Sale)
admin.site.register(SaleItem)
admin.site.register(Purchase)
admin.site.register(PurchaseItem)
admin.site.register(Payment)
admin.site.register(Transaction)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3

class ProductVideoInline(admin.TabularInline):
    model = ProductVideo
    extra = 1

class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline, ProductVideoInline]

admin.site.register(Product, ProductAdmin)

class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'bill', 'payment_status', 'delivery_status', 'created_at')
    list_editable = ('delivery_status',)

admin.site.register(Order, OrderAdmin)
