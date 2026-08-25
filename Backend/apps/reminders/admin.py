from django.contrib import admin
from .models import Reminder, Notification


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ('id', 'loan', 'reminder_type', 'scheduled_date', 'status', 'sent_at')
    list_filter = ('reminder_type', 'status', 'scheduled_date')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'title', 'channel', 'is_read', 'created_at')
    list_filter = ('channel', 'is_read', 'created_at')
