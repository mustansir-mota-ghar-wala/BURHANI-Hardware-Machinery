import json
from decimal import Decimal
from django.db import transaction
from django.db.models import F, Sum, Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from BurhaniApp.models import (
    Category, Party, Payment, Product, Purchase,
    PurchaseItem, Sale, SaleItem, Transaction
)
from .decorators import owner_required
from .utils import calculate_gst_extraction, update_weighted_average_cost


@owner_required
def dashboard_api(request):
    today = timezone.localtime(timezone.now()).date()

    latest_sale = Sale.objects.order_by('-sale_date').first()
    latest_date = timezone.localtime(latest_sale.sale_date).date() if latest_sale else today
    end_date = max(today, latest_date)

    today_sales = Sale.objects.filter(sale_date__date=today).aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')

    today_purchases = Purchase.objects.filter(purchase_date__date=today).aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')

    total_products = Product.objects.count()
    low_stock_qs = Product.objects.filter(stock_qty__lte=F('low_stock_limit')).select_related('category')
    low_stock_products = [
        {
            'id': p.id,
            'name': p.name,
            'category': p.category.name if p.category else 'General',
            'stock_qty': p.stock_qty,
            'low_stock_limit': p.low_stock_limit,
            'price': float(p.price),
        }
        for p in low_stock_qs[:10]
    ]

    stock_value = Product.objects.aggregate(
        total=Sum(F('stock_qty') * F('avg_cost'))
    )['total'] or Decimal('0.00')

    pending_customer_payments = Party.objects.filter(
        party_type='customer'
    ).aggregate(total=Sum('balance'))['total'] or Decimal('0.00')

    pending_supplier_payments = Party.objects.filter(
        party_type='supplier'
    ).aggregate(total=Sum('balance'))['total'] or Decimal('0.00')

    input_cgst = Transaction.objects.filter(account_name='Input CGST').aggregate(total=Sum('debit'))['total'] or Decimal('0.00')
    input_sgst = Transaction.objects.filter(account_name='Input SGST').aggregate(total=Sum('debit'))['total'] or Decimal('0.00')
    output_cgst = Transaction.objects.filter(account_name='Output CGST').aggregate(total=Sum('credit'))['total'] or Decimal('0.00')
    output_sgst = Transaction.objects.filter(account_name='Output SGST').aggregate(total=Sum('credit'))['total'] or Decimal('0.00')

    gst_credit = (input_cgst + input_sgst) - (output_cgst + output_sgst)

    total_taxable_sales = SaleItem.objects.aggregate(total=Sum('taxable_value'))['total'] or Decimal('0.00')
    total_cogs = SaleItem.objects.aggregate(total=Sum(F('quantity') * F('cost_price')))['total'] or Decimal('0.00')
    gross_profit = total_taxable_sales - total_cogs

    sales_trend = []
    purchases_trend = []
    days = []
    for i in range(6, -1, -1):
        d = end_date - timezone.timedelta(days=i)
        daily_sale = Sale.objects.filter(sale_date__date=d).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        daily_purchase = Purchase.objects.filter(purchase_date__date=d).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        sales_trend.append(float(daily_sale))
        purchases_trend.append(float(daily_purchase))
        days.append(d.strftime('%d %b'))

    recent_sales = [
        {
            'id': s.id,
            'customer_name': s.customer.name if s.customer else 'Walk-in Customer',
            'total_amount': float(s.total_amount),
            'paid_amount': float(s.paid_amount),
            'balance_amount': float(s.balance_amount),
            'payment_mode': s.payment_mode or 'Cash',
            'sale_date': s.sale_date.strftime('%d %b %Y, %I:%M %p'),
        }
        for s in Sale.objects.select_related('customer').order_by('-id')[:6]
    ]

    total_sales_count = Sale.objects.count()
    total_customers_count = Party.objects.filter(party_type='customer').count()
    total_all_revenue = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
    month_start = today.replace(day=1)
    month_sales = Sale.objects.filter(sale_date__date__gte=month_start).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

    top_items = SaleItem.objects.values('product__id', 'product__name', 'product__barcode').annotate(
        total_qty=Sum('quantity')
    ).order_by('-total_qty')[:5]
    top_products = [
        {
            'id': item['product__id'],
            'name': item['product__name'] or 'Product',
            'code': item['product__barcode'] or f"SKU-{item['product__id']}",
            'orders': int(item['total_qty'] or 0),
        }
        for item in top_items if item['product__id']
    ]
    if not top_products:
        top_products = [
            {'id': p.id, 'name': p.name, 'code': p.barcode or f"SKU-{p.id}", 'orders': int(p.stock_qty)}
            for p in Product.objects.all()[:4]
        ]

    return JsonResponse({
        'status': 'success',
        'today_sales': float(today_sales),
        'today_purchases': float(today_purchases),
        'total_revenue': float(total_all_revenue),
        'month_sales': float(month_sales),
        'total_orders': total_sales_count,
        'total_customers': total_customers_count,
        'total_products': total_products,
        'low_stock_count': low_stock_qs.count(),
        'low_stock_products': low_stock_products,
        'stock_value': float(stock_value),
        'pending_customer_payments': float(pending_customer_payments),
        'pending_supplier_payments': float(pending_supplier_payments),
        'gst_credit': float(gst_credit),
        'gross_profit': float(gross_profit),
        'recent_sales': recent_sales,
        'top_products': top_products,
        'sales_trend': sales_trend,
        'purchases_trend': purchases_trend,
        'days_labels': days,
    })



