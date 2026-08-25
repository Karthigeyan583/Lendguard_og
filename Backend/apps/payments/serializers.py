from decimal import Decimal
from rest_framework import serializers
from .models import Payment
from apps.loans.models import Loan
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.loans.services.status_engine import evaluate_loan_status
from apps.reminders.services.reminder_engine import suppress_future_reminders, create_in_app_notification


class PaymentSerializer(serializers.ModelSerializer):
    loan_reference = serializers.CharField(source='loan.loan_reference', read_only=True)
    person_name = serializers.CharField(source='loan.person.name', read_only=True)
    currency = serializers.CharField(source='loan.currency', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'workspace',
            'loan',
            'loan_reference',
            'person_name',
            'currency',
            'amount',
            'payment_date',
            'payment_method',
            'reference_number',
            'notes',
            'is_voided',
            'void_reason',
            'created_by',
            'created_at'
        ]
        read_only_fields = ['id', 'is_voided', 'void_reason', 'created_by', 'created_at']


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
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user

        payment = super().create(validated_data)
        loan = payment.loan

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
