from django.contrib import messages
from django.db.models import F, Sum
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.http import JsonResponse
from django.forms import inlineformset_factory
from django.db import transaction
from decimal import Decimal

from BurhaniApp.models import Party, Payment, Product, Purchase, PurchaseItem, Sale, SaleItem, Transaction, Category
from .decorators import owner_required
from .forms import PartyForm, PaymentForm, ProductForm, PurchaseForm, SaleForm, PurchaseItemForm, SaleItemForm
from .utils import calculate_gst_extraction, update_weighted_average_cost


@owner_required
def dashboard(request):
    today = timezone.localtime(timezone.now()).date()
    
    # Intelligent Trend Window: Show up to the latest transaction date if it's in the future
    latest_sale = Sale.objects.order_by('-sale_date').first()
    latest_date = timezone.localtime(latest_sale.sale_date).date() if latest_sale else today
    end_date = max(today, latest_date)

    # Sales & Purchases Summary
    today_sales = Sale.objects.filter(sale_date__date=today).aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')
    
    today_purchases = Purchase.objects.filter(purchase_date__date=today).aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')
    
    # Inventory Summary
    total_products = Product.objects.count()
    low_stock_products = Product.objects.filter(stock_qty__lte=F('low_stock_limit'))
    stock_value = Product.objects.aggregate(
        total=Sum(F('stock_qty') * F('avg_cost'))
    )['total'] or Decimal('0.00')

    # Receivables / Payables
    pending_customer_payments = Party.objects.filter(
        party_type='customer'
    ).aggregate(total=Sum('balance'))['total'] or Decimal('0.00')
    
    pending_supplier_payments = Party.objects.filter(
        party_type='supplier'
    ).aggregate(total=Sum('balance'))['total'] or Decimal('0.00')

    # GST Summary (Input vs Output)
    input_cgst = Transaction.objects.filter(account_name='Input CGST').aggregate(total=Sum('debit'))['total'] or Decimal('0.00')
    input_sgst = Transaction.objects.filter(account_name='Input SGST').aggregate(total=Sum('debit'))['total'] or Decimal('0.00')
    output_cgst = Transaction.objects.filter(account_name='Output CGST').aggregate(total=Sum('credit'))['total'] or Decimal('0.00')
    output_sgst = Transaction.objects.filter(account_name='Output SGST').aggregate(total=Sum('credit'))['total'] or Decimal('0.00')
    
    gst_credit = (input_cgst + input_sgst) - (output_cgst + output_sgst)

    # Profit Calculation (Sales Taxable - COGS)
    total_taxable_sales = SaleItem.objects.aggregate(total=Sum('taxable_value'))['total'] or Decimal('0.00')
    total_cogs = SaleItem.objects.aggregate(total=Sum(F('quantity') * F('cost_price')))['total'] or Decimal('0.00')
    gross_profit = total_taxable_sales - total_cogs

    # Sales Trend Data (Last 7 days ending at end_date)
    sales_trend = []
    purchases_trend = []
    days = []
    for i in range(6, -1, -1):
        date = end_date - timezone.timedelta(days=i)
        daily_sale = Sale.objects.filter(sale_date__date=date).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        daily_purchase = Purchase.objects.filter(purchase_date__date=date).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        
        sales_trend.append(float(daily_sale))
        purchases_trend.append(float(daily_purchase))
        days.append(date.strftime('%d %b'))

    context = {
        'today_sales': today_sales,
        'today_purchases': today_purchases,
        'total_products': total_products,
        'low_stock_products': low_stock_products,
        'stock_value': stock_value,
        'pending_customer_payments': pending_customer_payments,
        'pending_supplier_payments': pending_supplier_payments,
        'gst_credit': gst_credit,
        'gross_profit': gross_profit,
        'recent_sales': Sale.objects.order_by('-id')[:5],
        'sales_trend': sales_trend,
        'purchases_trend': purchases_trend,
        'days_labels': days,
    }
    return render(request, 'BusinessApp/dashboard.html', context)


