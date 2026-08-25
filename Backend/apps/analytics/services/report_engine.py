import datetime
from decimal import Decimal
from typing import Dict, List, Any, Optional
from django.utils import timezone

from apps.loans.models import Loan
from apps.payments.models import Payment
from apps.people.models import Person
from apps.reminders.models import Reminder
from apps.statements.models import DigitalStatement
from apps.analytics.models import AuditEvent, SavedReport
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.loans.services.status_engine import evaluate_loan_status
from apps.core.services.fx_engine import convert_currency
from .filter_engine import build_loan_q_filter


class CustomReportEngine:
    """
    Executes dynamic custom report configurations, applies groupings, multi-column sorting,
    and calculates 2D Pivot Matrices.
    """

    AVAILABLE_FIELDS = {
        'loans': [
            {'key': 'loan_reference', 'label': 'Agreement Reference', 'type': 'string'},
            {'key': 'direction', 'label': 'Direction (Lent/Borrowed)', 'type': 'string'},
            {'key': 'person_name', 'label': 'Counterparty Name', 'type': 'string'},
            {'key': 'relationship', 'label': 'Relationship', 'type': 'string'},
            {'key': 'currency', 'label': 'Original Currency', 'type': 'string'},
            {'key': 'principal_amount', 'label': 'Principal Amount (Orig)', 'type': 'number'},
            {'key': 'reporting_principal', 'label': 'Principal (Reporting)', 'type': 'number'},
            {'key': 'total_repaid', 'label': 'Total Repaid (Orig)', 'type': 'number'},
            {'key': 'reporting_repaid', 'label': 'Total Repaid (Reporting)', 'type': 'number'},
            {'key': 'outstanding', 'label': 'Outstanding (Orig)', 'type': 'number'},
            {'key': 'reporting_outstanding', 'label': 'Outstanding (Reporting)', 'type': 'number'},
            {'key': 'recovery_rate', 'label': 'Recovery / Completion %', 'type': 'percentage'},
            {'key': 'status', 'label': 'Financial Status', 'type': 'string'},
            {'key': 'time_status', 'label': 'Maturity Time Status', 'type': 'string'},
            {'key': 'date_given', 'label': 'Date Given', 'type': 'date'},
            {'key': 'due_date', 'label': 'Agreed Due Date', 'type': 'date'},
            {'key': 'days_overdue', 'label': 'Days Overdue', 'type': 'number'},
            {'key': 'purpose', 'label': 'Purpose', 'type': 'string'},
        ],
        'payments': [
            {'key': 'id', 'label': 'Payment ID', 'type': 'number'},
            {'key': 'loan_reference', 'label': 'Agreement Ref', 'type': 'string'},
            {'key': 'person_name', 'label': 'Counterparty Name', 'type': 'string'},
            {'key': 'direction', 'label': 'Direction', 'type': 'string'},
            {'key': 'amount', 'label': 'Payment Amount (Orig)', 'type': 'number'},
            {'key': 'currency', 'label': 'Currency', 'type': 'string'},
            {'key': 'reporting_amount', 'label': 'Amount (Reporting)', 'type': 'number'},
            {'key': 'payment_date', 'label': 'Payment Date', 'type': 'date'},
            {'key': 'payment_method', 'label': 'Payment Method', 'type': 'string'},
            {'key': 'reference_number', 'label': 'Reference / Cheque No', 'type': 'string'},
            {'key': 'notes', 'label': 'Notes', 'type': 'string'},
        ],
        'people': [
            {'key': 'id', 'label': 'Contact ID', 'type': 'number'},
            {'key': 'name', 'label': 'Full Name', 'type': 'string'},
            {'key': 'mobile', 'label': 'Mobile Number', 'type': 'string'},
            {'key': 'email', 'label': 'Email Address', 'type': 'string'},
            {'key': 'relationship', 'label': 'Relationship Category', 'type': 'string'},
            {'key': 'total_lent', 'label': 'Total Lent (Reporting)', 'type': 'number'},
            {'key': 'total_borrowed', 'label': 'Total Borrowed (Reporting)', 'type': 'number'},
            {'key': 'net_exposure', 'label': 'Net Exposure (Reporting)', 'type': 'number'},
            {'key': 'active_loans_count', 'label': 'Active Agreements Count', 'type': 'number'},
            {'key': 'tags', 'label': 'Tags', 'type': 'string'},
        ],
        'audit': [
            {'key': 'timestamp', 'label': 'Timestamp', 'type': 'datetime'},
            {'key': 'user', 'label': 'Operator Username', 'type': 'string'},
            {'key': 'action', 'label': 'Action', 'type': 'string'},
            {'key': 'module', 'label': 'Module', 'type': 'string'},
            {'key': 'target_reference', 'label': 'Target Reference', 'type': 'string'},
            {'key': 'details', 'label': 'Details', 'type': 'string'},
            {'key': 'ip_address', 'label': 'IP Address', 'type': 'string'},
        ]
    }

    @classmethod
    def execute_report(cls, user, report_config: Dict[str, Any], reporting_currency: str = 'INR') -> Dict[str, Any]:
        """
        Runs custom report and returns rows, summary aggregations, and optional 2D Pivot table.
        """
        data_source = report_config.get('data_source', 'loans')
        selected_fields = report_config.get('selected_fields') or []
        filters = report_config.get('filters_config') or {}
        group_by_field = report_config.get('group_by')
        pivot_columns_field = report_config.get('pivot_columns')
        sort_by = report_config.get('sort_by', 'created_at')
        sort_order = report_config.get('sort_order', 'desc')

        raw_rows = []

        if data_source in ['loans', 'borrowing']:
            if data_source == 'borrowing':
                filters['direction'] = 'borrowed'
            q = build_loan_q_filter(filters)
            loans = Loan.objects.filter(created_by=user).filter(q).select_related('person')

            for l in loans:
                balance = calculate_loan_balance(l, target_reporting_currency=reporting_currency)
                status_info = evaluate_loan_status(l)

                raw_rows.append({
                    'id': l.id,
                    'loan_reference': l.loan_reference,
                    'direction': 'Money Borrowed (Payable)' if l.direction in ['borrowed', 'BORROWING'] else 'Money Lent (Receivable)',
                    'person_name': l.person.name,
                    'relationship': l.person.get_relationship_display() if hasattr(l.person, 'get_relationship_display') else l.person.relationship,
                    'currency': l.currency,
                    'principal_amount': float(balance['principal']),
                    'reporting_principal': float(balance['reporting_principal']),
                    'total_repaid': float(balance['total_repaid']),
                    'reporting_repaid': float(balance['reporting_total_repaid']),
                    'outstanding': float(balance['outstanding']),
                    'reporting_outstanding': float(balance['reporting_outstanding']),
                    'recovery_rate': float(balance['recovery_rate']),
                    'status': l.status,
                    'time_status': status_info['time_status'],
                    'date_given': str(l.date_given),
                    'due_date': str(l.due_date) if l.due_date else 'N/A',
                    'days_overdue': status_info.get('days_overdue', 0),
                    'purpose': l.purpose or 'General',
                    'month': l.date_given.strftime('%Y-%m') if l.date_given else 'N/A',
                    'quarter': f"{l.date_given.year}-Q{((l.date_given.month - 1) // 3) + 1}" if l.date_given else 'N/A',
                    'year': str(l.date_given.year) if l.date_given else 'N/A',
                })

        elif data_source == 'payments':
            payments = Payment.objects.filter(created_by=user, is_voided=False).select_related('loan', 'loan__person')
            for p in payments:
                amt, _ = convert_currency(p.amount, p.currency or p.loan.currency, reporting_currency, getattr(p, 'exchange_rate', None))
                raw_rows.append({
                    'id': p.id,
                    'loan_reference': p.loan.loan_reference,
                    'person_name': p.loan.person.name,
                    'direction': 'Repayment to Lender' if p.loan.direction in ['borrowed', 'BORROWING'] else 'Recovery from Borrower',
                    'amount': float(p.amount),
                    'currency': p.currency or p.loan.currency,
                    'reporting_amount': float(amt),
                    'payment_date': str(p.payment_date),
                    'payment_method': p.get_payment_method_display() if hasattr(p, 'get_payment_method_display') else str(p.payment_method).title(),
                    'reference_number': p.reference_number or '-',
                    'notes': p.notes or '',
                    'month': p.payment_date.strftime('%Y-%m') if p.payment_date else 'N/A',
                    'year': str(p.payment_date.year) if p.payment_date else 'N/A',
                })

        elif data_source == 'people':
            people = Person.objects.filter(created_by=user, is_archived=False)
            for per in people:
                loans_for_per = Loan.objects.filter(person=per, is_archived=False)
                lent_out = Decimal('0.00')
                borrowed_out = Decimal('0.00')
                for l in loans_for_per:
                    bal = calculate_loan_balance(l, target_reporting_currency=reporting_currency)
                    if l.direction in ['borrowed', 'BORROWING']:
                        borrowed_out += bal['reporting_outstanding']
                    else:
                        lent_out += bal['reporting_outstanding']
                net_exp = lent_out - borrowed_out

                raw_rows.append({
                    'id': per.id,
                    'name': per.name,
                    'mobile': per.mobile or '-',
                    'email': per.email or '-',
                    'relationship': per.get_relationship_display() if hasattr(per, 'get_relationship_display') else per.relationship,
                    'total_lent': float(lent_out),
                    'total_borrowed': float(borrowed_out),
                    'net_exposure': float(net_exp),
                    'active_loans_count': loans_for_per.filter(status__in=['OPEN', 'PARTIALLY_PAID']).count(),
                    'tags': per.tags or ''
                })

        elif data_source == 'audit':
            events = AuditEvent.objects.filter(user=user)[:100]
            for ev in events:
                raw_rows.append({
                    'timestamp': ev.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                    'user': ev.user.username if ev.user else 'System',
                    'action': ev.action,
                    'module': ev.module,
                    'target_reference': ev.target_reference,
                    'details': ev.details,
                    'ip_address': ev.ip_address or '-'
                })

        # Apply Sorting
        if raw_rows and sort_by in raw_rows[0]:
            reverse = (str(sort_order).lower() == 'desc')
            raw_rows.sort(key=lambda x: (x[sort_by] is None, x[sort_by]), reverse=reverse)

        # Apply Grouping if requested
        grouped_data = None
        if group_by_field:
            groups = {}
            for row in raw_rows:
                g_val = str(row.get(group_by_field, 'Unassigned'))
                if g_val not in groups:
                    groups[g_val] = {
                        'group_key': g_val,
                        'count': 0,
                        'total_principal': 0.0,
                        'total_outstanding': 0.0,
                        'total_repaid': 0.0,
                        'rows': []
                    }
                groups[g_val]['count'] += 1
                groups[g_val]['total_principal'] += row.get('reporting_principal', row.get('reporting_amount', 0.0))
                groups[g_val]['total_outstanding'] += row.get('reporting_outstanding', 0.0)
                groups[g_val]['total_repaid'] += row.get('reporting_repaid', row.get('reporting_amount', 0.0))
                groups[g_val]['rows'].append(row)
            grouped_data = list(groups.values())

        # Calculate 2D Pivot Matrix if both row & column groupings are provided
        pivot_matrix = None
        if group_by_field and pivot_columns_field:
            row_keys = sorted(list(set(str(r.get(group_by_field, 'Other')) for r in raw_rows)))
            col_keys = sorted(list(set(str(r.get(pivot_columns_field, 'Other')) for r in raw_rows)))

            matrix = {r: {c: 0.0 for c in col_keys} for r in row_keys}
            row_totals = {r: 0.0 for r in row_keys}
            col_totals = {c: 0.0 for c in col_keys}
            grand_total = 0.0

            for r in raw_rows:
                r_val = str(r.get(group_by_field, 'Other'))
                c_val = str(r.get(pivot_columns_field, 'Other'))
                val = r.get('reporting_outstanding', r.get('reporting_amount', r.get('reporting_principal', 0.0)))
                matrix[r_val][c_val] = round(matrix[r_val][c_val] + val, 2)
                row_totals[r_val] = round(row_totals[r_val] + val, 2)
                col_totals[c_val] = round(col_totals[c_val] + val, 2)
                grand_total = round(grand_total + val, 2)

            pivot_matrix = {
                'row_dimension': group_by_field,
                'col_dimension': pivot_columns_field,
                'row_keys': row_keys,
                'col_keys': col_keys,
                'cells': matrix,
                'row_totals': row_totals,
                'col_totals': col_totals,
                'grand_total': grand_total
            }

        return {
            'data_source': data_source,
            'reporting_currency': reporting_currency,
            'total_rows_count': len(raw_rows),
            'available_columns': cls.AVAILABLE_FIELDS.get(data_source, []),
            'selected_columns': selected_fields if selected_fields else [f['key'] for f in cls.AVAILABLE_FIELDS.get(data_source, [])[:7]],
            'rows': raw_rows,
            'grouped_data': grouped_data,
            'pivot_matrix': pivot_matrix,
            'generated_at': timezone.now().isoformat()
        }
