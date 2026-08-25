from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from rest_framework import serializers
from .models import Payment
from apps.loans.models import Loan
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.loans.services.status_engine import evaluate_loan_status
from apps.reminders.services.reminder_engine import suppress_future_reminders, create_in_app_notification
from apps.core.services.fx_engine import get_exchange_rate, convert_currency


class PaymentSerializer(serializers.ModelSerializer):
    loan_reference = serializers.CharField(source='loan.loan_reference', read_only=True)
    person_name = serializers.CharField(source='loan.person.name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'workspace',
            'loan',
            'loan_reference',
            'person_name',
            'amount',
            'currency',
            'reporting_currency',
            'exchange_rate',
            'reporting_amount',
            'fx_rate_date',
            'payment_date',
            'payment_method',
            'reference_number',
            'notes',
            'is_voided',
            'void_reason',
            'created_by',
            'created_at'
        ]
        read_only_fields = [
            'id', 
            'currency', 
            'reporting_currency', 
            'exchange_rate', 
            'reporting_amount', 
            'fx_rate_date', 
            'is_voided', 
            'void_reason', 
            'created_by', 
            'created_at'
        ]


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id',
            'loan',
            'amount',
            'payment_date',
            'payment_method',
            'reference_number',
            'notes'
        ]
        read_only_fields = ['id']

    def validate(self, data):
        loan = data.get('loan')
        amount = data.get('amount')

        if loan.status in ['PAID', 'CANCELLED', 'WRITTEN_OFF']:
            raise serializers.ValidationError(f"Cannot record repayment against a loan that is {loan.status}.")

        # Overpayment Check
        balance = calculate_loan_balance(loan)
        outstanding = balance['outstanding']

        if amount > outstanding:
            raise serializers.ValidationError(
                f"Overpayment Alert: Amount ({amount} {loan.currency}) exceeds remaining outstanding balance ({outstanding} {loan.currency})."
            )

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if (request and hasattr(request, 'user')) else None
        if user:
            validated_data['created_by'] = user

        loan = validated_data['loan']
        
        # Populate Multi-Currency FX Information
        currency = loan.currency or 'INR'
        reporting_currency = loan.reporting_currency or 'INR'
        exchange_rate = loan.exchange_rate or Decimal('1.000000')
        reporting_amount = (Decimal(str(validated_data['amount'])) * exchange_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        validated_data['currency'] = currency
        validated_data['reporting_currency'] = reporting_currency
        validated_data['exchange_rate'] = exchange_rate
        validated_data['reporting_amount'] = reporting_amount
        validated_data['fx_rate_date'] = timezone.now()

        payment = super().create(validated_data)

        # Recalculate status and balances
        status_info = evaluate_loan_status(loan)
        if status_info['financial_status'] == 'PAID':
            suppress_future_reminders(loan)

        # Create in-app confirmation notification
        create_in_app_notification(
            user=loan.created_by,
            title=f"Repayment Received: {payment.amount} {loan.currency}",
            message=f"Received {payment.amount} {loan.currency} from {loan.person.name} for Loan #{loan.loan_reference}. Outstanding is now {status_info['balance']['outstanding']} {loan.currency}.",
            deep_link=f"/loans/{loan.id}"
        )

        return payment


class PaymentVoidSerializer(serializers.Serializer):
    void_reason = serializers.CharField(required=True, min_length=3, help_text="Reason for reversing this transaction")

