"""
WSGI config for BURHANI project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BURHANI.settings')

import traceback

try:
    _application = get_wsgi_application()
except Exception:
    _error = traceback.format_exc()
    def application(environ, start_response):
        start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
        return [b"Failed to load WSGI application:\\n", _error.encode('utf-8')]
else:
    def application(environ, start_response):
        try:
            # We iterate over the response in case the exception happens during generation
            response = _application(environ, start_response)
            return response
        except Exception:
            error = traceback.format_exc()
            start_response('500 Internal Server Error', [('Content-Type', 'text/plain')])
            return [b"Exception during request:\\n", error.encode('utf-8')]
