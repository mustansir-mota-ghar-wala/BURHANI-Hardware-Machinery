from django.contrib import admin
from .models import Category, Product, Cart, Order
# Register your models here.

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(Cart)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'bill', 'payment_status', 'delivery_status', 'created_at')
    list_editable = ('delivery_status',)

admin.site.register(Order, OrderAdmin)