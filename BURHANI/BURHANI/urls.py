from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from BurhaniApp.views import (
    home, product, register, Login, Logout, cart, add_to_cart,
    remove_from_cart, decrease_product, checkout, place_order,
    your_orders, payment_callback, send_otp, verify_otp,
    robots_txt, sitemap_xml, product_detail, buy_now, save_address,
    chat_api, visual_search_api, transcribe_audio_api, product_quick_view_api
)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('robots.txt', robots_txt, name='robots_txt'),
    path('sitemap.xml', sitemap_xml, name='sitemap_xml'),
    path('register/', register, name='register'),
    path('login/', Login, name='login'),
    path('logout/', Logout, name='logout'),
    path('', home, name='home'),
    path('product/<int:id>/', product, name='product'),
    path('item/<int:id>/', product_detail, name='product_detail'),
    path('cart/', cart, name='cart'),
    path('checkout/', checkout, name='checkout'),
    path('add-to-cart/<int:id>/', add_to_cart, name='add_to_cart'),
    path('buy-now/<int:id>/', buy_now, name='buy_now'),
    path('remove-from-cart/<int:id>/', remove_from_cart, name='remove_from_cart'),
    path('decrease_item/<int:id>',decrease_product,name='decrease_product'),
    path('order/', place_order, name='order'),
    path('your_orders/', your_orders, name='your_orders'),
    path('send-otp/', send_otp, name='send_otp'),
    path('verify-otp/', verify_otp, name='verify_otp'),
    path('payment-callback/', payment_callback, name='payment_callback'),
    path('save-address/', save_address, name='save_address'),
    path('api/chat/', chat_api, name='chat_api'),
    path('api/visual-search/', visual_search_api, name='visual_search_api'),
    path('api/transcribe/', transcribe_audio_api, name='transcribe_audio_api'),
    path('api/product-quick-view/<int:id>/', product_quick_view_api, name='product_quick_view_api'),

    path('accounts/', include('allauth.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += staticfiles_urlpatterns()
