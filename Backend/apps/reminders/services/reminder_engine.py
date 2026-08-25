import datetime
from apps.reminders.models import Reminder, Notification


def generate_loan_reminders(loan):
    """
    Reminder Engine:
    Creates 7-day, 3-day, 1-day, Due Today, and Overdue reminder events for loans with due dates.
    """
    if not loan.due_date:
        return

    # Clear existing pending reminders for this loan
    loan.reminders.filter(status='pending').delete()

    due = loan.due_date
    schedule = [
        ('7_days_before', due - datetime.timedelta(days=7)),
        ('3_days_before', due - datetime.timedelta(days=3)),
        ('1_day_before', due - datetime.timedelta(days=1)),
        ('due_today', due),
        ('overdue', due + datetime.timedelta(days=3)),
    ]

    for rem_type, sched_date in schedule:
        Reminder.objects.create(
            loan=loan,
            reminder_type=rem_type,
            scheduled_date=sched_date,
            status='pending'
        )


def suppress_future_reminders(loan):
    """
    Suppresses all future pending reminders once a loan is fully settled or cancelled.
    """
    loan.reminders.filter(status='pending').update(status='suppressed')


def create_in_app_notification(user, title, message, deep_link='', workspace=None):
    """
    Creates an in-app notification record.
    """
    return Notification.objects.create(
        user=user,
        workspace=workspace,
        title=title,
        message=message,
        channel='in_app',
        deep_link=deep_link
    )
