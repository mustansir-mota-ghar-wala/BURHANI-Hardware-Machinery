from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from .models import Category, Product, Cart, Order, Order_Item, UserProfile
import json


class TestRegistration(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_url = reverse('api_register')

    def test_register_short_phone_fails(self):
        response = self.client.post(
            self.register_url,
            data=json.dumps({
                'first_name': 'Test',
                'username': '12345',  # less than 10 digits
                'password': 'StrongPass123!'
            }),
            content_type='application/json'
        )
        data = response.json()
        self.assertEqual(data.get('status'), 'error')
        self.assertIn('10 digits', data.get('message', ''))

    def test_register_mismatched_otp_fails(self):
        session = self.client.session
        session['verification_otp'] = '123456'
        session.save()

        response = self.client.post(
            self.register_url,
            data=json.dumps({
                'first_name': 'Test',
                'username': '9876543210',
                'password': 'StrongPass123!',
                'otp': '000001'  # wrong OTP and not master OTP 000000
            }),
            content_type='application/json'
        )
        data = response.json()
        self.assertEqual(data.get('status'), 'error')
        self.assertIn('Invalid OTP', data.get('message', ''))

    def test_register_success(self):
        response = self.client.post(
            self.register_url,
            data=json.dumps({
                'first_name': 'NewUser',
                'username': '9876543210',
                'password': 'StrongPassword123!',
                'otp': '000000'  # master OTP for testing
            }),
            content_type='application/json'
        )
        data = response.json()
        self.assertEqual(data.get('status'), 'success')
        self.assertTrue(User.objects.filter(username='9876543210').exists())


class TestLogin(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='9876543210',
            password='StrongPass123!',
            first_name='Test'
        )
        self.login_url = reverse('api_login')

    def test_login_success(self):
        response = self.client.post(
            self.login_url,
            data=json.dumps({
                'username': '9876543210',
                'password': 'StrongPass123!'
            }),
            content_type='application/json'
        )
        data = response.json()
        self.assertEqual(data.get('status'), 'success')
        self.assertEqual(data.get('username'), '9876543210')

    def test_login_failure_wrong_password(self):
        response = self.client.post(
            self.login_url,
            data=json.dumps({
                'username': '9876543210',
                'password': 'WrongPass!'
            }),
            content_type='application/json'
        )
        data = response.json()
        self.assertEqual(data.get('status'), 'error')

    def test_login_nonexistent_user(self):
        response = self.client.post(
            self.login_url,
            data=json.dumps({
                'username': '1111111111',
                'password': 'SomePass123'
            }),
            content_type='application/json'
        )
        data = response.json()
        self.assertEqual(data.get('status'), 'error')


class TestHomePage(TestCase):
    def setUp(self):
        self.client = Client()
        self.category = Category.objects.create(name='Power Tools')
        self.product = Product.objects.create(
            category=self.category,
            name='Test Drill Machine',
            description='A powerful drill',
            price=2500,
            is_power_tools=True
        )

    def test_home_page_loads(self):
        response = self.client.get(reverse('api_home'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('categories', data)
        self.assertIn('products', data)
        product_names = [p['name'] for p in data['products']]
        self.assertIn('Test Drill Machine', product_names)

    def test_home_page_search(self):
        response = self.client.get(reverse('api_home') + '?q=drill')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        product_names = [p['name'] for p in data['products']]
        self.assertIn('Test Drill Machine', product_names)

    def test_home_page_search_no_results(self):
        response = self.client.get(reverse('api_home') + '?q=nonexistenttool')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['products']), 0)


class TestCart(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='9876543210',
            password='StrongPass123!',
            first_name='Test'
        )
        self.category = Category.objects.create(name='Tools')
        self.product = Product.objects.create(
            category=self.category,
            name='Welding Machine 200A',
            description='200 Amp welding machine',
            price=15000
        )
        self.client.login(username='9876543210', password='StrongPass123!')

    def test_add_to_cart(self):
        response = self.client.post(reverse('api_add_to_cart', args=[self.product.id]))
        self.assertEqual(response.status_code, 200)
        cart_item = Cart.objects.filter(user=self.user, product=self.product).first()
        self.assertIsNotNone(cart_item)
        self.assertEqual(cart_item.product_quantity, 1)

    def test_add_to_cart_increases_quantity(self):
        self.client.post(reverse('api_add_to_cart', args=[self.product.id]))
        self.client.post(reverse('api_add_to_cart', args=[self.product.id]))
        cart_item = Cart.objects.get(user=self.user, product=self.product)
        self.assertEqual(cart_item.product_quantity, 2)
        self.assertEqual(cart_item.product_total, self.product.price * 2)

    def test_cart_api_shows_items(self):
        self.client.post(reverse('api_add_to_cart', args=[self.product.id]))
        response = self.client.get(reverse('api_cart'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['cart']), 1)
        self.assertEqual(data['cart'][0]['product']['name'], 'Welding Machine 200A')

    def test_remove_from_cart(self):
        self.client.post(reverse('api_add_to_cart', args=[self.product.id]))
        cart_item = Cart.objects.get(user=self.user, product=self.product)
        response = self.client.post(reverse('api_remove_from_cart', args=[cart_item.id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Cart.objects.filter(user=self.user).count(), 0)

    def test_decrease_product_quantity(self):
        self.client.post(reverse('api_add_to_cart', args=[self.product.id]))
        self.client.post(reverse('api_add_to_cart', args=[self.product.id]))
        response = self.client.post(reverse('api_decrease_product', args=[self.product.id]))
        self.assertEqual(response.status_code, 200)
        cart_item = Cart.objects.get(user=self.user, product=self.product)
        self.assertEqual(cart_item.product_quantity, 1)

    def test_decrease_to_zero_removes_item(self):
        self.client.post(reverse('api_add_to_cart', args=[self.product.id]))
        response = self.client.post(reverse('api_decrease_product', args=[self.product.id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Cart.objects.filter(user=self.user).count(), 0)


class TestOrderModel(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='9876543210',
            password='StrongPass123!'
        )
        self.category = Category.objects.create(name='Tools')
        self.product = Product.objects.create(
            category=self.category,
            name='Chainsaw',
            description='Powerful chainsaw',
            price=8000
        )
        self.order = Order.objects.create(
            user=self.user,
            address='[CONTACT: Test User | 9876543210] Test Address 123456',
            bill=8000,
            payment_status='Pending (COD)'
        )

    def test_order_str(self):
        self.assertIn('Order #', str(self.order))

    def test_order_save_auto_paid_on_delivered(self):
        self.order.delivery_status = 'Delivered'
        self.order.save()
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'Paid')

    def test_order_item_creation(self):
        item = Order_Item.objects.create(
            order=self.order,
            product=self.product,
            product_quantity=2,
            product_total=16000
        )
        self.assertEqual(item.product.name, 'Chainsaw')
        self.assertEqual(item.product_quantity, 2)


class TestAddressValidation(TestCase):
    def test_valid_address(self):
        from BurhaniApp.views import validate_shipping_address
        is_valid, msg = validate_shipping_address(
            '[CONTACT: John Doe | 9876543210] 123 Main Street, City 123456'
        )
        self.assertTrue(is_valid)

    def test_invalid_address_missing_contact(self):
        from BurhaniApp.views import validate_shipping_address
        is_valid, msg = validate_shipping_address('Just a random address without format')
        self.assertFalse(is_valid)

    def test_invalid_address_short_phone(self):
        from BurhaniApp.views import validate_shipping_address
        is_valid, msg = validate_shipping_address(
            '[CONTACT: John | 12345] Some address 123456'
        )
        self.assertFalse(is_valid)

    def test_invalid_address_no_pin(self):
        from BurhaniApp.views import validate_shipping_address
        is_valid, msg = validate_shipping_address(
            '[CONTACT: John Doe | 9876543210] Address without pin code'
        )
        self.assertFalse(is_valid)


class TestSitemapAndRobots(TestCase):
    def setUp(self):
        self.client = Client()
        Category.objects.create(name='TestCat')

    def test_robots_txt(self):
        response = self.client.get(reverse('robots_txt'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Disallow: /admin/')
        self.assertContains(response, 'Sitemap:')

    def test_sitemap_xml(self):
        response = self.client.get(reverse('sitemap_xml'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'xmlns')


class TestProductDetails(TestCase):
    def setUp(self):
        self.client = Client()
        self.category = Category.objects.create(name='Tools')
        self.product = Product.objects.create(
            category=self.category,
            name='Angle Grinder',
            description='Heavy duty grinder',
            price=3500
        )

    def test_product_detail_api(self):
        response = self.client.get(reverse('api_product_detail', args=[self.product.id]))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['product']['name'], 'Angle Grinder')
        self.assertEqual(data['product']['price'], '3500.00')

    def test_product_listing_api(self):
        response = self.client.get(reverse('api_product_list', args=[self.category.id]))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['products']), 1)
        self.assertEqual(data['products'][0]['name'], 'Angle Grinder')

    def test_404_for_invalid_product(self):
        response = self.client.get(reverse('api_product_detail', args=[9999]))
        self.assertEqual(response.status_code, 404)


class TestBusinessApi(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = User.objects.create_superuser(
            username='admin',
            password='AdminPassword123!',
            first_name='Admin'
        )
        self.category = Category.objects.create(name='Machinery')
        self.product = Product.objects.create(
            category=self.category,
            name='Concrete Mixer',
            price=45000,
            purchase_price=38000,
            stock_qty=5
        )

    def test_dashboard_unauthenticated_forbidden(self):
        response = self.client.get('/api/business/dashboard/')
        self.assertIn(response.status_code, [401, 403])

    def test_dashboard_admin_access(self):
        self.client.login(username='admin', password='AdminPassword123!')
        response = self.client.get('/api/business/dashboard/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('today_sales', data)
        self.assertIn('sales_trend', data)

    def test_business_products_api(self):
        self.client.login(username='admin', password='AdminPassword123!')
        response = self.client.get('/api/business/products/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('products', data)
        self.assertTrue(any(p['name'] == 'Concrete Mixer' for p in data['products']))