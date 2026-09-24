from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from django.conf import settings
from .models import Category, Product, Cart, Order, Order_Item
import json
import time

class TestRegistration(TestCase):
    def setUp(self):
        self.client = Client()
        self.register_url = reverse('register')

    def test_register_page_loads(self):
        response = self.client.get(self.register_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'register.html')

    def test_register_short_phone_fails(self):
        response = self.client.post(self.register_url, {
            'first_name': 'Test',
            'username': '12345',  # less than 10 digits
            'password': 'StrongPass123!'
        })
        self.assertEqual(response.status_code, 302)  # redirect
        # Phone validation should fail

    def test_register_mismatched_otp_fails(self):
        # Set a session OTP
        session = self.client.session
        session['verification_otp'] = '123456'
        session.save()
        
        response = self.client.post(self.register_url, {
            'first_name': 'Test',
            'username': '9876543210',
            'password': 'StrongPass123!',
            'otp': '000001'  # wrong OTP and not master OTP
        })
        self.assertEqual(response.status_code, 302)


class TestLogin(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='9876543210',
            password='StrongPass123!',
            first_name='Test'
        )

    def test_login_page_loads(self):
        response = self.client.get(reverse('login'))
        self.assertEqual(response.status_code, 200)

    def test_login_success(self):
        response = self.client.post(reverse('login'), {
            'username': '9876543210',
            'password': 'StrongPass123!'
        })
        self.assertEqual(response.status_code, 302)
        # Should redirect to home
        self.assertRedirects(response, '/')

    def test_login_failure_wrong_password(self):
        response = self.client.post(reverse('login'), {
            'username': '9876543210',
            'password': 'WrongPass!'
        })
        self.assertEqual(response.status_code, 200)  # stays on login page

    def test_login_nonexistent_user(self):
        response = self.client.post(reverse('login'), {
            'username': '1111111111',
            'password': 'SomePass123'
        })
        self.assertEqual(response.status_code, 302)  # redirect to register


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
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Drill Machine')

    def test_home_page_search(self):
        response = self.client.get(reverse('home') + '?q=drill')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Test Drill Machine')

    def test_home_page_search_no_results(self):
        response = self.client.get(reverse('home') + '?q=nonexistenttool')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'No results found')


class TestCartAndCheckout(TestCase):
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
        response = self.client.get(reverse('add_to_cart', args=[self.product.id]))
        self.assertEqual(response.status_code, 302)
        cart_item = Cart.objects.filter(user=self.user, product=self.product).first()
        self.assertIsNotNone(cart_item)
        self.assertEqual(cart_item.product_quantity, 1)

    def test_add_to_cart_increases_quantity(self):
        # Add same product twice
        self.client.get(reverse('add_to_cart', args=[self.product.id]))
        self.client.get(reverse('add_to_cart', args=[self.product.id]))
        cart_item = Cart.objects.get(user=self.user, product=self.product)
        self.assertEqual(cart_item.product_quantity, 2)
        # Server-side: price should be price * quantity
        self.assertEqual(cart_item.product_total, self.product.price * 2)

    def test_cart_page_shows_items(self):
        self.client.get(reverse('add_to_cart', args=[self.product.id]))
        response = self.client.get(reverse('cart'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Welding Machine 200A')

    def test_remove_from_cart(self):
        self.client.get(reverse('add_to_cart', args=[self.product.id]))
        cart_item = Cart.objects.get(user=self.user, product=self.product)
        response = self.client.get(reverse('remove_from_cart', args=[cart_item.id]))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(Cart.objects.filter(user=self.user).count(), 0)

    def test_decrease_product_quantity(self):
        self.client.get(reverse('add_to_cart', args=[self.product.id]))
        self.client.get(reverse('add_to_cart', args=[self.product.id]))
        response = self.client.get(reverse('decrease_product', args=[self.product.id]))
        self.assertEqual(response.status_code, 302)
        cart_item = Cart.objects.get(user=self.user, product=self.product)
        self.assertEqual(cart_item.product_quantity, 1)

    def test_decrease_to_zero_removes_item(self):
        self.client.get(reverse('add_to_cart', args=[self.product.id]))
        self.client.get(reverse('decrease_product', args=[self.product.id]))
        self.assertEqual(Cart.objects.filter(user=self.user).count(), 0)

    def test_checkout_with_empty_cart_redirects(self):
        response = self.client.get(reverse('checkout'))
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('cart'))


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

    def test_product_detail_page(self):
        response = self.client.get(reverse('product_detail', args=[self.product.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Angle Grinder')
        self.assertContains(response, '₹3,500')

    def test_product_listing_page(self):
        response = self.client.get(reverse('product', args=[self.category.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Angle Grinder')

    def test_404_for_invalid_product(self):
        response = self.client.get(reverse('product_detail', args=[9999]))
        self.assertEqual(response.status_code, 404)


class TestCartPriceSecurity(TestCase):
    """Test that cart prices are correctly recalculated server-side at checkout"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='9876543210',
            password='StrongPass123!'
        )
        self.category = Category.objects.create(name='Tools')
        self.product = Product.objects.create(
            category=self.category,
            name='Test Product',
            description='Test',
            price=1000
        )
        self.client.login(username='9876543210', password='StrongPass123!')
        
        # Manually add cart item with manipulated price
        self.cart_item = Cart.objects.create(
            user=self.user,
            product=self.product,
            product_quantity=2,
            product_total=50  # Manipulated: should be 2000 (1000 * 2)
        )

    def test_checkout_recalculates_price(self):
        """Checkout should override manipulated cart prices"""
        response = self.client.get(reverse('checkout'))
        self.assertEqual(response.status_code, 200)
        # The grand_total should be 2000 (2 * 1000), not 50
        self.assertContains(response, '₹2,000')
        # The cart item in DB should be corrected
        self.cart_item.refresh_from_db()
        self.assertEqual(self.cart_item.product_total, 2000)