import random
import string
from decimal import Decimal
from django.utils import timezone
from rest_framework import serializers
from .models import Loan
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.loans.services.status_engine import evaluate_loan_status
from apps.reminders.services.reminder_engine import generate_loan_reminders
from apps.core.services.fx_engine import get_exchange_rate, convert_currency


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
            'reporting_currency',
            'exchange_rate',
            'fx_rate_date',
            'reporting_principal_amount',
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
        read_only_fields = [
            'id', 
            'loan_reference', 
            'status', 
            'reporting_currency', 
            'exchange_rate', 
            'fx_rate_date', 
            'reporting_principal_amount', 
            'created_by', 
            'created_at', 
            'updated_at'
        ]

    def get_balance(self, obj) -> dict:
        b = calculate_loan_balance(obj)
        return {
            'principal': float(b['principal']),
            'currency': b['currency'],
            'interest_or_fee': float(b['interest_or_fee']),
            'total_payable': float(b['total_payable']),
            'total_repaid': float(b['total_repaid']),
            'outstanding': float(b['outstanding']),
            'recovery_rate': b['recovery_rate'],
            'is_fully_paid': b['is_fully_paid'],
            'payment_count': b['payment_count'],
            'reporting_currency': b['reporting_currency'],
            'exchange_rate': float(b['exchange_rate']),
            'reporting_principal': float(b['reporting_principal']),
            'reporting_total_repaid': float(b['reporting_total_repaid']),
            'reporting_outstanding': float(b['reporting_outstanding'])
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
            'currency': getattr(p, 'currency', obj.currency),
            'reporting_currency': getattr(p, 'reporting_currency', obj.reporting_currency),
            'reporting_amount': float(getattr(p, 'reporting_amount', p.amount)),
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
            'reporting_currency',
            'exchange_rate',
            'reporting_principal_amount',
            'date_given',
            'due_date',
            'interest_model',
            'interest_rate',
            'fixed_fee_amount',
            'purpose',
            'notes'
        ]
        read_only_fields = ['id', 'reporting_currency', 'exchange_rate', 'reporting_principal_amount']

    def validate(self, data):
        date_given = data.get('date_given')
        due_date = data.get('due_date')
        purpose = data.get('purpose', '')

        if not purpose or not purpose.strip():
            raise serializers.ValidationError({"purpose": "Purpose / lending context is required."})

        if due_date and date_given and due_date < date_given:
            raise serializers.ValidationError({"due_date": "Agreed due date cannot be earlier than the date the money was given."})

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if (request and hasattr(request, 'user')) else None
        if user:
            validated_data['created_by'] = user

        # Auto-generate unique loan reference
        year = timezone.now().year
        rand_code = ''.join(random.choices(string.digits, k=4))
        count = Loan.objects.count() + 1
        validated_data['loan_reference'] = f"LG-{year}-{count:04d}-{rand_code}"
        validated_data['status'] = 'OPEN'

        # Multi-Currency & Reporting Currency Initialization
        reporting_currency = 'INR'
        if user and hasattr(user, 'profile') and user.profile.base_currency:
            reporting_currency = user.profile.base_currency

        currency = validated_data.get('currency', 'INR')
        rate = get_exchange_rate(currency, reporting_currency)
        reporting_principal, _ = convert_currency(validated_data['principal_amount'], currency, reporting_currency, rate)

        validated_data['reporting_currency'] = reporting_currency
        validated_data['exchange_rate'] = rate
        validated_data['reporting_principal_amount'] = reporting_principal
        validated_data['fx_rate_date'] = timezone.now()

        loan = super().create(validated_data)

        # Generate automatic reminder schedule
        generate_loan_reminders(loan)

        return loan