@owner_required
@csrf_exempt
def products_api(request):
    if request.method == 'GET':
        query = request.GET.get('q', '').strip()
        category_id = request.GET.get('category')
        low_stock_only = request.GET.get('low_stock') == 'true'

        products_qs = Product.objects.select_related('category').order_by('-id')
        if query:
            products_qs = products_qs.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(barcode__icontains=query)
            )
        if category_id:
            products_qs = products_qs.filter(category_id=category_id)
        if low_stock_only:
            products_qs = products_qs.filter(stock_qty__lte=F('low_stock_limit'))

        stock_value = Product.objects.aggregate(
            total=Sum(F('stock_qty') * F('avg_cost'))
        )['total'] or Decimal('0.00')
        low_stock_count = Product.objects.filter(stock_qty__lte=F('low_stock_limit')).count()

        items = [
            {
                'id': p.id,
                'name': p.name,
                'category_id': p.category_id,
                'category_name': p.category.name if p.category else 'General',
                'description': p.description or '',
                'price': float(p.price),
                'purchase_price': float(p.purchase_price),
                'avg_cost': float(p.avg_cost),
                'stock_qty': p.stock_qty,
                'gst_percent': float(p.gst_percent),
                'barcode': p.barcode or '',
                'low_stock_limit': p.low_stock_limit,
                'is_low_stock': p.stock_qty <= p.low_stock_limit,
                'show_on_website': p.show_on_website,
                'is_spare_part': p.is_spare_part,
                'is_machinery': p.is_machinery,
                'is_power_tools': p.is_power_tools,
                'image_url': p.image.url if p.image else None,
            }
            for p in products_qs
        ]

        return JsonResponse({
            'status': 'success',
            'products': items,
            'total_count': len(items),
            'stock_value': float(stock_value),
            'low_stock_count': low_stock_count,
        })

    elif request.method == 'POST':
        try:
            if request.content_type and 'application/json' in request.content_type:
                data = json.loads(request.body)
            else:
                data = request.POST

            name = data.get('name')
            if not name:
                return JsonResponse({'status': 'error', 'message': 'Product name is required.'}, status=400)

            category_id = data.get('category')
            category = Category.objects.filter(id=category_id).first() if category_id else Category.objects.first()

            product = Product.objects.create(
                name=name,
                category=category,
                description=data.get('description', ''),
                price=Decimal(str(data.get('price') or 0)),
                purchase_price=Decimal(str(data.get('purchase_price') or 0)),
                avg_cost=Decimal(str(data.get('avg_cost') or data.get('purchase_price') or 0)),
                stock_qty=int(data.get('stock_qty') or 0),
                gst_percent=Decimal(str(data.get('gst_percent') or 18)),
                barcode=data.get('barcode', ''),
                low_stock_limit=int(data.get('low_stock_limit') or 5),
                show_on_website=str(data.get('show_on_website', 'true')).lower() in ['true', '1'],
                is_spare_part=str(data.get('is_spare_part', 'false')).lower() in ['true', '1'],
                is_machinery=str(data.get('is_machinery', 'false')).lower() in ['true', '1'],
                is_power_tools=str(data.get('is_power_tools', 'false')).lower() in ['true', '1'],
            )

            if 'image' in request.FILES:
                product.image = request.FILES['image']
                product.save()

            return JsonResponse({
                'status': 'success',
                'message': 'Product created successfully',
                'product_id': product.id
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@owner_required
@csrf_exempt
def product_detail_api(request, id):
    product = get_object_or_404(Product, id=id)

    if request.method == 'GET':
        return JsonResponse({
            'status': 'success',
            'product': {
                'id': product.id,
                'name': product.name,
                'category_id': product.category_id,
                'category_name': product.category.name if product.category else 'General',
                'description': product.description,
                'price': float(product.price),
                'purchase_price': float(product.purchase_price),
                'avg_cost': float(product.avg_cost),
                'stock_qty': product.stock_qty,
                'gst_percent': float(product.gst_percent),
                'barcode': product.barcode or '',
                'low_stock_limit': product.low_stock_limit,
                'show_on_website': product.show_on_website,
                'is_spare_part': product.is_spare_part,
                'is_machinery': product.is_machinery,
                'is_power_tools': product.is_power_tools,
                'image_url': product.image.url if product.image else None,
            }
        })

    elif request.method in ['POST', 'PUT']:
        try:
            if request.content_type and 'application/json' in request.content_type:
                data = json.loads(request.body)
            else:
                data = request.POST

            if 'name' in data and data['name']:
                product.name = data['name']
            if 'category' in data and data['category']:
                product.category_id = data['category']
            if 'description' in data:
                product.description = data['description']
            if 'price' in data:
                product.price = Decimal(str(data['price']))
            if 'purchase_price' in data:
                product.purchase_price = Decimal(str(data['purchase_price']))
            if 'avg_cost' in data:
                product.avg_cost = Decimal(str(data['avg_cost']))
            if 'stock_qty' in data:
                product.stock_qty = int(data['stock_qty'])
            if 'gst_percent' in data:
                product.gst_percent = Decimal(str(data['gst_percent']))
            if 'barcode' in data:
                product.barcode = data['barcode']
            if 'low_stock_limit' in data:
                product.low_stock_limit = int(data['low_stock_limit'])
            if 'show_on_website' in data:
                product.show_on_website = str(data['show_on_website']).lower() in ['true', '1']
            if 'is_spare_part' in data:
                product.is_spare_part = str(data['is_spare_part']).lower() in ['true', '1']
            if 'is_machinery' in data:
                product.is_machinery = str(data['is_machinery']).lower() in ['true', '1']
            if 'is_power_tools' in data:
                product.is_power_tools = str(data['is_power_tools']).lower() in ['true', '1']

            if 'image' in request.FILES:
                product.image = request.FILES['image']

            product.save()
            return JsonResponse({'status': 'success', 'message': 'Product updated successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    elif request.method == 'DELETE':
        product.delete()
        return JsonResponse({'status': 'success', 'message': 'Product deleted successfully'})


@owner_required
def categories_api(request):
    categories = [
        {
            'id': c.id,
            'name': c.name,
            'image_url': c.image.url if c.image else None,
        }
        for c in Category.objects.all().order_by('name')
    ]
    return JsonResponse({'status': 'success', 'categories': categories})


@owner_required
@csrf_exempt
def parties_api(request):
    if request.method == 'GET':
        party_type = request.GET.get('type')
        query = request.GET.get('q', '').strip()

        qs = Party.objects.all().order_by('name')
        if party_type in ['customer', 'supplier']:
            qs = qs.filter(party_type=party_type)
        if query:
            qs = qs.filter(Q(name__icontains=query) | Q(phone__icontains=query) | Q(gstin__icontains=query))

        parties = [
            {
                'id': p.id,
                'name': p.name,
                'phone': p.phone or '',
                'address': p.address or '',
                'gstin': p.gstin or '',
                'party_type': p.party_type,
                'balance': float(p.balance),
            }
            for p in qs
        ]
        return JsonResponse({'status': 'success', 'parties': parties})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
            name = data.get('name')
            party_type = data.get('party_type', 'customer')

            if not name:
                return JsonResponse({'status': 'error', 'message': 'Party name is required'}, status=400)

            party = Party.objects.create(
                name=name,
                party_type=party_type,
                phone=data.get('phone', ''),
                address=data.get('address', ''),
                gstin=data.get('gstin', ''),
                balance=Decimal(str(data.get('balance', 0))),
            )
            return JsonResponse({
                'status': 'success',
                'message': 'Party created successfully',
                'party': {
                    'id': party.id,
                    'name': party.name,
                    'party_type': party.party_type,
                    'phone': party.phone,
                    'balance': float(party.balance),
                }
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@owner_required
@csrf_exempt
def party_detail_api(request, id):
    party = get_object_or_404(Party, id=id)

    if request.method == 'GET':
        sales = [
            {'id': s.id, 'date': s.sale_date.strftime('%d %b %Y'), 'amount': float(s.total_amount), 'type': 'Sale'}
            for s in Sale.objects.filter(customer=party).order_by('-sale_date')[:10]
        ]
        purchases = [
            {'id': p.id, 'date': p.purchase_date.strftime('%d %b %Y'), 'amount': float(p.total_amount), 'type': 'Purchase'}
            for p in Purchase.objects.filter(supplier=party).order_by('-purchase_date')[:10]
        ]
        payments = [
            {'id': py.id, 'date': py.payment_date.strftime('%d %b %Y'), 'amount': float(py.amount), 'type': py.payment_type.title(), 'mode': py.payment_mode}
            for py in Payment.objects.filter(party=party).order_by('-payment_date')[:10]
        ]

        return JsonResponse({
            'status': 'success',
            'party': {
                'id': party.id,
                'name': party.name,
                'phone': party.phone,
                'address': party.address,
                'gstin': party.gstin,
                'party_type': party.party_type,
                'balance': float(party.balance),
            },
            'recent_sales': sales,
            'recent_purchases': purchases,
            'recent_payments': payments,
        })

    elif request.method in ['POST', 'PUT']:
        try:
            data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
            if 'name' in data and data['name']:
                party.name = data['name']
            if 'phone' in data:
                party.phone = data['phone']
            if 'address' in data:
                party.address = data['address']
            if 'gstin' in data:
                party.gstin = data['gstin']
            if 'party_type' in data:
                party.party_type = data['party_type']
            if 'balance' in data:
                party.balance = Decimal(str(data['balance']))

            party.save()
            return JsonResponse({'status': 'success', 'message': 'Party updated successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

    elif request.method == 'DELETE':
        party.delete()
        return JsonResponse({'status': 'success', 'message': 'Party deleted successfully'})


@owner_required
@csrf_exempt
def sales_api(request):
    if request.method == 'GET':
        sales_qs = Sale.objects.select_related('customer', 'created_by').order_by('-id')
        total_revenue = sales_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
        total_outstanding = sales_qs.aggregate(Sum('balance_amount'))['balance_amount__sum'] or Decimal('0.00')

        sales = [
            {
                'id': s.id,
                'customer_id': s.customer_id,
                'customer_name': s.customer.name if s.customer else 'Walk-in Customer',
                'customer_phone': s.customer.phone if s.customer else '',
                'sale_date': s.sale_date.strftime('%d %b %Y, %I:%M %p'),
                'total_amount': float(s.total_amount),
                'paid_amount': float(s.paid_amount),
                'balance_amount': float(s.balance_amount),
                'payment_mode': s.payment_mode or 'Cash',
                'items_count': s.items.count(),
            }
            for s in sales_qs
        ]
        return JsonResponse({
            'status': 'success',
            'sales': sales,
            'total_revenue': float(total_revenue),
            'total_outstanding': float(total_outstanding),
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            customer_id = data.get('customer_id')
            customer = Party.objects.filter(id=customer_id).first() if customer_id else None
            paid_amount = Decimal(str(data.get('paid_amount') or 0))
            payment_mode = data.get('payment_mode', 'cash')
            items_data = data.get('items', [])

            if not items_data:
                return JsonResponse({'status': 'error', 'message': 'At least one item is required.'}, status=400)

            with transaction.atomic():
                sale = Sale.objects.create(
                    customer=customer,
                    paid_amount=paid_amount,
                    payment_mode=payment_mode,
                    created_by=request.user,
                )
                if data.get('sale_date'):
                    sale.sale_date = data['sale_date']

                total_bill = Decimal('0')
                total_taxable = Decimal('0')
                total_cgst = Decimal('0')
                total_sgst = Decimal('0')

                for it in items_data:
                    product = get_object_or_404(Product, id=it['product_id'])
                    qty = int(it.get('quantity', 1))
                    price_incl_gst = Decimal(str(it.get('price_incl_gst', product.price)))

                    line_total = price_incl_gst * qty
                    gst_data = calculate_gst_extraction(line_total, product.gst_percent)

                    SaleItem.objects.create(
                        sale=sale,
                        product=product,
                        quantity=qty,
                        price_incl_gst=price_incl_gst,
                        taxable_value=gst_data['taxable_value'],
                        cgst_amount=gst_data['cgst'],
                        sgst_amount=gst_data['sgst'],
                        cost_price=product.avg_cost,
                        total=line_total,
                    )

                    product.stock_qty -= qty
                    product.save()

                    total_bill += line_total
                    total_taxable += gst_data['taxable_value']
                    total_cgst += gst_data['cgst']
                    total_sgst += gst_data['sgst']

                sale.total_amount = total_bill
                sale.balance_amount = max(total_bill - paid_amount, Decimal('0'))
                sale.save()

                Transaction.objects.create(
                    description=f"Sale #{sale.id} to {customer.name if customer else 'Walk-in'}",
                    account_name=f"Customer: {customer.name}" if customer else "Cash/Bank Account",
                    debit=total_bill, reference_id=sale.id, reference_type='Sale'
                )
                Transaction.objects.create(
                    description=f"Sales Taxable Value #{sale.id}",
                    account_name="Sales Account",
                    credit=total_taxable, reference_id=sale.id, reference_type='Sale'
                )
                Transaction.objects.create(
                    description=f"Output CGST #{sale.id}",
                    account_name="Output CGST",
                    credit=total_cgst, reference_id=sale.id, reference_type='Sale'
                )
                Transaction.objects.create(
                    description=f"Output SGST #{sale.id}",
                    account_name="Output SGST",
                    credit=total_sgst, reference_id=sale.id, reference_type='Sale'
                )

                if customer and sale.balance_amount:
                    customer.balance += sale.balance_amount
                    customer.save()

                if paid_amount > 0:
                    Transaction.objects.create(
                        description=f"Payment received for Sale #{sale.id}",
                        account_name="Cash/Bank Account",
                        debit=paid_amount, reference_id=sale.id, reference_type='Sale'
                    )
                    if customer:
                        Transaction.objects.create(
                            description=f"Payment from {customer.name} for Sale #{sale.id}",
                            account_name=f"Customer: {customer.name}",
                            credit=paid_amount, reference_id=sale.id, reference_type='Sale'
                        )

            return JsonResponse({'status': 'success', 'message': 'Sale invoice created successfully', 'sale_id': sale.id})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@owner_required
@csrf_exempt
def sale_detail_api(request, id):
    sale = get_object_or_404(Sale.objects.select_related('customer', 'created_by'), id=id)

    if request.method == 'GET':
        items = [
            {
                'id': it.id,
                'product_id': it.product_id,
                'product_name': it.product.name,
                'quantity': it.quantity,
                'price_incl_gst': float(it.price_incl_gst),
                'taxable_value': float(it.taxable_value),
                'cgst_amount': float(it.cgst_amount),
                'sgst_amount': float(it.sgst_amount),
                'total': float(it.total),
            }
            for it in sale.items.select_related('product').all()
        ]

        return JsonResponse({
            'status': 'success',
            'sale': {
                'id': sale.id,
                'sale_date': sale.sale_date.strftime('%d %b %Y, %I:%M %p'),
                'customer': {
                    'id': sale.customer.id if sale.customer else None,
                    'name': sale.customer.name if sale.customer else 'Walk-in Customer',
                    'phone': sale.customer.phone if sale.customer else '',
                    'address': sale.customer.address if sale.customer else '',
                    'gstin': sale.customer.gstin if sale.customer else '',
                } if sale.customer else None,
                'total_amount': float(sale.total_amount),
                'paid_amount': float(sale.paid_amount),
                'balance_amount': float(sale.balance_amount),
                'payment_mode': sale.payment_mode or 'Cash',
                'created_by': sale.created_by.username if sale.created_by else 'Admin',
                'items': items,
            }
        })

    elif request.method == 'DELETE':
        try:
            with transaction.atomic():
                for it in sale.items.all():
                    it.product.stock_qty += it.quantity
                    it.product.save()

                if sale.customer and sale.balance_amount:
                    sale.customer.balance -= sale.balance_amount
                    sale.customer.save()

                Transaction.objects.filter(reference_id=sale.id, reference_type='Sale').delete()
                sale.delete()

            return JsonResponse({'status': 'success', 'message': 'Sale invoice deleted and inventory reverted'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@owner_required
@csrf_exempt
def purchases_api(request):
    if request.method == 'GET':
        purchases_qs = Purchase.objects.select_related('supplier', 'created_by').order_by('-id')
        total_purchases = purchases_qs.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
        total_payables = purchases_qs.aggregate(Sum('balance_amount'))['balance_amount__sum'] or Decimal('0.00')

        purchases = [
            {
                'id': p.id,
                'supplier_id': p.supplier_id,
                'supplier_name': p.supplier.name if p.supplier else 'Unknown Supplier',
                'supplier_phone': p.supplier.phone if p.supplier else '',
                'invoice_no': p.invoice_no or '',
                'purchase_date': p.purchase_date.strftime('%d %b %Y, %I:%M %p'),
                'total_amount': float(p.total_amount),
                'paid_amount': float(p.paid_amount),
                'balance_amount': float(p.balance_amount),
                'payment_mode': p.payment_mode or 'Bank',
                'items_count': p.items.count(),
            }
            for p in purchases_qs
        ]

        return JsonResponse({
            'status': 'success',
            'purchases': purchases,
            'total_purchases': float(total_purchases),
            'total_payables': float(total_payables),
        })

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            supplier_id = data.get('supplier_id')
            new_supplier_name = data.get('new_supplier_name')
            invoice_no = data.get('invoice_no')
            paid_amount = Decimal(str(data.get('paid_amount') or 0))
            payment_mode = data.get('payment_mode', 'bank')
            items_data = data.get('items', [])

            if not items_data:
                return JsonResponse({'status': 'error', 'message': 'At least one item is required.'}, status=400)

            with transaction.atomic():
                if new_supplier_name:
                    supplier, _ = Party.objects.get_or_create(name=new_supplier_name, defaults={'party_type': 'supplier'})
                elif supplier_id:
                    supplier = get_object_or_404(Party, id=supplier_id)
                else:
                    supplier = None

                purchase = Purchase.objects.create(
                    supplier=supplier,
                    invoice_no=invoice_no,
                    paid_amount=paid_amount,
                    payment_mode=payment_mode,
                    created_by=request.user,
                )
                if data.get('purchase_date'):
                    purchase.purchase_date = data['purchase_date']

                total_bill = Decimal('0')
                total_taxable = Decimal('0')
                total_cgst = Decimal('0')
                total_sgst = Decimal('0')

                for it in items_data:
                    new_product_name = it.get('new_product_name')
                    if new_product_name:
                        cat_id = it.get('category_id')
                        category = Category.objects.filter(id=cat_id).first() if cat_id else Category.objects.first()
                        product, _ = Product.objects.get_or_create(
                            name=new_product_name,
                            defaults={'category': category}
                        )
                    else:
                        product = get_object_or_404(Product, id=it['product_id'])

                    if it.get('new_gst_percent'):
                        product.gst_percent = Decimal(str(it['new_gst_percent']))

                    qty = int(it.get('quantity', 1))
                    unit_price = Decimal(str(it.get('price_incl_gst', 0)))
                    line_total = unit_price * qty
                    gst_data = calculate_gst_extraction(line_total, product.gst_percent)

                    PurchaseItem.objects.create(
                        purchase=purchase,
                        product=product,
                        quantity=qty,
                        price_incl_gst=unit_price,
                        taxable_value=gst_data['taxable_value'],
                        cgst_amount=gst_data['cgst'],
                        sgst_amount=gst_data['sgst'],
                        total=line_total,
                    )

                    product.avg_cost = update_weighted_average_cost(product, qty, gst_data['taxable_value'])
                    product.purchase_price = unit_price
                    product.stock_qty += qty
                    if 'show_on_website' in it:
                        product.show_on_website = bool(it['show_on_website'])
                    product.save()

                    total_bill += line_total
                    total_taxable += gst_data['taxable_value']
                    total_cgst += gst_data['cgst']
                    total_sgst += gst_data['sgst']

                purchase.total_amount = total_bill
                purchase.balance_amount = max(total_bill - paid_amount, Decimal('0'))
                purchase.save()

                Transaction.objects.create(
                    description=f"Purchase #{purchase.id} from {supplier.name if supplier else 'Unknown'}",
                    account_name="Purchase Account",
                    debit=total_taxable, reference_id=purchase.id, reference_type='Purchase'
                )
                Transaction.objects.create(
                    description=f"Input CGST #{purchase.id}",
                    account_name="Input CGST",
                    debit=total_cgst, reference_id=purchase.id, reference_type='Purchase'
                )
                Transaction.objects.create(
                    description=f"Input SGST #{purchase.id}",
                    account_name="Input SGST",
                    debit=total_sgst, reference_id=purchase.id, reference_type='Purchase'
                )
                Transaction.objects.create(
                    description=f"Payable for Purchase #{purchase.id}",
                    account_name=f"Supplier: {supplier.name}" if supplier else "Unknown Supplier",
                    credit=total_bill, reference_id=purchase.id, reference_type='Purchase'
                )

                if supplier and purchase.balance_amount:
                    supplier.balance += purchase.balance_amount
                    supplier.save()

                if paid_amount > 0:
                    Transaction.objects.create(
                        description=f"Payment made for Purchase #{purchase.id}",
                        account_name=f"Supplier: {supplier.name}" if supplier else "Unknown Supplier",
                        debit=paid_amount, reference_id=purchase.id, reference_type='Purchase'
                    )
                    Transaction.objects.create(
                        description=f"Cash/Bank payment for Purchase #{purchase.id}",
                        account_name="Cash/Bank Account",
                        credit=paid_amount, reference_id=purchase.id, reference_type='Purchase'
                    )

            return JsonResponse({'status': 'success', 'message': 'Purchase inward recorded successfully', 'purchase_id': purchase.id})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@owner_required
@csrf_exempt
def purchase_detail_api(request, id):
    purchase = get_object_or_404(Purchase.objects.select_related('supplier', 'created_by'), id=id)

    if request.method == 'GET':
        items = [
            {
                'id': it.id,
                'product_id': it.product_id,
                'product_name': it.product.name,
                'quantity': it.quantity,
                'price_incl_gst': float(it.price_incl_gst),
                'taxable_value': float(it.taxable_value),
                'cgst_amount': float(it.cgst_amount),
                'sgst_amount': float(it.sgst_amount),
                'total': float(it.total),
            }
            for it in purchase.items.select_related('product').all()
        ]

        return JsonResponse({
            'status': 'success',
            'purchase': {
                'id': purchase.id,
                'invoice_no': purchase.invoice_no or '',
                'purchase_date': purchase.purchase_date.strftime('%d %b %Y, %I:%M %p'),
                'supplier': {
                    'id': purchase.supplier.id if purchase.supplier else None,
                    'name': purchase.supplier.name if purchase.supplier else 'Unknown Supplier',
                    'phone': purchase.supplier.phone if purchase.supplier else '',
                    'address': purchase.supplier.address if purchase.supplier else '',
                    'gstin': purchase.supplier.gstin if purchase.supplier else '',
                } if purchase.supplier else None,
                'total_amount': float(purchase.total_amount),
                'paid_amount': float(purchase.paid_amount),
                'balance_amount': float(purchase.balance_amount),
                'payment_mode': purchase.payment_mode or 'Bank',
                'created_by': purchase.created_by.username if purchase.created_by else 'Admin',
                'items': items,
            }
        })

    elif request.method == 'DELETE':
        try:
            with transaction.atomic():
                for it in purchase.items.all():
                    it.product.stock_qty -= it.quantity
                    it.product.save()

                if purchase.supplier and purchase.balance_amount:
                    purchase.supplier.balance -= purchase.balance_amount
                    purchase.supplier.save()

                Transaction.objects.filter(reference_id=purchase.id, reference_type='Purchase').delete()
                purchase.delete()

            return JsonResponse({'status': 'success', 'message': 'Purchase entry deleted and inventory adjusted'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@owner_required
@csrf_exempt
def payments_api(request):
    if request.method == 'GET':
        payments_qs = Payment.objects.select_related('party').order_by('-id')
        payments = [
            {
                'id': p.id,
                'party_id': p.party_id,
                'party_name': p.party.name if p.party else 'General Party',
                'party_type': p.party.party_type if p.party else '',
                'payment_type': p.payment_type,
                'amount': float(p.amount),
                'payment_mode': p.payment_mode,
                'payment_date': p.payment_date.strftime('%d %b %Y, %I:%M %p'),
                'note': p.note or '',
            }
            for p in payments_qs
        ]
        return JsonResponse({'status': 'success', 'payments': payments})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            party_id = data.get('party_id')
            party = get_object_or_404(Party, id=party_id)
            payment_type = data.get('payment_type', 'received')
            amount = Decimal(str(data.get('amount') or 0))
            payment_mode = data.get('payment_mode', 'cash')
            note = data.get('note', '')

            with transaction.atomic():
                payment = Payment.objects.create(
                    party=party,
                    payment_type=payment_type,
                    amount=amount,
                    payment_mode=payment_mode,
                    note=note,
                )
                if data.get('payment_date'):
                    payment.payment_date = data['payment_date']
                    payment.save()

                party.balance -= amount
                party.save()

                if payment_type == 'paid':
                    Transaction.objects.create(
                        description=f"Payment to {party.name}",
                        account_name=f"Supplier: {party.name}",
                        debit=amount, reference_id=payment.id, reference_type='Payment'
                    )
                    Transaction.objects.create(
                        description=f"Cash/Bank payment to {party.name}",
                        account_name="Cash/Bank Account",
                        credit=amount, reference_id=payment.id, reference_type='Payment'
                    )
                else:
                    Transaction.objects.create(
                        description=f"Receipt from {party.name}",
                        account_name="Cash/Bank Account",
                        debit=amount, reference_id=payment.id, reference_type='Payment'
                    )
                    Transaction.objects.create(
                        description=f"Payment from customer {party.name}",
                        account_name=f"Customer: {party.name}",
                        credit=amount, reference_id=payment.id, reference_type='Payment'
                    )

            return JsonResponse({'status': 'success', 'message': 'Payment recorded successfully', 'payment_id': payment.id})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@owner_required
def reports_gst_api(request):
    sales_items = SaleItem.objects.select_related('sale', 'sale__customer', 'product').order_by('-sale__sale_date')[:50]
    purchase_items = PurchaseItem.objects.select_related('purchase', 'purchase__supplier', 'product').order_by('-purchase__purchase_date')[:50]

    out_cgst = SaleItem.objects.aggregate(total=Sum('cgst_amount'))['total'] or Decimal('0.00')
    out_sgst = SaleItem.objects.aggregate(total=Sum('sgst_amount'))['total'] or Decimal('0.00')
    in_cgst = PurchaseItem.objects.aggregate(total=Sum('cgst_amount'))['total'] or Decimal('0.00')
    in_sgst = PurchaseItem.objects.aggregate(total=Sum('sgst_amount'))['total'] or Decimal('0.00')

    net_cgst = out_cgst - in_cgst
    net_sgst = out_sgst - in_sgst

    return JsonResponse({
        'status': 'success',
        'summary': {
            'output_cgst': float(out_cgst),
            'output_sgst': float(out_sgst),
            'output_total': float(out_cgst + out_sgst),
            'input_cgst': float(in_cgst),
            'input_sgst': float(in_sgst),
            'input_total': float(in_cgst + in_sgst),
            'net_cgst': float(net_cgst),
            'net_sgst': float(net_sgst),
            'net_payable': float((out_cgst + out_sgst) - (in_cgst + in_sgst)),
        },
        'sales_tax_entries': [
            {
                'id': it.id,
                'sale_id': it.sale_id,
                'date': it.sale.sale_date.strftime('%d %b %Y'),
                'customer': it.sale.customer.name if it.sale.customer else 'Walk-in',
                'gstin': it.sale.customer.gstin if it.sale.customer else '',
                'product': it.product.name,
                'taxable_value': float(it.taxable_value),
                'cgst': float(it.cgst_amount),
                'sgst': float(it.sgst_amount),
                'total': float(it.total),
            }
            for it in sales_items
        ],
        'purchase_tax_entries': [
            {
                'id': it.id,
                'purchase_id': it.purchase_id,
                'invoice_no': it.purchase.invoice_no or '',
                'date': it.purchase.purchase_date.strftime('%d %b %Y'),
                'supplier': it.purchase.supplier.name if it.purchase.supplier else 'Unknown',
                'gstin': it.purchase.supplier.gstin if it.purchase.supplier else '',
                'product': it.product.name,
                'taxable_value': float(it.taxable_value),
                'cgst': float(it.cgst_amount),
                'sgst': float(it.sgst_amount),
                'total': float(it.total),
            }
            for it in purchase_items
        ]
    })


@owner_required
def reports_outstanding_api(request):
    customers = [
        {
            'id': c.id,
            'name': c.name,
            'phone': c.phone or '',
            'gstin': c.gstin or '',
            'balance': float(c.balance),
        }
        for c in Party.objects.filter(party_type='customer', balance__gt=0).order_by('-balance')
    ]
    suppliers = [
        {
            'id': s.id,
            'name': s.name,
            'phone': s.phone or '',
            'gstin': s.gstin or '',
            'balance': float(s.balance),
        }
        for s in Party.objects.filter(party_type='supplier', balance__gt=0).order_by('-balance')
    ]

    total_receivable = sum(c['balance'] for c in customers)
    total_payable = sum(s['balance'] for s in suppliers)

    return JsonResponse({
        'status': 'success',
        'customers': customers,
        'suppliers': suppliers,
        'total_receivable': float(total_receivable),
        'total_payable': float(total_payable),
    })
