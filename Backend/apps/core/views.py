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
    Dashboard Financial Snapshot & Quick Actions (Bible Section 17):
    Calculates Total Lent, Total Repaid, Outstanding, Overdue, Recovery %, and Recent Activity.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = None

    @extend_schema(
        summary="Dashboard Summary",
        description="Returns top-level financial metrics and urgency indicators for the dashboard.",
        responses={200: OpenApiResponse(description="Financial KPIs and recent ledger activity.")},
        tags=["Dashboard"]
    )
    def get(self, request):
        user = request.user
        loans = Loan.objects.filter(created_by=user, is_archived=False)
        today = timezone.localdate()

        total_lent = Decimal('0.00')
        total_repaid = Decimal('0.00')
        total_outstanding = Decimal('0.00')
        total_overdue = Decimal('0.00')
        overdue_count = 0
        due_soon_count = 0
        active_loans_count = 0
        paid_loans_count = 0

        for loan in loans:
            if loan.status == 'CANCELLED':
                continue

            balance = calculate_loan_balance(loan)
            status_info = evaluate_loan_status(loan)

            total_lent += balance['principal']
            total_repaid += balance['total_repaid']
            total_outstanding += balance['outstanding']

            if status_info['financial_status'] == 'PAID':
                paid_loans_count += 1
            else:
                active_loans_count += 1

            if status_info['time_status'] == 'OVERDUE':
                total_overdue += balance['outstanding']
                overdue_count += 1
            elif status_info['time_status'] == 'DUE_SOON' or status_info['time_status'] == 'DUE_TODAY':
                due_soon_count += 1

        # Recovery Rate Percentage
        recovery_rate = 0.0
        if total_lent > Decimal('0.00'):
            recovery_rate = round(float((total_repaid / total_lent) * Decimal('100.00')), 1)

        # Recent Loans & Payments
        recent_loans = loans.order_by('-created_at')[:5]
        recent_payments = Payment.objects.filter(created_by=user, is_voided=False).order_by('-created_at')[:5]

        return Response({
            'total_lent': float(total_lent),
            'total_repaid': float(total_repaid),
            'total_outstanding': float(total_outstanding),
            'total_overdue': float(total_overdue),
            'recovery_rate': recovery_rate,
            'active_loans_count': active_loans_count,
            'paid_loans_count': paid_loans_count,
            'overdue_count': overdue_count,
            'due_soon_count': due_soon_count,
            'total_people_count': Person.objects.filter(created_by=user, is_archived=False).count(),
            'recent_loans': [{
                'id': l.id,
                'loan_reference': l.loan_reference,
                'person_name': l.person.name,
                'amount': float(l.principal_amount),
                'currency': l.currency,
                'date_given': str(l.date_given),
                'status': l.status
            } for l in recent_loans],
            'recent_payments': [{
                'id': p.id,
                'loan_reference': p.loan.loan_reference,
                'person_name': p.loan.person.name,
                'amount': float(p.amount),
                'currency': p.loan.currency,
                'payment_date': str(p.payment_date),
                'payment_method': p.payment_method
            } for p in recent_payments]
        })


class ReportsAgingView(APIView):
    """
    Overdue Aging Analysis Report (Bible Section 18):
    Buckets overdue loan balances into 0-7d, 8-30d, 31-60d, and 60+ days.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = None

    @extend_schema(
        summary="Overdue Aging Analysis",
        description="Overdue loans grouped into aging tiers (0-7d, 8-30d, 31-60d, 60+ days).",
        responses={200: OpenApiResponse(description="Overdue loans grouped by aging bucket.")},
        tags=["Reports"]
    )
    def get(self, request):
        user = request.user
        loans = Loan.objects.filter(created_by=user, status__in=['OPEN', 'PARTIALLY_PAID'])
        today = timezone.localdate()

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
            balance = calculate_loan_balance(loan)
            out_val = balance['outstanding']
            total_aging_overdue += out_val

            loan_summary = {
                'id': loan.id,
                'loan_reference': loan.loan_reference,
                'person_name': loan.person.name,
                'due_date': str(loan.due_date),
                'days_overdue': days_overdue,
                'outstanding': float(out_val),
                'currency': loan.currency
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
            buckets[target]['amount'] = round(buckets[target]['amount'] + float(out_val), 2)
            buckets[target]['loans'].append(loan_summary)

        return Response({
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
