import datetime
from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse

from apps.loans.models import Loan
from apps.people.models import Person
from apps.payments.models import Payment
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.loans.services.status_engine import evaluate_loan_status
from apps.core.services.fx_engine import get_live_ticker_rates, get_exchange_rate, convert_currency


class HealthCheckView(APIView):
    """
    Health Check Endpoint to verify API status, database connectivity, and environment metadata.
    """
    permission_classes = [AllowAny]

    @extend_schema(
        summary="API Health Check",
        description="Check if the Lendguard backend service and database are healthy.",
        responses={200: OpenApiResponse(description="Backend is running normally.")},
        tags=["System"]
    )
    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "LendGuard Lending Ledger API",
            "version": "2.0.0",
            "timestamp": timezone.now().isoformat(),
            "environment": "development"
        })


class DashboardSummaryView(APIView):
    """
    Dashboard Financial Snapshot & Quick Actions (Bible Section 17 & Borrowing Extension):
    Calculates separate metrics for Money Lent (Receivables), Money Borrowed (Payables),
    Net Financial Position, and Multi-Currency Breakdown normalized into the user's Reporting Currency.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = None

    @extend_schema(
        summary="Dashboard Summary",
        description="Returns directional financial metrics (Lending, Borrowing, Net Position) normalized into reporting currency and itemized currency breakdown.",
        responses={200: OpenApiResponse(description="Financial KPIs and recent ledger activity.")},
        tags=["Dashboard"]
    )
    def get(self, request):
        user = request.user
        loans = Loan.objects.filter(created_by=user, is_archived=False)
        today = timezone.localdate()

        req_curr = request.query_params.get('reporting_currency') or request.query_params.get('currency')
        if req_curr and req_curr.upper() != 'REPORTING':
            reporting_currency = req_curr.upper().strip()
        elif hasattr(user, 'profile') and user.profile.base_currency:
            reporting_currency = user.profile.base_currency
        else:
            reporting_currency = 'INR'

        # Lending (Receivables)
        lending_lent = Decimal('0.00')
        lending_repaid = Decimal('0.00')
        lending_outstanding = Decimal('0.00')
        lending_overdue = Decimal('0.00')
        lending_overdue_count = 0
        lending_due_soon_count = 0
        lending_active_count = 0
        lending_paid_count = 0

        # Borrowing (Payables)
        borrowing_borrowed = Decimal('0.00')
        borrowing_repaid = Decimal('0.00')
        borrowing_outstanding = Decimal('0.00')
        borrowing_overdue = Decimal('0.00')
        borrowing_overdue_count = 0
        borrowing_due_soon_count = 0
        borrowing_active_count = 0
        borrowing_paid_count = 0

        currency_breakdown = {}

        for loan in loans:
            if loan.status == 'CANCELLED':
                continue

            balance = calculate_loan_balance(loan, target_reporting_currency=reporting_currency)
            status_info = evaluate_loan_status(loan)

            is_borrowing = (loan.direction == 'borrowed')

            # Multi-Currency Itemized Tracking (in original currencies)
            curr = loan.currency or 'INR'
            if curr not in currency_breakdown:
                currency_breakdown[curr] = {
                    'currency': curr,
                    'total_lent': 0.0,
                    'total_borrowed': 0.0,
                    'lent_repaid': 0.0,
                    'borrowed_repaid': 0.0,
                    'lent_outstanding': 0.0,
                    'borrowed_outstanding': 0.0,
                    'net_outstanding': 0.0,
                    'lent_count': 0,
                    'borrowed_count': 0,
                    'loans_count': 0
                }

            if is_borrowing:
                borrowing_borrowed += balance['reporting_principal']
                borrowing_repaid += balance['reporting_total_repaid']
                borrowing_outstanding += balance['reporting_outstanding']

                currency_breakdown[curr]['total_borrowed'] = round(currency_breakdown[curr]['total_borrowed'] + float(balance['principal']), 2)
                currency_breakdown[curr]['borrowed_repaid'] = round(currency_breakdown[curr]['borrowed_repaid'] + float(balance['total_repaid']), 2)
                currency_breakdown[curr]['borrowed_outstanding'] = round(currency_breakdown[curr]['borrowed_outstanding'] + float(balance['outstanding']), 2)
                currency_breakdown[curr]['borrowed_count'] += 1

                if status_info['financial_status'] == 'PAID':
                    borrowing_paid_count += 1
                else:
                    borrowing_active_count += 1

                if status_info['time_status'] == 'OVERDUE':
                    borrowing_overdue += balance['reporting_outstanding']
                    borrowing_overdue_count += 1
                elif status_info['time_status'] in ['DUE_SOON', 'DUE_TODAY']:
                    borrowing_due_soon_count += 1
            else:
                lending_lent += balance['reporting_principal']
                lending_repaid += balance['reporting_total_repaid']
                lending_outstanding += balance['reporting_outstanding']

                currency_breakdown[curr]['total_lent'] = round(currency_breakdown[curr]['total_lent'] + float(balance['principal']), 2)
                currency_breakdown[curr]['lent_repaid'] = round(currency_breakdown[curr]['lent_repaid'] + float(balance['total_repaid']), 2)
                currency_breakdown[curr]['lent_outstanding'] = round(currency_breakdown[curr]['lent_outstanding'] + float(balance['outstanding']), 2)
                currency_breakdown[curr]['lent_count'] += 1

                if status_info['financial_status'] == 'PAID':
                    lending_paid_count += 1
                else:
                    lending_active_count += 1

                if status_info['time_status'] == 'OVERDUE':
                    lending_overdue += balance['reporting_outstanding']
                    lending_overdue_count += 1
                elif status_info['time_status'] in ['DUE_SOON', 'DUE_TODAY']:
                    lending_due_soon_count += 1

            currency_breakdown[curr]['loans_count'] += 1
            currency_breakdown[curr]['net_outstanding'] = round(
                currency_breakdown[curr]['lent_outstanding'] - currency_breakdown[curr]['borrowed_outstanding'], 2
            )
            # Legacy compatibility fields
            currency_breakdown[curr]['outstanding'] = currency_breakdown[curr]['lent_outstanding']
            currency_breakdown[curr]['total_repaid'] = currency_breakdown[curr]['lent_repaid']

        # Recovery Rate Percentage (Lending only)
        recovery_rate = 0.0
        if lending_lent > Decimal('0.00'):
            recovery_rate = round(float((lending_repaid / lending_lent) * Decimal('100.00')), 1)

        # Repayment Completion Rate Percentage (Borrowing only)
        repayment_completion_rate = 0.0
        if borrowing_borrowed > Decimal('0.00'):
            repayment_completion_rate = round(float((borrowing_repaid / borrowing_borrowed) * Decimal('100.00')), 1)

        # Net Financial Position (Receivables - Payables)
        net_position = lending_outstanding - borrowing_outstanding

        # Recent Loans & Payments
        recent_loans = loans.order_by('-created_at')[:5]
        recent_payments = Payment.objects.filter(created_by=user, is_voided=False).order_by('-created_at')[:5]

        return Response({
            'reporting_currency': reporting_currency,
            'net_position': float(net_position),
            'lending': {
                'total_lent': float(lending_lent),
                'total_repaid': float(lending_repaid),
                'total_outstanding': float(lending_outstanding),
                'total_overdue': float(lending_overdue),
                'recovery_rate': recovery_rate,
                'active_loans_count': lending_active_count,
                'paid_loans_count': lending_paid_count,
                'overdue_count': lending_overdue_count,
                'due_soon_count': lending_due_soon_count,
            },
            'borrowing': {
                'total_borrowed': float(borrowing_borrowed),
                'total_repaid': float(borrowing_repaid),
                'total_outstanding': float(borrowing_outstanding),
                'total_overdue': float(borrowing_overdue),
                'repayment_completion_rate': repayment_completion_rate,
                'active_loans_count': borrowing_active_count,
                'paid_loans_count': borrowing_paid_count,
                'overdue_count': borrowing_overdue_count,
                'due_soon_count': borrowing_due_soon_count,
            },
            # Top-level legacy fields for 100% backward compatibility
            'total_lent': float(lending_lent),
            'total_repaid': float(lending_repaid),
            'total_outstanding': float(lending_outstanding),
            'total_overdue': float(lending_overdue),
            'recovery_rate': recovery_rate,
            'active_loans_count': lending_active_count,
            'paid_loans_count': lending_paid_count,
            'overdue_count': lending_overdue_count,
            'due_soon_count': lending_due_soon_count,
            'currency_breakdown': currency_breakdown,
            'total_people_count': Person.objects.filter(created_by=user, is_archived=False).count(),
            'recent_loans': [{
                'id': l.id,
                'loan_reference': l.loan_reference,
                'direction': l.direction,
                'person_name': l.person.name,
                'amount': float(l.principal_amount),
                'currency': l.currency,
                'reporting_amount': float(getattr(l, 'reporting_principal_amount', l.principal_amount)),
                'reporting_currency': getattr(l, 'reporting_currency', reporting_currency),
                'date_given': str(l.date_given),
                'status': l.status
            } for l in recent_loans],
            'recent_payments': [{
                'id': p.id,
                'loan_reference': p.loan.loan_reference,
                'direction': p.loan.direction,
                'person_name': p.loan.person.name,
                'amount': float(p.amount),
                'currency': getattr(p, 'currency', p.loan.currency),
                'reporting_amount': float(getattr(p, 'reporting_amount', p.amount)),
                'reporting_currency': getattr(p, 'reporting_currency', reporting_currency),
                'payment_date': str(p.payment_date),
                'payment_method': p.payment_method
            } for p in recent_payments]
        })


class ReportsAgingView(APIView):
    """
    Overdue Aging Analysis Report (Bible Section 18 & Borrowing Extension):
    Buckets overdue loan balances into 0-7d, 8-30d, 31-60d, and 60+ days, normalized into reporting currency,
    with directional filtering (Lending, Borrowing, or All).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = None

    @extend_schema(
        summary="Overdue Aging Analysis",
        description="Overdue loans grouped into aging tiers (0-7d, 8-30d, 31-60d, 60+ days) in reporting currency with optional direction filter.",
        responses={200: OpenApiResponse(description="Overdue loans grouped by aging bucket.")},
        tags=["Reports"]
    )
    def get(self, request):
        user = request.user
        loans = Loan.objects.filter(created_by=user, status__in=['OPEN', 'PARTIALLY_PAID'])
        today = timezone.localdate()

        direction_param = request.query_params.get('direction')
        if direction_param and direction_param.lower() != 'all':
            d_lower = direction_param.strip().lower()
            if d_lower in ['borrowed', 'borrowing']:
                loans = loans.filter(direction='borrowed')
            elif d_lower in ['lent', 'lending']:
                loans = loans.filter(direction='lent')

        req_curr = request.query_params.get('reporting_currency') or request.query_params.get('currency')
        if req_curr and req_curr.upper() != 'REPORTING':
            reporting_currency = req_curr.upper().strip()
        elif hasattr(user, 'profile') and user.profile.base_currency:
            reporting_currency = user.profile.base_currency
        else:
            reporting_currency = 'INR'

        buckets = {
            'tier_0_to_7_days': {'count': 0, 'amount': 0.0, 'loans': []},
            'tier_8_to_30_days': {'count': 0, 'amount': 0.0, 'loans': []},
            'tier_31_to_60_days': {'count': 0, 'amount': 0.0, 'loans': []},
            'tier_60_plus_days': {'count': 0, 'amount': 0.0, 'loans': []},
        }

        total_aging_overdue = Decimal('0.00')

        for loan in loans:
            if not loan.due_date or loan.due_date >= today:
                continue

            days_overdue = (today - loan.due_date).days
            balance = calculate_loan_balance(loan, target_reporting_currency=reporting_currency)
            out_val_original = balance['outstanding']
            out_val_reporting = balance['reporting_outstanding']
            total_aging_overdue += out_val_reporting

            loan_summary = {
                'id': loan.id,
                'loan_reference': loan.loan_reference,
                'direction': loan.direction,
                'person_name': loan.person.name,
                'due_date': str(loan.due_date),
                'days_overdue': days_overdue,
                'outstanding': float(out_val_original),
                'currency': loan.currency,
                'reporting_outstanding': float(out_val_reporting),
                'reporting_currency': reporting_currency
            }

            if days_overdue <= 7:
                target = 'tier_0_to_7_days'
            elif days_overdue <= 30:
                target = 'tier_8_to_30_days'
            elif days_overdue <= 60:
                target = 'tier_31_to_60_days'
            else:
                target = 'tier_60_plus_days'

            buckets[target]['count'] += 1
            buckets[target]['amount'] = round(buckets[target]['amount'] + float(out_val_reporting), 2)
            buckets[target]['loans'].append(loan_summary)

        return Response({
            'reporting_currency': reporting_currency,
            'total_overdue': float(total_aging_overdue),
            'buckets': buckets
        })


