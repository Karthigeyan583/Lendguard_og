from rest_framework import serializers
from .models import Person
from apps.loans.services.balance_engine import calculate_loan_balance


class PersonSerializer(serializers.ModelSerializer):
    total_lent = serializers.SerializerMethodField()
    total_repaid = serializers.SerializerMethodField()
    outstanding_balance = serializers.SerializerMethodField()
    active_loans_count = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = [
            'id',
            'workspace',
            'created_by',
            'name',
            'mobile',
            'email',
            'relationship',
            'tags',
            'notes',
            'is_archived',
            'total_lent',
            'total_repaid',
            'outstanding_balance',
            'active_loans_count',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def get_total_lent(self, obj) -> float:
        total = sum(l.principal_amount for l in obj.loans.filter(status__in=['OPEN', 'PARTIALLY_PAID', 'PAID']))
        return float(total)

    def get_total_repaid(self, obj) -> float:
        repaid = 0.0
        for l in obj.loans.all():
            b = calculate_loan_balance(l)
            repaid += float(b['total_repaid'])
        return round(repaid, 2)

    def get_outstanding_balance(self, obj) -> float:
        out = 0.0
        for l in obj.loans.filter(status__in=['OPEN', 'PARTIALLY_PAID']):
            b = calculate_loan_balance(l)
            out += float(b['outstanding'])
        return round(out, 2)

    def get_active_loans_count(self, obj) -> int:
        return obj.loans.filter(status__in=['OPEN', 'PARTIALLY_PAID']).count()

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)
