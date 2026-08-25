from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StatementViewSet

router = DefaultRouter()
router.register(r'', StatementViewSet, basename='statement')

urlpatterns = [
    path('', include(router.urls)),
]
