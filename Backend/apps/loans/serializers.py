import random
import string
from django.utils import timezone
from rest_framework import serializers
from .models import Loan
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.loans.services.status_engine import evaluate_loan_status
from apps.reminders.services.reminder_engine import generate_loan_reminders


class LoanSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.name', read_only=True)
    person_mobile = serializers.CharField(source='person.mobile', read_only=True)
    person_email = serializers.CharField(source='person.email', read_only=True)
    person_relationship = serializers.CharField(source='person.relationship', read_only=True)
    
    # Computed Balance & Status fields
    balance = serializers.SerializerMethodField()
    time_status = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()
    recent_payments = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            'id',
            'workspace',
            'created_by',
            'person',
            'person_name',
            'person_mobile',
            'person_email',
            'person_relationship',
            'loan_reference',
            'direction',
            'principal_amount',
            'currency',
            'date_given',
            'due_date',
            'interest_model',
            'interest_rate',
            'fixed_fee_amount',
            'purpose',
            'notes',
            'status',
            'time_status',
            'days_overdue',
            'balance',
            'recent_payments',
            'is_archived',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'loan_reference', 'status', 'created_by', 'created_at', 'updated_at']

    def get_balance(self, obj) -> dict:
        b = calculate_loan_balance(obj)
        return {
            'principal': float(b['principal']),
            'interest_or_fee': float(b['interest_or_fee']),
            'total_payable': float(b['total_payable']),
            'total_repaid': float(b['total_repaid']),
            'outstanding': float(b['outstanding']),
            'is_fully_paid': b['is_fully_paid'],
            'payment_count': b['payment_count']
        }

    def get_time_status(self, obj) -> str:
        status_info = evaluate_loan_status(obj)
        return status_info['time_status']

    def get_days_overdue(self, obj) -> int:
        status_info = evaluate_loan_status(obj)
        return status_info['days_overdue']

    def get_recent_payments(self, obj) -> list:
        payments = obj.payments.filter(is_voided=False).order_by('-payment_date')[:5]
        return [{
            'id': p.id,
            'amount': float(p.amount),
            'payment_date': str(p.payment_date),
            'payment_method': p.payment_method,
            'reference_number': p.reference_number
        } for p in payments]


class LoanCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = [
            'id',
            'person',
            'direction',
            'principal_amount',
            'currency',
            'date_given',
            'due_date',
            'interest_model',
            'interest_rate',
            'fixed_fee_amount',
            'purpose',
            'notes'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        # Auto-generate unique loan reference
        year = timezone.now().year
        rand_code = ''.join(random.choices(string.digits, k=4))
        count = Loan.objects.count() + 1
        validated_data['loan_reference'] = f"LG-{year}-{count:04d}-{rand_code}"
        validated_data['status'] = 'OPEN'

        loan = super().create(validated_data)

        # Generate automatic reminder schedule
        generate_loan_reminders(loan)

        return loan
