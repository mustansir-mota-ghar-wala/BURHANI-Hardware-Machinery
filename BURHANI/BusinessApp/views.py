"""
BusinessApp views module.
All views have been migrated to JSON REST API endpoints in api_views.py
to power the React SPA frontend.
"""
from .api_views import (
    dashboard_api as dashboard,
    products_api as product_list,
    product_detail_api as product_detail,
    categories_api as categories,
    parties_api as party_list,
    party_detail_api as party_detail,
    sales_api as sale_list,
    sale_detail_api as sale_detail,
    purchases_api as purchase_list,
    purchase_detail_api as purchase_detail,
    payments_api as payment_list,
    reports_gst_api as report_gst,
    reports_outstanding_api as report_outstanding,
)
