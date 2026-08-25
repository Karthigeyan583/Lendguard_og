from rest_framework import serializers
from .models import Reminder, Notification


class ReminderSerializer(serializers.ModelSerializer):
    loan_reference = serializers.CharField(source='loan.loan_reference', read_only=True)
    person_name = serializers.CharField(source='loan.person.name', read_only=True)
    due_date = serializers.DateField(source='loan.due_date', read_only=True)

    class Meta:
        model = Reminder
        fields = [
            'id',
            'loan',
            'loan_reference',
            'person_name',
            'due_date',
            'reminder_type',
            'scheduled_date',
            'status',
            'sent_at'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'channel',
            'is_read',
            'deep_link',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
