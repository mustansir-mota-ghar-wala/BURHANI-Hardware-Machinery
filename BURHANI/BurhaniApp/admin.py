from django.contrib import admin
from .models import (
    Category, Product, Cart, Order, Order_Item, UserProfile, Party,
    Sale, SaleItem, Purchase, PurchaseItem, Payment
)
# Register your models here.

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Cart)
admin.site.register(Order_Item)
admin.site.register(UserProfile)
admin.site.register(Party)
admin.site.register(Sale)
admin.site.register(SaleItem)
admin.site.register(Purchase)
admin.site.register(PurchaseItem)
admin.site.register(Payment)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'bill', 'payment_status', 'delivery_status', 'created_at')
    list_editable = ('delivery_status',)

admin.site.register(Order, OrderAdmin)
