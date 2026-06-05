import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BURHANI.settings')
django.setup()

print("ENGINE:", settings.DATABASES['default']['ENGINE'])
print("NAME:", settings.DATABASES['default']['NAME'])
print("HOST:", settings.DATABASES['default'].get('HOST', 'N/A'))
