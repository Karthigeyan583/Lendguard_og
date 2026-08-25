from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReminderViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'schedules', ReminderViewSet, basename='reminder-schedule')
router.register(r'alerts', NotificationViewSet, basename='notification-alert')

urlpatterns = [
    path('', include(router.urls)),
]
