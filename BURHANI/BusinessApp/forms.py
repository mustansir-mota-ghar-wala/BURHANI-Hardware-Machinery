from django import forms
from BurhaniApp.models import Party, Payment, Product, PurchaseItem, SaleItem, Category

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = [
            'category', 'name', 'description', 'image', 'price',
            'purchase_price', 'stock_qty', 'gst_percent', 'barcode',
            'low_stock_limit', 'show_on_website', 'is_spare_part',
            'is_machinery', 'is_power_tools'
        ]
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }
        labels = {
            'price': 'Selling Price (incl GST)',
            'purchase_price': 'Purchase Price (incl GST)',
            'gst_percent': 'GST %',
        }

class PartyForm(forms.ModelForm):
    class Meta:
        model = Party
        fields = ['name', 'phone', 'address', 'gstin', 'party_type', 'balance']
        widgets = {
            'address': forms.Textarea(attrs={'rows': 3}),
        }
        labels = {
            'gstin': 'GST Number',
            'balance': 'Opening Balance',
        }

class SaleForm(forms.Form):
    customer = forms.ModelChoiceField(
        queryset=Party.objects.filter(party_type='customer'),
        required=False,
        empty_label="Walk-in Customer"
    )
    product = forms.ModelChoiceField(queryset=Product.objects.all())
    quantity = forms.IntegerField(min_value=1, initial=1)
    paid_amount = forms.DecimalField(min_value=0, initial=0, decimal_places=2)
    payment_mode = forms.ChoiceField(
        choices=(('cash', 'Cash'), ('upi', 'UPI'), ('bank', 'Bank')),
        initial='cash'
    )

class PurchaseForm(forms.Form):
    supplier = forms.ModelChoiceField(
        queryset=Party.objects.filter(party_type='supplier'),
        required=False,
        label="Existing Supplier"
    )
    new_supplier_name = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'New Supplier Name'}),
        label="Or New Supplier"
    )
    invoice_no = forms.CharField(required=False, label="Invoice No")
    product = forms.ModelChoiceField(queryset=Product.objects.all())
    quantity = forms.IntegerField(min_value=1, initial=1)
    price = forms.DecimalField(min_value=0, label='Total Amount (incl GST)', decimal_places=2)
    paid_amount = forms.DecimalField(min_value=0, initial=0, decimal_places=2)
    payment_mode = forms.ChoiceField(
        choices=(('cash', 'Cash'), ('upi', 'UPI'), ('bank', 'Bank')),
        initial='bank'
    )

class PurchaseItemForm(forms.ModelForm):
    product = forms.ModelChoiceField(
        queryset=Product.objects.all(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-select product-select'}),
        label="Existing Product"
    )
    new_product_name = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'New Product Name'}),
        label="Or New Product"
    )
    new_category = forms.ModelChoiceField(
        queryset=Category.objects.all(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-select'}),
        label="Category"
    )
    new_gst_percent = forms.DecimalField(
        required=False,
        initial=18,
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'GST %'}),
        label="GST %"
    )
    show_on_website = forms.BooleanField(required=False, initial=True, label="Show on Web")
    
    class Meta:
        model = PurchaseItem
        fields = ['product', 'quantity', 'price_incl_gst', 'show_on_website']
        widgets = {
            'quantity': forms.NumberInput(attrs={'class': 'form-control qty-input', 'min': 1}),
            'price_incl_gst': forms.NumberInput(attrs={'class': 'form-control price-input', 'step': '0.01'}),
        }
        labels = {
            'price_incl_gst': 'Total (incl GST)',
        }

class SaleItemForm(forms.ModelForm):
    class Meta:
        model = SaleItem
        fields = ['product', 'quantity', 'price_incl_gst']
        widgets = {
            'product': forms.Select(attrs={'class': 'form-select product-select'}),
            'quantity': forms.NumberInput(attrs={'class': 'form-control qty-input', 'min': 1}),
            'price_incl_gst': forms.NumberInput(attrs={'class': 'form-control price-input', 'step': '0.01'}),
        }
        labels = {
            'price_incl_gst': 'Unit Price (incl GST)',
        }

class PaymentForm(forms.ModelForm):
    class Meta:
        model = Payment
        fields = ['party', 'payment_type', 'amount', 'payment_mode', 'note']
        widgets = {
            'note': forms.Textarea(attrs={'rows': 3}),
        }
