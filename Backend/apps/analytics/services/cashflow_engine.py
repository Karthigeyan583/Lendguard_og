import datetime
from decimal import Decimal
from typing import Dict, List, Any
from django.utils import timezone
from django.db.models import Q

from apps.loans.models import Loan
from apps.payments.models import Payment
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.core.services.fx_engine import convert_currency
from .filter_engine import build_loan_q_filter


class CashFlowEngine:
    """
    Computes past realized cash-flows and forward-looking forecast schedules for Lending Inflows & Borrowing Outflows.
    Forecasts are strictly labeled as 'Estimated / Projected'.
    """

    @classmethod
    def get_cashflow_timeline(cls, user, filters: Dict[str, Any] = None, reporting_currency: str = 'INR') -> Dict[str, Any]:
        filters = filters or {}
        today = timezone.localdate()

        # 1. Historical Realized Cashflow (Last 6 Months)
        six_months_ago = (today.replace(day=1) - datetime.timedelta(days=150)).replace(day=1)
        payments = Payment.objects.filter(
            Q(created_by=user) | Q(loan__created_by=user),
            is_voided=False,
            payment_date__gte=six_months_ago
        ).select_related('loan')

        monthly_realized = {}
        for p in payments:
            m_key = p.payment_date.strftime('%Y-%m')
            if m_key not in monthly_realized:
                monthly_realized[m_key] = {
                    'month': m_key,
                    'inflow_recoveries': Decimal('0.00'),
                    'outflow_repayments': Decimal('0.00'),
                    'net_cashflow': Decimal('0.00')
                }
            amt, _ = convert_currency(p.amount, p.currency or p.loan.currency, reporting_currency, getattr(p, 'exchange_rate', None))
            if p.loan.direction in ['borrowed', 'BORROWING']:
                monthly_realized[m_key]['outflow_repayments'] += amt
            else:
                monthly_realized[m_key]['inflow_recoveries'] += amt
            monthly_realized[m_key]['net_cashflow'] = (
                monthly_realized[m_key]['inflow_recoveries'] - monthly_realized[m_key]['outflow_repayments']
            )

        realized_series = sorted([{
            'month': k,
            'inflow': float(v['inflow_recoveries']),
            'outflow': float(v['outflow_repayments']),
            'net': float(v['net_cashflow']),
            'type': 'Actual Realized'
        } for k, v in monthly_realized.items()], key=lambda x: x['month'])

        # 2. Forward Forecast Windows (Today, 7d, 30d, 90d, 180d, 365d)
        windows = [
            {'key': 'today', 'label': 'Today', 'days': 0},
            {'key': '7_days', 'label': 'Next 7 Days', 'days': 7},
            {'key': '30_days', 'label': 'Next 30 Days', 'days': 30},
            {'key': '90_days', 'label': 'Next 90 Days (Quarter)', 'days': 90},
            {'key': '6_months', 'label': 'Next 6 Months', 'days': 180},
            {'key': '12_months', 'label': 'Next 12 Months (Year)', 'days': 365},
        ]

        active_loans = Loan.objects.filter(
            created_by=user,
            status__in=['OPEN', 'PARTIALLY_PAID'],
            is_archived=False
        ).select_related('person')

        forecast_windows = {}
        for w in windows:
            forecast_windows[w['key']] = {
                'key': w['key'],
                'label': w['label'],
                'expected_inflows': Decimal('0.00'),
                'expected_outflows': Decimal('0.00'),
                'projected_net_position': Decimal('0.00'),
                'inflow_count': 0,
                'outflow_count': 0
            }

        # Monthly Forward Timeline (Next 12 Months)
        monthly_forecast = {}
        for i in range(12):
            # Compute month key for next 12 months
            y = today.year + ((today.month - 1 + i) // 12)
            m = ((today.month - 1 + i) % 12) + 1
            f_key = f"{y:04d}-{m:02d}"
            monthly_forecast[f_key] = {
                'month': f_key,
                'expected_inflow': Decimal('0.00'),
                'expected_outflow': Decimal('0.00'),
                'projected_net': Decimal('0.00')
            }

        for loan in active_loans:
            if not loan.due_date:
                continue

            balance = calculate_loan_balance(loan, target_reporting_currency=reporting_currency)
            o_amt = balance['reporting_outstanding']
            if o_amt <= Decimal('0.00'):
                continue

            is_borrowing = (loan.direction in ['borrowed', 'BORROWING'])
            days_to_due = (loan.due_date - today).days

            # Forward Windows
            for w in windows:
                if days_to_due <= w['days']:
                    if is_borrowing:
                        forecast_windows[w['key']]['expected_outflows'] += o_amt
                        forecast_windows[w['key']]['outflow_count'] += 1
                    else:
                        forecast_windows[w['key']]['expected_inflows'] += o_amt
                        forecast_windows[w['key']]['inflow_count'] += 1

            # Monthly Forward Projection
            if loan.due_date >= today:
                f_m_key = loan.due_date.strftime('%Y-%m')
                if f_m_key in monthly_forecast:
                    if is_borrowing:
                        monthly_forecast[f_m_key]['expected_outflow'] += o_amt
                    else:
                        monthly_forecast[f_m_key]['expected_inflow'] += o_amt

        # Format Forecast Output
        formatted_windows = []
        for w in windows:
            data = forecast_windows[w['key']]
            net = data['expected_inflows'] - data['expected_outflows']
            formatted_windows.append({
                'key': w['key'],
                'label': w['label'],
                'expected_inflows': float(data['expected_inflows']),
                'expected_outflows': float(data['expected_outflows']),
                'projected_net_position': float(net),
                'inflows_count': data['inflow_count'],
                'outflows_count': data['outflow_count'],
                'is_projected': True
            })

        forward_timeline = []
        for m_key, v in sorted(monthly_forecast.items()):
            net_proj = v['expected_inflow'] - v['expected_outflow']
            forward_timeline.append({
                'month': m_key,
                'inflow': float(v['expected_inflow']),
                'outflow': float(v['expected_outflow']),
                'net': float(net_proj),
                'type': 'Projected / Estimated'
            })

        return {
            'reporting_currency': reporting_currency,
            'forecast_note': 'Forward cash projections are estimated based on agreed due dates and current authoritative outstanding balances.',
            'forecast_windows': formatted_windows,
            'realized_series': realized_series,
            'forward_projection_series': forward_timeline
        }