@owner_required
def product_list(request):
    products = Product.objects.select_related('category').order_by('-id')
    
    # Calculate Summary Stats
    stock_value = Product.objects.aggregate(
        total=Sum(F('stock_qty') * F('avg_cost'))
    )['total'] or Decimal('0.00')
    
    low_stock_count = Product.objects.filter(stock_qty__lte=F('low_stock_limit')).count()
    
    context = {
        'products': products,
        'stock_value': stock_value,
        'low_stock_count': low_stock_count,
    }
    return render(request, 'BusinessApp/products.html', context)


@owner_required
def product_add(request):
    form = ProductForm(request.POST or None, request.FILES or None)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Product added successfully.')
        return redirect('business_products')
    return render(request, 'BusinessApp/product_form.html', {'form': form, 'title': 'Add Product'})


@owner_required
def product_edit(request, id):
    product = get_object_or_404(Product, id=id)
    form = ProductForm(request.POST or None, request.FILES or None, instance=product)
    if request.method == 'POST' and form.is_valid():
        form.save()
        messages.success(request, 'Product updated successfully.')
        return redirect('business_products')
    return render(request, 'BusinessApp/product_form.html', {'form': form, 'title': 'Edit Product'})


@owner_required
def customer_list(request):
    parties = Party.objects.filter(party_type='customer').order_by('name')
    return render(request, 'BusinessApp/parties.html', {
        'parties': parties, 
        'list_type': 'Customers',
        'add_url': 'business_party_add'
    })

@owner_required
def supplier_list(request):
    parties = Party.objects.filter(party_type='supplier').order_by('name')
    return render(request, 'BusinessApp/parties.html', {
        'parties': parties, 
        'list_type': 'Suppliers',
        'add_url': 'business_party_add'
    })


@owner_required
def party_add(request):
    form = PartyForm(request.POST or None)
    back_url = request.META.get('HTTP_REFERER', 'business_dashboard')
    if request.method == 'POST' and form.is_valid():
        party = form.save()
        messages.success(request, 'Party added successfully.')
        if party.party_type == 'customer':
            return redirect('business_customers')
        return redirect('business_suppliers')
    return render(request, 'BusinessApp/party_form.html', {'form': form, 'title': 'Add Customer/Supplier', 'back_url': back_url})


