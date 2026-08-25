import datetime
from decimal import Decimal
from typing import Dict, List, Any, Optional
from django.utils import timezone
from django.db.models import Count, Sum, Q

from apps.loans.models import Loan
from apps.payments.models import Payment
from apps.people.models import Person
from apps.reminders.models import Reminder, Notification
from apps.statements.models import DigitalStatement
from apps.loans.services.balance_engine import calculate_loan_balance, calculate_interest_or_fees
from apps.loans.services.status_engine import evaluate_loan_status
from apps.core.services.fx_engine import convert_currency, get_exchange_rate
from .filter_engine import build_loan_q_filter, get_date_range_bounds, get_comparison_date_bounds


# ==========================================
# 1. CENTRAL METRIC DICTIONARY REGISTRY
# ==========================================
METRIC_REGISTRY = {
    'total_lent': {
        'id': 'total_lent',
        'name': 'Total Capital Lent',
        'category': 'Lending',
        'description': 'Sum of all principal amounts disbursed across lending agreements.',
        'direction': 'LENDING',
        'currency_mode': 'reporting',
        'formula': 'SUM(reporting_principal) for direction=lent'
    },
    'total_borrowed': {
        'id': 'total_borrowed',
        'name': 'Total Capital Borrowed',
        'category': 'Borrowing',
        'description': 'Sum of all principal amounts received across borrowing obligations.',
        'direction': 'BORROWING',
        'currency_mode': 'reporting',
        'formula': 'SUM(reporting_principal) for direction=borrowed'
    },
    'total_recovered': {
        'id': 'total_recovered',
        'name': 'Total Recoveries Collected',
        'category': 'Lending',
        'description': 'Total repayments collected from borrowers across all loans.',
        'direction': 'LENDING',
        'currency_mode': 'reporting',
        'formula': 'SUM(reporting_repaid) for direction=lent'
    },
    'total_repaid_to_lenders': {
        'id': 'total_repaid_to_lenders',
        'name': 'Total Repaid to Lenders',
        'category': 'Borrowing',
        'description': 'Total repayments made towards clearing borrowing liabilities.',
        'direction': 'BORROWING',
        'currency_mode': 'reporting',
        'formula': 'SUM(reporting_repaid) for direction=borrowed'
    },
    'outstanding_receivables': {
        'id': 'outstanding_receivables',
        'name': 'Outstanding Receivables',
        'category': 'Lending',
        'description': 'Total uncollected capital currently owed to user by borrowers.',
        'direction': 'LENDING',
        'currency_mode': 'reporting',
        'formula': 'SUM(reporting_outstanding) for direction=lent'
    },
    'outstanding_payables': {
        'id': 'outstanding_payables',
        'name': 'Outstanding Payables (You Owe)',
        'category': 'Borrowing',
        'description': 'Total un-repaid debt liability currently owed by user to lenders.',
        'direction': 'BORROWING',
        'currency_mode': 'reporting',
        'formula': 'SUM(reporting_outstanding) for direction=borrowed'
    },
    'net_financial_position': {
        'id': 'net_financial_position',
        'name': 'Net Lending / Financial Position',
        'category': 'Net Overview',
        'description': 'Outstanding Receivables minus Outstanding Payables.',
        'direction': 'NET',
        'currency_mode': 'reporting',
        'formula': 'Outstanding Receivables - Outstanding Payables'
    },
    'recovery_rate': {
        'id': 'recovery_rate',
        'name': 'Recovery Rate %',
        'category': 'Lending',
        'description': 'Percentage of total lent capital recovered from borrowers.',
        'direction': 'LENDING',
        'currency_mode': 'none',
        'formula': '(Total Recovered / Total Lent) * 100'
    },
    'repayment_completion_rate': {
        'id': 'repayment_completion_rate',
        'name': 'Repayment Completion Rate %',
        'category': 'Borrowing',
        'description': 'Percentage of total borrowed obligations cleared to lenders.',
        'direction': 'BORROWING',
        'currency_mode': 'none',
        'formula': '(Total Repaid to Lenders / Total Borrowed) * 100'
    },
    'overdue_receivables': {
        'id': 'overdue_receivables',
        'name': 'Overdue Receivables',
        'category': 'Lending',
        'description': 'Uncollected receivables that have passed maturity due date.',
        'direction': 'LENDING',
        'currency_mode': 'reporting',
        'formula': 'SUM(reporting_outstanding) for overdue lending agreements'
    },
    'overdue_payables': {
        'id': 'overdue_payables',
        'name': 'Overdue Payables',
        'category': 'Borrowing',
        'description': 'Unpaid liabilities that have passed maturity due date.',
        'direction': 'BORROWING',
        'currency_mode': 'reporting',
        'formula': 'SUM(reporting_outstanding) for overdue borrowing obligations'
    },
}


