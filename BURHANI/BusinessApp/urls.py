from django.urls import path

from . import views


urlpatterns = [
    path('', views.dashboard, name='business_dashboard'),
    path('products/', views.product_list, name='business_products'),
    path('products/add/', views.product_add, name='business_product_add'),
    path('products/edit/<int:id>/', views.product_edit, name='business_product_edit'),
    path('customers/', views.customer_list, name='business_customers'),
    path('suppliers/', views.supplier_list, name='business_suppliers'),
    path('parties/add/', views.party_add, name='business_party_add'),
    path('parties/edit/<int:id>/', views.party_edit, name='business_party_edit'),
    path('sales/', views.sale_list, name='business_sales'),
    path('sales/add/', views.sale_add, name='business_sale_add'),
    path('purchases/', views.purchase_list, name='business_purchases'),
    path('purchases/add/', views.purchase_add, name='business_purchase_add'),
    path('payments/', views.payment_list, name='business_payments'),
    path('payments/add/', views.payment_add, name='business_payment_add'),
    path('reports/gst/', views.report_gst, name='business_report_gst'),
    path('products/delete/<int:id>/', views.product_delete, name='business_product_delete'),
    path('parties/delete/<int:id>/', views.party_delete, name='business_party_delete'),
    path('reports/outstanding/', views.report_outstanding, name='business_report_outstanding'),
    path('parties/quick-add/', views.quick_add_party, name='business_party_quick_add'),
]
