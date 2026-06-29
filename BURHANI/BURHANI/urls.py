import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from BurhaniApp.views import (
    # ── Legacy views still needed for payment callbacks ──
    place_order, payment_callback, send_otp, verify_otp,
    save_address, cancel_order,
    chat_api, visual_search_api, transcribe_audio_api, product_quick_view_api,
    robots_txt, sitemap_xml,

    # ── React JSON API views ──
    api_home, api_product_list, api_product_detail,
    api_cart, api_add_to_cart, api_remove_from_cart, api_decrease_product,
    api_user_info, api_login, api_logout, api_register,
    api_your_orders, api_cancel_order, api_checkout,

    # ── React SPA entry point ──
    react_spa,
)


urlpatterns = [
    # ── Admin ──
    path('admin/', admin.site.urls),

    # ── SEO ──
    path('robots.txt', robots_txt, name='robots_txt'),
    path('sitemap.xml', sitemap_xml, name='sitemap_xml'),

    # ── Google / Social Auth ──
    path('accounts/', include('allauth.urls')),

    # ── Old backend views still needed (payment flow, OTP, etc.) ──
    path('api/chat/', chat_api, name='chat_api'),
    path('api/visual-search/', visual_search_api, name='visual_search_api'),
    path('api/transcribe/', transcribe_audio_api, name='transcribe_audio_api'),
    path('api/product-quick-view/<int:id>/', product_quick_view_api, name='product_quick_view_api'),

    # ── React JSON API endpoints ──
    path('api/react/home/', api_home, name='api_home'),
    path('api/react/products/<int:id>/', api_product_list, name='api_product_list'),
    path('api/react/product/<int:id>/', api_product_detail, name='api_product_detail'),
    path('api/react/cart/', api_cart, name='api_cart'),
    path('api/react/cart/add/<int:id>/', api_add_to_cart, name='api_add_to_cart'),
    path('api/react/cart/remove/<int:id>/', api_remove_from_cart, name='api_remove_from_cart'),
    path('api/react/cart/decrease/<int:id>/', api_decrease_product, name='api_decrease_product'),
    path('api/react/user/', api_user_info, name='api_user_info'),
    path('api/react/login/', api_login, name='api_login'),
    path('api/react/logout/', api_logout, name='api_logout'),
    path('api/react/register/', api_register, name='api_register'),
    path('api/react/orders/', api_your_orders, name='api_your_orders'),
    path('api/react/orders/cancel/<int:id>/', api_cancel_order, name='api_cancel_order'),
    path('api/react/checkout/', api_checkout, name='api_checkout'),
    path('api/react/place-order/', place_order, name='api_place_order'),
    path('api/react/payment-callback/', payment_callback, name='api_payment_callback'),
    path('api/react/save-address/', save_address, name='api_save_address'),
    path('api/react/send-otp/', send_otp, name='api_send_otp'),
    path('api/react/verify-otp/', verify_otp, name='api_verify_otp'),
    path('api/react/cancel-order/<int:id>/', cancel_order, name='api_cancel_order_legacy'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

from django.views.static import serve

# ── Serve React built assets (/assets/index-xxx.js, /assets/index-xxx.css) ──
# Vite builds to frontend/dist/assets/ and the HTML references /assets/...
REACT_DIST = os.path.join(settings.BASE_DIR, 'frontend', 'dist')
urlpatterns += [
    re_path(r'^assets/(?P<path>.*)$', serve, {'document_root': os.path.join(REACT_DIST, 'assets')}),
]

urlpatterns += staticfiles_urlpatterns()

# ── Catch-all: ALL routes not matched above → serve React SPA ──
# React Router handles /  /cart  /login  /product/1  etc.
urlpatterns += [
    re_path(r'^.*$', react_spa, name='react_spa'),
]
