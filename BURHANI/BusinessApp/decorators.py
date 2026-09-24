from functools import wraps
from django.http import JsonResponse
from django.shortcuts import redirect


def owner_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        is_api = (
            request.path.startswith('/api/') or
            request.headers.get('x-requested-with') == 'XMLHttpRequest' or
            'application/json' in request.headers.get('Accept', '')
        )

        if not request.user.is_authenticated:
            if is_api:
                return JsonResponse({'error': 'Unauthorized', 'detail': 'Please log in to continue.'}, status=401)
            return redirect('/login')

        if request.user.is_superuser or request.user.is_staff:
            return view_func(request, *args, **kwargs)

        if hasattr(request.user, 'profile') and request.user.profile.role == 'owner':
            return view_func(request, *args, **kwargs)

        if is_api:
            return JsonResponse({'error': 'Forbidden', 'detail': 'Staff or business owner privileges required.'}, status=403)
        return redirect('/')

    return wrapper

