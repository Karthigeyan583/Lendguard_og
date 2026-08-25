import datetime
from django.utils import timezone
from decimal import Decimal
from .balance_engine import calculate_loan_balance


def evaluate_loan_status(loan) -> dict:
    """
    Status Engine:
    Financial status: OPEN, PARTIALLY_PAID, PAID, WRITTEN_OFF, CANCELLED
    Time status: UPCOMING, DUE_TODAY, OVERDUE, NO_DUE_DATE
    """
    balance = calculate_loan_balance(loan)
    today = timezone.localdate()

    # 1. Financial Status
    if loan.status in ['WRITTEN_OFF', 'CANCELLED']:
        financial_status = loan.status
    elif balance['outstanding'] == Decimal('0.00') and balance['total_repaid'] > Decimal('0.00'):
        financial_status = 'PAID'
    elif balance['total_repaid'] > Decimal('0.00'):
        financial_status = 'PARTIALLY_PAID'
    else:
        financial_status = 'OPEN'

    # Auto update model status if changed (and not manual write-off)
    if loan.status not in ['WRITTEN_OFF', 'CANCELLED'] and loan.status != financial_status:
        loan.status = financial_status
        loan.save(update_fields=['status'])

    # 2. Time Status
    time_status = 'UPCOMING'
    days_overdue = 0

    if financial_status == 'PAID':
        time_status = 'PAID'
    elif financial_status in ['WRITTEN_OFF', 'CANCELLED']:
        time_status = financial_status
    elif not loan.due_date:
        time_status = 'NO_DUE_DATE'
    else:
        if loan.due_date < today:
            time_status = 'OVERDUE'
            days_overdue = (today - loan.due_date).days
        elif loan.due_date == today:
            time_status = 'DUE_TODAY'
        elif loan.due_date <= today + datetime.timedelta(days=7):
            time_status = 'DUE_SOON'
        else:
            time_status = 'UPCOMING'

    return {
        'financial_status': financial_status,
        'time_status': time_status,
        'days_overdue': days_overdue,
        'balance': balance
    }
