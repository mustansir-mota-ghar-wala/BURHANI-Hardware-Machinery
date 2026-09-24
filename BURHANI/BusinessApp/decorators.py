from functools import wraps

from django.shortcuts import redirect


def owner_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')

        if request.user.is_superuser:
            return view_func(request, *args, **kwargs)

        if not hasattr(request.user, 'profile') or request.user.profile.role != 'owner':
            return redirect('home')

        return view_func(request, *args, **kwargs)

    return wrapper