@owner_required
def quick_add_party(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        party_type = request.POST.get('party_type', 'customer')
        phone = request.POST.get('phone', '')
        
        if name:
            party = Party.objects.create(
                name=name,
                party_type=party_type,
                phone=phone
            )
            return JsonResponse({
                'success': True,
                'id': party.id,
                'name': party.name
            })
    return JsonResponse({'success': False})


@owner_required
def party_edit(request, id):
    party = get_object_or_404(Party, id=id)
    form = PartyForm(request.POST or None, instance=party)
    back_url = 'business_customers' if party.party_type == 'customer' else 'business_suppliers'
    if request.method == 'POST' and form.is_valid():
        party = form.save()
        messages.success(request, 'Party updated successfully.')
        if party.party_type == 'customer':
            return redirect('business_customers')
        return redirect('business_suppliers')
    return render(request, 'BusinessApp/party_form.html', {'form': form, 'title': 'Edit Customer/Supplier', 'back_url': back_url})


@owner_required
def sale_list(request):
    sales = Sale.objects.select_related('customer', 'created_by').order_by('-id')
    total_revenue = sales.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
    total_outstanding = sales.aggregate(Sum('balance_amount'))['balance_amount__sum'] or Decimal('0.00')
    
    context = {
        'sales': sales,
        'total_revenue': total_revenue,
        'total_outstanding': total_outstanding,
    }
    return render(request, 'BusinessApp/sales.html', context)


@owner_required
def sale_add(request):
    SaleItemFormSet = inlineformset_factory(Sale, SaleItem, form=SaleItemForm, extra=0, can_delete=True)
    
    if request.method == 'POST':
        customer_id = request.POST.get('customer')
        customer = Party.objects.filter(id=customer_id).first() if customer_id else None
        paid_amount_raw = request.POST.get('paid_amount', '0')
        paid_amount = Decimal(paid_amount_raw if paid_amount_raw else '0')
        payment_mode = request.POST.get('payment_mode', 'cash')
        
        sale_date = request.POST.get('sale_date')
        
        sale = Sale(
            customer=customer,
            paid_amount=paid_amount,
            payment_mode=payment_mode,
            created_by=request.user
        )
        if sale_date:
            sale.sale_date = sale_date
        formset = SaleItemFormSet(request.POST, instance=sale)
        
        if formset.is_valid():
            try:
                with transaction.atomic():
                    sale.save()
                    total_bill = Decimal('0')
                    total_taxable = Decimal('0')
                    total_cgst = Decimal('0')
                    total_sgst = Decimal('0')
                    item_count = 0

                    for item_form in formset:
                        if item_form.cleaned_data and not item_form.cleaned_data.get('DELETE'):
                            item = item_form.save(commit=False)
                            product = item.product
                            qty = item.quantity
                            price_incl_gst = item.price_incl_gst 
                            
                            line_total = price_incl_gst * qty
                            gst_data = calculate_gst_extraction(line_total, product.gst_percent)
                            
                            item.taxable_value = gst_data['taxable_value']
                            item.cgst_amount = gst_data['cgst']
                            item.sgst_amount = gst_data['sgst']
                            item.cost_price = product.avg_cost
                            item.total = line_total
                            item.save()
                            
                            product.stock_qty -= qty
                            product.save()
                            
                            total_bill += line_total
                            total_taxable += gst_data['taxable_value']
                            total_cgst += gst_data['cgst']
                            total_sgst += gst_data['sgst']
                            item_count += 1

                    if item_count == 0:
                        raise ValueError("At least one item is required.")

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

                    # Record Payment Transaction if paid > 0
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

                messages.success(request, 'Sale recorded successfully.')
                return redirect('business_sales')
            except Exception as e:
                messages.error(request, f"Error saving sale: {str(e)}")
        else:
            messages.error(request, "Invalid data in items list.")
    else:
        formset = SaleItemFormSet()
        
    customers = Party.objects.filter(party_type='customer')
    products = Product.objects.filter(show_on_website=True).order_by('name')
    context = {
        'formset': formset, 
        'customers': customers, 
        'products': products,
        'today': timezone.now()
    }
    return render(request, 'BusinessApp/sale_form.html', context)


@owner_required
def purchase_list(request):
    purchases = Purchase.objects.select_related('supplier', 'created_by').order_by('-id')
    total_purchase_value = purchases.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
    total_payable = purchases.aggregate(Sum('balance_amount'))['balance_amount__sum'] or Decimal('0.00')
    
    context = {
        'purchases': purchases,
        'total_purchase_value': total_purchase_value,
        'total_payable': total_payable,
    }
    return render(request, 'BusinessApp/purchases.html', context)


@owner_required
def purchase_add(request):
    PurchaseItemFormSet = inlineformset_factory(Purchase, PurchaseItem, form=PurchaseItemForm, extra=0, can_delete=True)
    
    if request.method == 'POST':
        supplier_id = request.POST.get('supplier')
        new_supplier_name = request.POST.get('new_supplier_name')
        invoice_no = request.POST.get('invoice_no')
        paid_amount_raw = request.POST.get('paid_amount', '0')
        paid_amount = Decimal(paid_amount_raw if paid_amount_raw else '0')
        payment_mode = request.POST.get('payment_mode', 'bank')
        
        try:
            with transaction.atomic():
                if new_supplier_name:
                    supplier, _ = Party.objects.get_or_create(name=new_supplier_name, party_type='supplier')
                elif supplier_id:
                    supplier = get_object_or_404(Party, id=supplier_id)
                else:
                    supplier = None

                purchase = Purchase(
                    supplier=supplier,
                    invoice_no=invoice_no,
                    paid_amount=paid_amount,
                    payment_mode=payment_mode,
                    created_by=request.user
                )
                purchase_date = request.POST.get('purchase_date')
                if purchase_date:
                    purchase.purchase_date = purchase_date
                formset = PurchaseItemFormSet(request.POST, instance=purchase)
                
                if formset.is_valid():
                    purchase.save()
                    total_bill = Decimal('0')
                    total_taxable = Decimal('0')
                    total_cgst = Decimal('0')
                    total_sgst = Decimal('0')
                    item_count = 0

                    for item_form in formset:
                        if item_form.cleaned_data and not item_form.cleaned_data.get('DELETE'):
                            product = item_form.cleaned_data.get('product')
                            new_product_name = item_form.cleaned_data.get('new_product_name')
                            
                            if new_product_name:
                                category = item_form.cleaned_data.get('new_category')
                                if not category:
                                    category, _ = Category.objects.get_or_create(name="General")
                                product, _ = Product.objects.get_or_create(
                                    name=new_product_name,
                                    defaults={'category': category}
                                )
                            elif not product:
                                raise ValueError("Select a product or enter a new product name.")
                            
                            latest_gst = item_form.cleaned_data.get('new_gst_percent')
                            if latest_gst:
                                product.gst_percent = latest_gst
                                product.save()
                            
                            item = item_form.save(commit=False)
                            item.purchase = purchase
                            item.product = product
                            qty = item.quantity
                            unit_price = item.price_incl_gst 
                            line_total = unit_price * qty
                            
                            gst_data = calculate_gst_extraction(line_total, product.gst_percent)
                            
                            item.taxable_value = gst_data['taxable_value']
                            item.cgst_amount = gst_data['cgst']
                            item.sgst_amount = gst_data['sgst']
                            item.total = line_total
                            item.save()
                            
                            product.avg_cost = update_weighted_average_cost(product, qty, gst_data['taxable_value'])
                            product.purchase_price = unit_price
                            product.stock_qty += qty
                            product.show_on_website = item_form.cleaned_data.get('show_on_website', True)
                            product.save()
                            
                            total_bill += line_total
                            total_taxable += gst_data['taxable_value']
                            total_cgst += gst_data['cgst']
                            total_sgst += gst_data['sgst']
                            item_count += 1

                    if item_count == 0:
                        raise ValueError("At least one item is required.")

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

                    messages.success(request, f'Purchase recorded successfully.')
                    return redirect('business_purchases')
                else:
                    messages.error(request, "Invalid data in items list.")
        except Exception as e:
            messages.error(request, f"Error: {str(e)}")
    else:
        formset = PurchaseItemFormSet()
        
    suppliers = Party.objects.filter(party_type='supplier')
    products = Product.objects.all().order_by('name')
    categories = Category.objects.all()
    context = {
        'formset': formset, 
        'suppliers': suppliers, 
        'products': products, 
        'categories': categories,
        'today': timezone.now()
    }
    return render(request, 'BusinessApp/purchase_form.html', context)

@owner_required
def payment_list(request):
    payments = Payment.objects.select_related('party').order_by('-id')
    return render(request, 'BusinessApp/payments.html', {'payments': payments})


@owner_required
def payment_add(request):
    form = PaymentForm(request.POST or None)
    if request.method == 'POST' and form.is_valid():
        try:
            with transaction.atomic():
                payment = form.save()
                if payment.payment_type == 'paid': 
                    payment.party.balance -= payment.amount
                else: 
                    payment.party.balance -= payment.amount
                payment.party.save()
                
                if payment.payment_type == 'paid':
                    Transaction.objects.create(
                        description=f"Payment to {payment.party.name}",
                        account_name=f"Supplier: {payment.party.name}",
                        debit=payment.amount,
                        reference_id=payment.id,
                        reference_type='Payment'
                    )
                    Transaction.objects.create(
                        description=f"Cash/Bank payment to {payment.party.name}",
                        account_name="Cash/Bank Account",
                        credit=payment.amount,
                        reference_id=payment.id,
                        reference_type='Payment'
                    )
                else:
                    Transaction.objects.create(
                        description=f"Receipt from {payment.party.name}",
                        account_name="Cash/Bank Account",
                        debit=payment.amount,
                        reference_id=payment.id,
                        reference_type='Payment'
                    )
                    Transaction.objects.create(
                        description=f"Payment from customer {payment.party.name}",
                        account_name=f"Customer: {payment.party.name}",
                        credit=payment.amount,
                        reference_id=payment.id,
                        reference_type='Payment'
                    )

            messages.success(request, 'Payment saved successfully.')
            return redirect('business_payments')
        except Exception as e:
            messages.error(request, f"Error processing payment: {str(e)}")
            
    return render(request, 'BusinessApp/payment_form.html', {'form': form})


@owner_required
def report_gst(request):
    purchases = PurchaseItem.objects.select_related('purchase', 'purchase__supplier', 'product').order_by('-purchase__purchase_date')
    sales = SaleItem.objects.select_related('sale', 'sale__customer', 'product').order_by('-sale__sale_date')
    context = {'purchases': purchases, 'sales': sales}
    return render(request, 'BusinessApp/reports_gst.html', context)


@owner_required
def report_outstanding(request):
    suppliers = Party.objects.filter(party_type='supplier', balance__gt=0).order_by('-balance')
    customers = Party.objects.filter(party_type='customer', balance__gt=0).order_by('-balance')
    context = {'suppliers': suppliers, 'customers': customers}
    return render(request, 'BusinessApp/reports_outstanding.html', context)


@owner_required
def product_delete(request, id):
    product = get_object_or_404(Product, id=id)
    product.delete()
    messages.success(request, 'Product deleted successfully.')
    return redirect('business_products')


@owner_required
def party_delete(request, id):
    party = get_object_or_404(Party, id=id)
    target = 'business_customers' if party.party_type == 'customer' else 'business_suppliers'
    party.delete()
    messages.success(request, 'Party deleted successfully.')
    return redirect(target)
@owner_required
def sale_delete(request, id):
    sale = get_object_or_404(Sale, id=id)
    try:
        with transaction.atomic():
            # Revert Stock
            for item in sale.saleitem_set.all():
                product = item.product
                product.stock_qty += item.quantity
                product.save()
            
            # Revert Customer Balance
            if sale.customer and sale.balance_amount:
                sale.customer.balance -= sale.balance_amount
                sale.customer.save()
            
            # Delete Related Transactions
            Transaction.objects.filter(reference_id=sale.id, reference_type='Sale').delete()
            
            sale.delete()
            messages.success(request, 'Sale bill deleted and stock reverted.')
    except Exception as e:
        messages.error(request, f"Error deleting sale: {str(e)}")
    return redirect('business_sales')


@owner_required
def purchase_delete(request, id):
    purchase = get_object_or_404(Purchase, id=id)
    try:
        with transaction.atomic():
            # Revert Stock (Subtract what was added)
            for item in purchase.purchaseitem_set.all():
                product = item.product
                product.stock_qty -= item.quantity
                product.save()
            
            # Revert Supplier Balance
            if purchase.supplier and purchase.balance_amount:
                purchase.supplier.balance -= purchase.balance_amount
                purchase.supplier.save()
            
            # Delete Related Transactions
            Transaction.objects.filter(reference_id=purchase.id, reference_type='Purchase').delete()
            
            purchase.delete()
            messages.success(request, 'Purchase entry deleted and stock adjusted.')
    except Exception as e:
        messages.error(request, f"Error deleting purchase: {str(e)}")
    return redirect('business_purchases')
