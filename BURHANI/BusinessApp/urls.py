from django.urls import path
from . import api_views

urlpatterns = [
    # Dashboard
    path('dashboard/', api_views.dashboard_api, name='api_business_dashboard'),

    # Products & Categories
    path('products/', api_views.products_api, name='api_business_products'),
    path('products/<int:id>/', api_views.product_detail_api, name='api_business_product_detail'),
    path('categories/', api_views.categories_api, name='api_business_categories'),

    # Parties (Customers & Suppliers)
    path('parties/', api_views.parties_api, name='api_business_parties'),
    path('parties/<int:id>/', api_views.party_detail_api, name='api_business_party_detail'),

    # Sales & Invoices
    path('sales/', api_views.sales_api, name='api_business_sales'),
    path('sales/<int:id>/', api_views.sale_detail_api, name='api_business_sale_detail'),

    # Purchases & Inward Stock
    path('purchases/', api_views.purchases_api, name='api_business_purchases'),
    path('purchases/<int:id>/', api_views.purchase_detail_api, name='api_business_purchase_detail'),

    # Payments & Ledger
    path('payments/', api_views.payments_api, name='api_business_payments'),

    # Financial & GST Reports
    path('reports/gst/', api_views.reports_gst_api, name='api_business_reports_gst'),
    path('reports/outstanding/', api_views.reports_outstanding_api, name='api_business_reports_outstanding'),
]
