import os
import django
import sys

# Add the project directory to sys.path
sys.path.append(r'a:\burhani hardware and machinery\BURHANI')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BURHANI.settings')
django.setup()

from BurhaniApp.models import Category, Product

categories = Category.objects.all()
print(f"Total Categories: {categories.count()}")
for cat in categories:
    print(f"Name: {cat.name}, Image: {cat.image}")

products = Product.objects.all()
print(f"Total Products: {products.count()}")
for prod in products:
    print(f"Name: {prod.name}, Image: {prod.image}")
