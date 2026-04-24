from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from BurhaniApp.views import (
    home, product, register, Login, Logout, cart, add_to_cart,
    remove_from_cart, decrease_product, checkout, place_order,
    your_orders, payment_callback, send_otp, verify_otp
)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('register/', register, name='register'),
    path('login/', Login, name='login'),
    path('logout/', Logout, name='logout'),
    path('', home, name='home'),
    path('product/<int:id>/', product, name='product'),
    path('cart/', cart, name='cart'),
    path('checkout/', checkout, name='checkout'),
    path('add-to-cart/<int:id>/', add_to_cart, name='add_to_cart'),
    path('remove-from-cart/<int:id>/', remove_from_cart, name='remove_from_cart'),
    path('decrease_item/<int:id>',decrease_product,name='decrease_product'),
    path('order/', place_order, name='order'),
    path('your_orders/', your_orders, name='your_orders'),
    path('send-otp/', send_otp, name='send_otp'),
    path('verify-otp/', verify_otp, name='verify_otp'),
    path('payment-callback/', payment_callback, name='payment_callback'),

    path('accounts/', include('allauth.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += staticfiles_urlpatterns()