# ==========================================
# 2. CENTRAL CALCULATION ENGINE
# ==========================================
class AnalyticsMetricService:
    """
    Authoritative Analytics & Reporting Calculation Engine.
    Exposes reusable, high-performance financial analytics methods.
    """

    @classmethod
    def get_executive_overview(cls, user, filters: Dict[str, Any] = None, reporting_currency: str = 'INR') -> Dict[str, Any]:
        """
        Calculates executive snapshot, net position, directional metrics, comparison period delta,
        and high-level distributions.
        """
        filters = filters or {}
        base_q = build_loan_q_filter(filters)
        loans = Loan.objects.filter(created_by=user).filter(base_q).select_related('person')

        today = timezone.localdate()

        # Cumulative Metrics in Base Reporting Currency
        lent_total = Decimal('0.00')
        lent_repaid = Decimal('0.00')
        lent_outstanding = Decimal('0.00')
        lent_overdue = Decimal('0.00')
        lent_active_count = 0
        lent_paid_count = 0
        lent_overdue_count = 0

        borrowed_total = Decimal('0.00')
        borrowed_repaid = Decimal('0.00')
        borrowed_outstanding = Decimal('0.00')
        borrowed_overdue = Decimal('0.00')
        borrowed_active_count = 0
        borrowed_paid_count = 0
        borrowed_overdue_count = 0

        currency_shares = {}
        top_exposures = []
        loan_summaries = []

        for loan in loans:
            if loan.status == 'CANCELLED':
                continue

            balance = calculate_loan_balance(loan, target_reporting_currency=reporting_currency)
            status_info = evaluate_loan_status(loan)
            is_borrowing = (loan.direction in ['borrowed', 'BORROWING'])

            curr = loan.currency or 'INR'
            if curr not in currency_shares:
                currency_shares[curr] = {
                    'currency': curr,
                    'lent_reporting': Decimal('0.00'),
                    'borrowed_reporting': Decimal('0.00'),
                    'total_reporting': Decimal('0.00'),
                    'original_lent': Decimal('0.00'),
                    'original_borrowed': Decimal('0.00'),
                    'loan_count': 0
                }

            currency_shares[curr]['loan_count'] += 1

            if is_borrowing:
                borrowed_total += balance['reporting_principal']
                borrowed_repaid += balance['reporting_total_repaid']
                borrowed_outstanding += balance['reporting_outstanding']
                currency_shares[curr]['borrowed_reporting'] += balance['reporting_principal']
                currency_shares[curr]['original_borrowed'] += balance['principal']

                if status_info['financial_status'] == 'PAID':
                    borrowed_paid_count += 1
                else:
                    borrowed_active_count += 1

                if status_info['time_status'] == 'OVERDUE':
                    borrowed_overdue += balance['reporting_outstanding']
                    borrowed_overdue_count += 1
            else:
                lent_total += balance['reporting_principal']
                lent_repaid += balance['reporting_total_repaid']
                lent_outstanding += balance['reporting_outstanding']
                currency_shares[curr]['lent_reporting'] += balance['reporting_principal']
                currency_shares[curr]['original_lent'] += balance['principal']

                if status_info['financial_status'] == 'PAID':
                    lent_paid_count += 1
                else:
                    lent_active_count += 1

                if status_info['time_status'] == 'OVERDUE':
                    lent_overdue += balance['reporting_outstanding']
                    lent_overdue_count += 1

            currency_shares[curr]['total_reporting'] = (
                currency_shares[curr]['lent_reporting'] + currency_shares[curr]['borrowed_reporting']
            )

        # Net Position = Outstanding Receivables - Outstanding Payables
        net_position = lent_outstanding - borrowed_outstanding
        total_gross_portfolio = lent_total + borrowed_total

        # Format Currency Exposure Slices
        currency_breakdown = []
        for curr, data in currency_shares.items():
            share_pct = round(float((data['total_reporting'] / total_gross_portfolio * Decimal('100.00'))), 1) if total_gross_portfolio > 0 else 0.0
            currency_breakdown.append({
                'currency': curr,
                'reporting_amount': float(data['total_reporting']),
                'original_lent': float(data['original_lent']),
                'original_borrowed': float(data['original_borrowed']),
                'portfolio_percentage': share_pct,
                'loan_count': data['loan_count']
            })
        currency_breakdown.sort(key=lambda x: x['reporting_amount'], reverse=True)

        # Calculate Rates
        recovery_rate = round(float((lent_repaid / lent_total * Decimal('100.00'))), 1) if lent_total > 0 else 100.0
        repayment_completion_rate = round(float((borrowed_repaid / borrowed_total * Decimal('100.00'))), 1) if borrowed_total > 0 else 100.0

        # Comparative Analysis (Delta vs Previous Period)
        comparison_mode = filters.get('comparison_mode', 'previous_period')
        date_preset = filters.get('date_range')
        custom_start = filters.get('start_date')
        custom_end = filters.get('end_date')
        start_d, end_d = get_date_range_bounds(date_preset, custom_start, custom_end)

        comparison_data = None
        if start_d and end_d:
            prev_start, prev_end = get_comparison_date_bounds(start_d, end_d, mode=comparison_mode)
            prev_filters = {**filters, 'date_range': 'custom', 'start_date': str(prev_start), 'end_date': str(prev_end)}
            prev_overview = cls.get_executive_overview(user, prev_filters, reporting_currency)
            
            lent_delta = float(lent_total) - prev_overview['lending']['total_lent']
            lent_growth = round((lent_delta / prev_overview['lending']['total_lent'] * 100), 1) if prev_overview['lending']['total_lent'] > 0 else 0.0
            
            recovery_delta = float(lent_repaid) - prev_overview['lending']['total_repaid']
            recovery_growth = round((recovery_delta / prev_overview['lending']['total_repaid'] * 100), 1) if prev_overview['lending']['total_repaid'] > 0 else 0.0

            comparison_data = {
                'previous_window': {'start': str(prev_start), 'end': str(prev_end)},
                'lending_delta': lent_delta,
                'lending_growth_percent': lent_growth,
                'recovery_delta': recovery_delta,
                'recovery_growth_percent': recovery_growth,
                'prev_net_position': prev_overview['net_position']
            }

        return {
            'reporting_currency': reporting_currency,
            'generated_at': timezone.now().isoformat(),
            'net_position': float(net_position),
            'net_position_label': 'Net Receivable (You are owed money)' if net_position > 0 else 'Net Payable (You owe money)' if net_position < 0 else 'Settled Net Position',
            'lending': {
                'total_lent': float(lent_total),
                'total_repaid': float(lent_repaid),
                'total_outstanding': float(lent_outstanding),
                'total_overdue': float(lent_overdue),
                'recovery_rate': recovery_rate,
                'active_loans_count': lent_active_count,
                'paid_loans_count': lent_paid_count,
                'overdue_count': lent_overdue_count,
            },
            'borrowing': {
                'total_borrowed': float(borrowed_total),
                'total_repaid': float(borrowed_repaid),
                'total_outstanding': float(borrowed_outstanding),
                'total_overdue': float(borrowed_overdue),
                'repayment_completion_rate': repayment_completion_rate,
                'active_loans_count': borrowed_active_count,
                'paid_loans_count': borrowed_paid_count,
                'overdue_count': borrowed_overdue_count,
            },
            'currency_exposure': currency_breakdown,
            'comparison': comparison_data,
            'total_active_contacts': Person.objects.filter(created_by=user, is_archived=False).count(),
        }

    @classmethod
    def get_lending_analytics(cls, user, filters: Dict[str, Any] = None, reporting_currency: str = 'INR') -> Dict[str, Any]:
        """
        Deep Lending analytics: monthly volume trends, recovery curve, loan size bands,
        purpose distribution, and borrower concentration.
        """
        filters = filters or {}
        lending_filters = {**filters, 'direction': 'lent'}
        base_q = build_loan_q_filter(lending_filters)
        loans = Loan.objects.filter(created_by=user).filter(base_q).select_related('person')

        total_lent = Decimal('0.00')
        total_repaid = Decimal('0.00')
        total_outstanding = Decimal('0.00')
        total_overdue = Decimal('0.00')
        loan_sizes = []
        monthly_trends = {}
        purpose_distribution = {}
        borrower_exposure = {}

        # Configurable loan size bands (<1k, 1k-5k, 5k-10k, 10k-50k, 50k+)
        size_bands = {
            'under_1k': {'label': '< 1,000', 'count': 0, 'total': Decimal('0.00'), 'outstanding': Decimal('0.00')},
            '1k_to_5k': {'label': '1,000 – 5,000', 'count': 0, 'total': Decimal('0.00'), 'outstanding': Decimal('0.00')},
            '5k_to_10k': {'label': '5,000 – 10,000', 'count': 0, 'total': Decimal('0.00'), 'outstanding': Decimal('0.00')},
            '10k_to_50k': {'label': '10,000 – 50,000', 'count': 0, 'total': Decimal('0.00'), 'outstanding': Decimal('0.00')},
            'over_50k': {'label': '50,000+', 'count': 0, 'total': Decimal('0.00'), 'outstanding': Decimal('0.00')},
        }

        for loan in loans:
            if loan.status == 'CANCELLED':
                continue

            balance = calculate_loan_balance(loan, target_reporting_currency=reporting_currency)
            status_info = evaluate_loan_status(loan)

            p_amt = balance['reporting_principal']
            r_amt = balance['reporting_total_repaid']
            o_amt = balance['reporting_outstanding']

            total_lent += p_amt
            total_repaid += r_amt
            total_outstanding += o_amt

            if status_info['time_status'] == 'OVERDUE':
                total_overdue += o_amt

            loan_sizes.append(float(p_amt))

            # Monthly Trend Grouping
            m_key = loan.date_given.strftime('%Y-%m') if loan.date_given else 'Unknown'
            if m_key not in monthly_trends:
                monthly_trends[m_key] = {'month': m_key, 'lent': Decimal('0.00'), 'repaid': Decimal('0.00'), 'loans_count': 0}
            monthly_trends[m_key]['lent'] += p_amt
            monthly_trends[m_key]['repaid'] += r_amt
            monthly_trends[m_key]['loans_count'] += 1

            # Purpose Distribution
            purp = (loan.purpose or 'General Lending').strip().title()
            if purp not in purpose_distribution:
                purpose_distribution[purp] = {'purpose': purp, 'count': 0, 'total_amount': Decimal('0.00'), 'outstanding': Decimal('0.00')}
            purpose_distribution[purp]['count'] += 1
            purpose_distribution[purp]['total_amount'] += p_amt
            purpose_distribution[purp]['outstanding'] += o_amt

            # Borrower Concentration
            b_name = loan.person.name
            if b_name not in borrower_exposure:
                borrower_exposure[b_name] = {
                    'person_id': loan.person.id,
                    'name': b_name,
                    'relationship': loan.person.relationship,
                    'total_lent': Decimal('0.00'),
                    'total_repaid': Decimal('0.00'),
                    'outstanding': Decimal('0.00'),
                    'loans_count': 0
                }
            borrower_exposure[b_name]['total_lent'] += p_amt
            borrower_exposure[b_name]['total_repaid'] += r_amt
            borrower_exposure[b_name]['outstanding'] += o_amt
            borrower_exposure[b_name]['loans_count'] += 1

            # Size Band Categorization
            if p_amt < Decimal('1000.00'):
                b = size_bands['under_1k']
            elif p_amt <= Decimal('5000.00'):
                b = size_bands['1k_to_5k']
            elif p_amt <= Decimal('10000.00'):
                b = size_bands['5k_to_10k']
            elif p_amt <= Decimal('50000.00'):
                b = size_bands['10k_to_50k']
            else:
                b = size_bands['over_50k']
            b['count'] += 1
            b['total'] += p_amt
            b['outstanding'] += o_amt

        # Format Outputs
        avg_loan = round(float(total_lent / Decimal(str(len(loan_sizes)))), 2) if loan_sizes else 0.0
        largest_loan = max(loan_sizes) if loan_sizes else 0.0

        sorted_trends = sorted(monthly_trends.values(), key=lambda x: x['month'])
        trend_list = [{
            'month': x['month'],
            'lent': float(x['lent']),
            'repaid': float(x['repaid']),
            'loans_count': x['loans_count']
        } for x in sorted_trends]

        purpose_list = sorted([{
            'purpose': v['purpose'],
            'count': v['count'],
            'total_amount': float(v['total_amount']),
            'outstanding': float(v['outstanding']),
            'share_percentage': round(float(v['total_amount'] / total_lent * Decimal('100.00')), 1) if total_lent > 0 else 0.0
        } for v in purpose_distribution.values()], key=lambda x: x['total_amount'], reverse=True)

        borrower_ranking = sorted([{
            'person_id': v['person_id'],
            'name': v['name'],
            'relationship': v['relationship'],
            'total_lent': float(v['total_lent']),
            'total_repaid': float(v['total_repaid']),
            'outstanding': float(v['outstanding']),
            'loans_count': v['loans_count'],
            'recovery_rate': round(float(v['total_repaid'] / v['total_lent'] * 100), 1) if v['total_lent'] > 0 else 100.0
        } for v in borrower_exposure.values()], key=lambda x: x['outstanding'], reverse=True)

        formatted_bands = [{
            'key': k,
            'label': v['label'],
            'count': v['count'],
            'total_amount': float(v['total']),
            'outstanding': float(v['outstanding']),
            'share_percentage': round(float(v['total'] / total_lent * Decimal('100.00')), 1) if total_lent > 0 else 0.0
        } for k, v in size_bands.items()]

        return {
            'reporting_currency': reporting_currency,
            'summary': {
                'total_lent': float(total_lent),
                'total_repaid': float(total_repaid),
                'total_outstanding': float(total_outstanding),
                'total_overdue': float(total_overdue),
                'recovery_rate': round(float(total_repaid / total_lent * 100), 1) if total_lent > 0 else 100.0,
                'average_loan_size': avg_loan,
                'largest_loan': largest_loan,
                'total_agreements_count': len(loan_sizes),
            },
            'monthly_trends': trend_list,
            'purpose_breakdown': purpose_list,
            'size_distribution': formatted_bands,
            'top_borrowers': borrower_ranking[:10],
        }

    @classmethod
    def get_borrowing_analytics(cls, user, filters: Dict[str, Any] = None, reporting_currency: str = 'INR') -> Dict[str, Any]:
        """
        Deep Borrowing analytics: obligations, repayment pace, upcoming repayment schedules,
        and lender liability concentration.
        """
        filters = filters or {}
        borrowing_filters = {**filters, 'direction': 'borrowed'}
        base_q = build_loan_q_filter(borrowing_filters)
        loans = Loan.objects.filter(created_by=user).filter(base_q).select_related('person')

        total_borrowed = Decimal('0.00')
        total_repaid = Decimal('0.00')
        total_outstanding = Decimal('0.00')
        total_overdue = Decimal('0.00')
        borrowing_sizes = []
        monthly_trends = {}
        lender_liabilities = {}
        upcoming_obligations = []

        today = timezone.localdate()

        for loan in loans:
            if loan.status == 'CANCELLED':
                continue

            balance = calculate_loan_balance(loan, target_reporting_currency=reporting_currency)
            status_info = evaluate_loan_status(loan)

            p_amt = balance['reporting_principal']
            r_amt = balance['reporting_total_repaid']
            o_amt = balance['reporting_outstanding']

            total_borrowed += p_amt
            total_repaid += r_amt
            total_outstanding += o_amt

            if status_info['time_status'] == 'OVERDUE':
                total_overdue += o_amt

            borrowing_sizes.append(float(p_amt))

            # Monthly Trend
            m_key = loan.date_given.strftime('%Y-%m') if loan.date_given else 'Unknown'
            if m_key not in monthly_trends:
                monthly_trends[m_key] = {'month': m_key, 'borrowed': Decimal('0.00'), 'repaid': Decimal('0.00'), 'count': 0}
            monthly_trends[m_key]['borrowed'] += p_amt
            monthly_trends[m_key]['repaid'] += r_amt
            monthly_trends[m_key]['count'] += 1

            # Lender Concentration
            l_name = loan.person.name
            if l_name not in lender_liabilities:
                lender_liabilities[l_name] = {
                    'person_id': loan.person.id,
                    'name': l_name,
                    'relationship': loan.person.relationship,
                    'total_borrowed': Decimal('0.00'),
                    'total_repaid': Decimal('0.00'),
                    'outstanding_payable': Decimal('0.00'),
                    'obligations_count': 0
                }
            lender_liabilities[l_name]['total_borrowed'] += p_amt
            lender_liabilities[l_name]['total_repaid'] += r_amt
            lender_liabilities[l_name]['outstanding_payable'] += o_amt
            lender_liabilities[l_name]['obligations_count'] += 1

            # Upcoming Due Debts
            if o_amt > Decimal('0.00') and loan.due_date and loan.due_date >= today:
                days_left = (loan.due_date - today).days
                upcoming_obligations.append({
                    'id': loan.id,
                    'reference': loan.loan_reference,
                    'lender_name': loan.person.name,
                    'due_date': str(loan.due_date),
                    'days_remaining': days_left,
                    'outstanding_payable': float(o_amt),
                    'currency': loan.currency
                })

        upcoming_obligations.sort(key=lambda x: x['days_remaining'])

        sorted_trends = sorted(monthly_trends.values(), key=lambda x: x['month'])
        trend_list = [{
            'month': x['month'],
            'borrowed': float(x['borrowed']),
            'repaid': float(x['repaid']),
            'obligations_count': x['count']
        } for x in sorted_trends]

        lender_ranking = sorted([{
            'person_id': v['person_id'],
            'name': v['name'],
            'relationship': v['relationship'],
            'total_borrowed': float(v['total_borrowed']),
            'total_repaid': float(v['total_repaid']),
            'outstanding_payable': float(v['outstanding_payable']),
            'obligations_count': v['obligations_count'],
            'completion_rate': round(float(v['total_repaid'] / v['total_borrowed'] * 100), 1) if v['total_borrowed'] > 0 else 100.0
        } for v in lender_liabilities.values()], key=lambda x: x['outstanding_payable'], reverse=True)

        avg_borrowing = round(float(total_borrowed / Decimal(str(len(borrowing_sizes)))), 2) if borrowing_sizes else 0.0

        return {
            'reporting_currency': reporting_currency,
            'summary': {
                'total_borrowed': float(total_borrowed),
                'total_repaid': float(total_repaid),
                'total_outstanding_payable': float(total_outstanding),
                'total_overdue_payable': float(total_overdue),
                'repayment_completion_rate': round(float(total_repaid / total_borrowed * 100), 1) if total_borrowed > 0 else 100.0,
                'average_borrowing_size': avg_borrowing,
                'active_obligations_count': len([s for s in borrowing_sizes if s > 0]),
            },
            'monthly_trends': trend_list,
            'top_lenders': lender_ranking[:10],
            'upcoming_obligations': upcoming_obligations[:10]
        }

    @classmethod
    def get_payments_analytics(cls, user, filters: Dict[str, Any] = None, reporting_currency: str = 'INR') -> Dict[str, Any]:
        """
        Itemized Payments Analytics: method breakdown (Cash, UPI, Bank Transfer, Card, Cheque),
        payment size metrics (avg, median, largest), on-time vs late behavior, and directional volume.
        """
        filters = filters or {}
        payments = Payment.objects.filter(created_by=user, is_voided=False).select_related('loan', 'loan__person')

        # Apply Date Range Bounds
        date_preset = filters.get('date_range')
        custom_start = filters.get('start_date')
        custom_end = filters.get('end_date')
        start_d, end_d = get_date_range_bounds(date_preset, custom_start, custom_end)
        if start_d:
            payments = payments.filter(payment_date__gte=start_d)
        if end_d:
            payments = payments.filter(payment_date__lte=end_d)

        # Directional filter if specified
        direction_filter = str(filters.get('direction', '')).lower()
        if direction_filter in ['lent', 'lending']:
            payments = payments.filter(loan__direction='lent')
        elif direction_filter in ['borrowed', 'borrowing']:
            payments = payments.filter(loan__direction='borrowed')

        total_value = Decimal('0.00')
        payment_amounts = []
        method_counts = {}
        monthly_volume = {}

        on_time_count = 0
        late_count = 0
        early_count = 0
        total_days_late = 0

        for p in payments:
            amt = Decimal(str(p.amount))
            loan = p.loan
            curr = p.currency or loan.currency or 'INR'

            # Convert to reporting currency
            converted_amt, _ = convert_currency(amt, curr, reporting_currency, getattr(p, 'exchange_rate', None))
            total_value += converted_amt
            payment_amounts.append(float(converted_amt))

            # Method Breakdown
            m_name = p.get_payment_method_display() if hasattr(p, 'get_payment_method_display') else str(p.payment_method).replace('_', ' ').title()
            if m_name not in method_counts:
                method_counts[m_name] = {'method': m_name, 'count': 0, 'total_amount': Decimal('0.00')}
            method_counts[m_name]['count'] += 1
            method_counts[m_name]['total_amount'] += converted_amt

            # Monthly Volume
            m_key = p.payment_date.strftime('%Y-%m') if p.payment_date else 'Unknown'
            if m_key not in monthly_volume:
                monthly_volume[m_key] = {'month': m_key, 'total_amount': Decimal('0.00'), 'count': 0}
            monthly_volume[m_key]['total_amount'] += converted_amt
            monthly_volume[m_key]['count'] += 1

            # Payment Behavior Analysis (relative to loan due date)
            if loan.due_date and p.payment_date:
                if p.payment_date > loan.due_date:
                    late_count += 1
                    total_days_late += (p.payment_date - loan.due_date).days
                elif p.payment_date < loan.due_date:
                    early_count += 1
                else:
                    on_time_count += 1
            else:
                on_time_count += 1

        payment_amounts.sort()
        count = len(payment_amounts)
        avg_payment = round(float(total_value / Decimal(str(count))), 2) if count > 0 else 0.0
        median_payment = round(payment_amounts[count // 2], 2) if count > 0 else 0.0
        largest_payment = payment_amounts[-1] if count > 0 else 0.0

        methods_list = sorted([{
            'method': v['method'],
            'count': v['count'],
            'total_amount': float(v['total_amount']),
            'percentage': round(float(v['total_amount'] / total_value * 100), 1) if total_value > 0 else 0.0
        } for v in method_counts.values()], key=lambda x: x['total_amount'], reverse=True)

        monthly_list = sorted([{
            'month': v['month'],
            'total_amount': float(v['total_amount']),
            'count': v['count']
        } for v in monthly_volume.values()], key=lambda x: x['month'])

        avg_days_late = round(total_days_late / late_count, 1) if late_count > 0 else 0.0

        return {
            'reporting_currency': reporting_currency,
            'summary': {
                'total_payments_count': count,
                'total_payments_value': float(total_value),
                'average_payment': avg_payment,
                'median_payment': median_payment,
                'largest_payment': largest_payment,
            },
            'payment_methods': methods_list,
            'monthly_trend': monthly_list,
            'behavior': {
                'on_time_payments': on_time_count,
                'late_payments': late_count,
                'early_payments': early_count,
                'average_days_late': avg_days_late,
                'on_time_percentage': round((on_time_count / count * 100), 1) if count > 0 else 100.0
            }
        }
