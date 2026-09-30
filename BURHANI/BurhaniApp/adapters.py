from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.conf import settings

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Robust adapter that prevents MultipleObjectsReturned when Google SocialApp
    is configured in both the database and settings.py, and ensures consistent redirect behavior.
    """
    def get_app(self, request, provider, client_id=None):
        apps = self.list_apps(request, provider=provider, client_id=client_id)
        if len(apps) > 1:
            # Deduplicate by client_id if both DB and settings.py configure the same app
            seen = {a.client_id: a for a in apps if getattr(a, 'client_id', None)}
            if len(seen) == 1:
                return list(seen.values())[0]
            # If multiple distinct apps exist, return the first active one
            visible_apps = [app for app in apps if not getattr(app, 'settings', {}).get("hidden")]
            if visible_apps:
                return visible_apps[0]
        return super().get_app(request, provider, client_id=client_id)

    def get_login_redirect_url(self, request):
        return getattr(settings, 'LOGIN_REDIRECT_URL', '/')
