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


def format_reminder_message(loan, reminder_type):
    """
    Constructs direction-aware notification message wording for lending vs borrowing.
    """
    person_name = loan.person.name if loan.person else 'Contact'
    amount_str = f"{loan.currency} {loan.principal_amount}"
    is_borrowing = (loan.direction == 'borrowed')

    if is_borrowing:
        if reminder_type == '7_days_before':
            return f"Upcoming: Your repayment of {amount_str} to {person_name} is due in 7 days."
        elif reminder_type == '3_days_before':
            return f"Reminder: Your repayment of {amount_str} to {person_name} is due in 3 days."
        elif reminder_type == '1_day_before':
            return f"Urgent: Your repayment of {amount_str} to {person_name} is due tomorrow."
        elif reminder_type == 'due_today':
            return f"Due Today: Your repayment of {amount_str} to {person_name} is due today."
        elif reminder_type == 'overdue':
            return f"Overdue: Your repayment of {amount_str} to {person_name} is past due."
    else:
        if reminder_type == '7_days_before':
            return f"Upcoming: {person_name}'s repayment of {amount_str} is due in 7 days."
        elif reminder_type == '3_days_before':
            return f"Reminder: {person_name}'s repayment of {amount_str} is due in 3 days."
        elif reminder_type == '1_day_before':
            return f"Urgent: {person_name}'s repayment of {amount_str} is due tomorrow."
        elif reminder_type == 'due_today':
            return f"Due Today: {person_name}'s repayment of {amount_str} is due today."
        elif reminder_type == 'overdue':
            return f"Overdue: {person_name}'s repayment of {amount_str} is past due."
    return f"Reminder for {loan.loan_reference}"


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
