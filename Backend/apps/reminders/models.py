from django.db import models
from django.contrib.auth.models import User
from apps.workspaces.models import Workspace
from apps.loans.models import Loan


class Reminder(models.Model):
    REMINDER_TYPE_CHOICES = [
        ('7_days_before', '7 Days Before Due Date'),
        ('3_days_before', '3 Days Before Due Date'),
        ('1_day_before', '1 Day Before Due Date'),
        ('due_today', 'Due Today Reminder'),
        ('overdue', 'Overdue Follow-up Reminder'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent / Delivered'),
        ('suppressed', 'Suppressed (Loan Settled / Cancelled)'),
    ]

    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=30, choices=REMINDER_TYPE_CHOICES)
    scheduled_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['scheduled_date']

    def __str__(self):
        return f"Reminder {self.get_reminder_type_display()} for Loan {self.loan.loan_reference} ({self.status})"


class Notification(models.Model):
    CHANNEL_CHOICES = [
        ('in_app', 'In-App Alert'),
        ('email', 'Email Notification'),
        ('push', 'Push Notification (FCM/APNs)'),
        ('whatsapp', 'WhatsApp (Share/Deep Link)'),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='in_app')
    is_read = models.BooleanField(default=False)
    deep_link = models.CharField(max_length=255, blank=True, help_text="Relative URL to loan or payment")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"
