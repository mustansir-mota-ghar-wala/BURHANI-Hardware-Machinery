import os
import django
import random

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BURHANI.settings')
django.setup()

from BurhaniApp.models import Category, Product

def populate():
    # FINAL PREMIUM Categories using previously generated high-end images
    categories_data = [
        {"name": "Power Tools", "is_power_tools": True, "cat_img": "cat_powertools.png", "prod_img_base": "power_tools"},
        {"name": "Welding Machines", "is_machinery": True, "cat_img": "cat_welding.png", "prod_img_base": "welding_cutting"},
        {"name": "Gasoline Chain Saws", "is_power_tools": True, "cat_img": "cat_chainsaw.png", "prod_img_base": "gardening_outdoor"},
        {"name": "Industrial Spare Parts", "is_spare_part": True, "cat_img": "cat_spare_parts.png", "prod_img_base": "spare_parts"},
        {"name": "Hardware Accessories", "is_spare_part": True, "cat_img": "cat_hardware.png", "prod_img_base": "accessories"},
        {"name": "Heavy Machinery", "is_machinery": True, "cat_img": "cat_machinery.png", "prod_img_base": "industrial_machinery"},
        {"name": "Pneumatic Tools", "is_power_tools": True, "cat_img": "cat_pneumatic.png", "prod_img_base": "pneumatic"},
        {"name": "Precision Instruments", "is_power_tools": False, "cat_img": "cat_precision.png", "prod_img_base": "precision"},
        {"name": "Safety Equipment", "is_spare_part": False, "cat_img": "cat_safety.png", "prod_img_base": "safety_protective"},
        {"name": "Industrial Lubricants", "is_spare_part": True, "cat_img": "cat_lubricants.png", "prod_img_base": "lubricants"},
    ]

    brands = ["Bosch", "Makita", "DeWalt", "Stanley", "Milwaukee", "Hilti", "Black+Decker", "Hitachi", "Metabo", "Ryobi"]
    models = ["X-Series", "Pro-Max", "Ultra-Grip", "Stealth-V2", "Nitro-Core", "Force-8", "Iron-Clad", "Apex-Gen2"]

    print("Cleaning existing database...")
    Product.objects.all().delete()
    Category.objects.all().delete()

    for cat_data in categories_data:
        # Create category with the PREMIUM generated image
        category = Category.objects.create(
            name=cat_data["name"],
            image=f"category_images/{cat_data['cat_img']}"
        )
        print(f"Creating Category: {category.name}")

        products = []
        # Create 100 products per category
        for i in range(1, 101):
            brand = random.choice(brands)
            model = random.choice(models)
            
            name = f"{brand} {category.name[:-1] if category.name.endswith('s') else category.name} {model} #{i}"
            description = f"The {name} is a high-end {category.name.lower()} solution engineered for professional industrial excellence. Built with {brand} {model} technology for maximum durability."
            price = random.randint(2500, 115000)
            
            # Determine flags
            is_machinery = cat_data.get("is_machinery", False)
            is_power_tools = cat_data.get("is_power_tools", False)
            is_spare_part = cat_data.get("is_spare_part", False)

            # Assign one of the 10 rotating variety images for this category type
            img_num = ((i - 1) % 10) + 1
            img_path = f"products_image/{cat_data['prod_img_base']}_{img_num}.jpg"

            products.append(Product(
                category=category,
                name=name,
                description=description,
                price=price,
                is_machinery=is_machinery,
                is_power_tools=is_power_tools,
                is_spare_part=is_spare_part,
                image=img_path
            ))
        
        Product.objects.bulk_create(products)
        print(f"  --> Successfully added 100 products with variety images to {category.name}")

    print("\n" + "="*40)
    print("SUCCESS: Premium Theme-Matched Categories and 1,000 Products Created!")
    print("="*40)

if __name__ == '__main__':
    populate()