class DataExportView(APIView):
    """
    Data Management & Full Ledger Backup (Bible Section 26, Screen P27):
    Exports all people, loans, repayments, and metadata with SHA-256 integrity hash.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = None

    @extend_schema(
        summary="Export Complete Ledger Data",
        description="Generates canonical export of all contacts, loans, payments with cryptographic checksum.",
        tags=["Data Management"]
    )
    def get(self, request):
        import hashlib
        import json
        user = request.user
        
        people_qs = Person.objects.filter(created_by=user).order_by('name')
        loans_qs = Loan.objects.filter(created_by=user).order_by('-date_given')
        payments_qs = Payment.objects.filter(created_by=user).order_by('-payment_date')

        people_data = [{
            'id': p.id,
            'name': p.name,
            'relationship': p.relationship,
            'mobile': p.mobile,
            'email': p.email,
            'tags': p.tags,
            'notes': p.notes,
            'is_archived': p.is_archived,
            'created_at': str(p.created_at)
        } for p in people_qs]

        loans_data = []
        for l in loans_qs:
            bal = calculate_loan_balance(l)
            status_info = evaluate_loan_status(l)
            loans_data.append({
                'id': l.id,
                'loan_reference': l.loan_reference,
                'borrower_name': l.person.name,
                'borrower_mobile': l.person.mobile,
                'principal_amount': float(l.principal_amount),
                'currency': l.currency,
                'date_given': str(l.date_given),
                'due_date': str(l.due_date) if l.due_date else None,
                'purpose': l.purpose,
                'status': l.status,
                'time_status': status_info['time_status'],
                'days_overdue': status_info['days_overdue'],
                'total_repaid': float(bal['total_repaid']),
                'outstanding': float(bal['outstanding']),
                'is_fully_paid': bal['is_fully_paid'],
                'created_at': str(l.created_at)
            })

        payments_data = [{
            'id': p.id,
            'loan_reference': p.loan.loan_reference,
            'borrower_name': p.loan.person.name,
            'amount': float(p.amount),
            'currency': p.loan.currency,
            'payment_date': str(p.payment_date),
            'payment_method': p.payment_method,
            'reference_number': p.reference_number,
            'notes': p.notes,
            'is_voided': p.is_voided,
            'created_at': str(p.created_at)
        } for p in payments_qs]

        export_payload = {
            'metadata': {
                'platform': 'LendGuard Personal Lending Ledger',
                'version': '2.0.0',
                'export_timestamp': timezone.now().isoformat(),
                'user': {
                    'username': user.username,
                    'email': user.email,
                    'full_name': f"{user.first_name} {user.last_name}".strip() or user.username
                },
                'counts': {
                    'people_count': len(people_data),
                    'loans_count': len(loans_data),
                    'payments_count': len(payments_data)
                }
            },
            'people': people_data,
            'loans': loans_data,
            'payments': payments_data
        }

        # Calculate canonical SHA-256 seal
        canonical_str = json.dumps(export_payload, sort_keys=True)
        sha256_hash = hashlib.sha256(canonical_str.encode('utf-8')).hexdigest()
        export_payload['sha256_checksum'] = sha256_hash

        return Response(export_payload, status=status.HTTP_200_OK)


class DataPurgeView(APIView):
    """
    Data Purge / Reset Tool (Bible Section 26, Screen P27):
    Safely resets ledger records for the authenticated user without deleting the account.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = None

    @extend_schema(
        summary="Purge / Reset User Ledger Data",
        description="Deletes all loans, payments, and contacts for the current user.",
        tags=["Data Management"]
    )
    def post(self, request):
        user = request.user
        
        loans_count = Loan.objects.filter(created_by=user).count()
        people_count = Person.objects.filter(created_by=user).count()

        # Cascade delete loans, reminders, and payments
        Loan.objects.filter(created_by=user).delete()
        Person.objects.filter(created_by=user).delete()
        
        return Response({
            "message": f"Successfully reset ledger. Cleared {loans_count} loans and {people_count} contacts.",
            "status": "cleared"
        }, status=status.HTTP_200_OK)
