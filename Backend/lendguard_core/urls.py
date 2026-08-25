"""
URL configuration for lendguard_core project (LendGuard Product Development Bible v2.0).
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # OpenAPI 3.0 Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API v1 Domain Endpoints
    path('api/v1/', include('apps.core.urls')),
    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/people/', include('apps.people.urls')),
    path('api/v1/loans/', include('apps.loans.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/reminders/', include('apps.reminders.urls')),
    path('api/v1/statements/', include('apps.statements.urls')),
]
