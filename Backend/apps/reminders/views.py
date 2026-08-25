from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Reminder, Notification
from .serializers import ReminderSerializer, NotificationSerializer


class ReminderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Reminder Rules & Schedules:
    View scheduled and sent reminders across all active loans.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReminderSerializer
    queryset = Reminder.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Reminder.objects.none()
        user = self.request.user
        if not user.is_authenticated:
            return Reminder.objects.none()
        return Reminder.objects.filter(loan__created_by=user).select_related('loan', 'loan__person')


class NotificationViewSet(viewsets.ModelViewSet):
    """
    In-App Notifications & Alerts:
    Real-time delivery status, payment confirmations, and reminder triggers.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer
    queryset = Notification.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Notification.objects.none()
        user = self.request.user
        if not user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(user=user)

    @extend_schema(summary="Mark Notification as Read", description="Mark alert as acknowledged.", tags=["Notifications"])
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)

    @extend_schema(summary="Mark All Notifications Read", description="Clear all unread alerts.", tags=["Notifications"])
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"message": "All notifications marked as read."}, status=status.HTTP_200_OK)
