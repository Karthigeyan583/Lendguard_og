from rest_framework import serializers
from .models import Person
from apps.loans.services.balance_engine import calculate_loan_balance


class PersonSerializer(serializers.ModelSerializer):
    reporting_currency = serializers.SerializerMethodField()
    total_lent = serializers.SerializerMethodField()
    total_repaid = serializers.SerializerMethodField()
    outstanding_balance = serializers.SerializerMethodField()
    active_loans_count = serializers.SerializerMethodField()
    currency_breakdown = serializers.SerializerMethodField()

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
            'reporting_currency',
            'total_lent',
            'total_repaid',
            'outstanding_balance',
            'active_loans_count',
            'currency_breakdown',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def _get_reporting_currency(self, obj) -> str:
        request = self.context.get('request')
        user = request.user if (request and hasattr(request, 'user')) else obj.created_by
        if user and hasattr(user, 'profile') and user.profile.base_currency:
            return user.profile.base_currency
        return 'INR'

    def get_reporting_currency(self, obj) -> str:
        return self._get_reporting_currency(obj)

    def get_total_lent(self, obj) -> float:
        rep_curr = self._get_reporting_currency(obj)
        total = 0.0
        for l in obj.loans.filter(status__in=['OPEN', 'PARTIALLY_PAID', 'PAID']):
            b = calculate_loan_balance(l, target_reporting_currency=rep_curr)
            total += float(b['reporting_principal'])
        return round(total, 2)

    def get_total_repaid(self, obj) -> float:
        rep_curr = self._get_reporting_currency(obj)
        repaid = 0.0
        for l in obj.loans.all():
            if l.status == 'CANCELLED':
                continue
            b = calculate_loan_balance(l, target_reporting_currency=rep_curr)
            repaid += float(b['reporting_total_repaid'])
        return round(repaid, 2)

    def get_outstanding_balance(self, obj) -> float:
        rep_curr = self._get_reporting_currency(obj)
        out = 0.0
        for l in obj.loans.filter(status__in=['OPEN', 'PARTIALLY_PAID']):
            b = calculate_loan_balance(l, target_reporting_currency=rep_curr)
            out += float(b['reporting_outstanding'])
        return round(out, 2)

    def get_active_loans_count(self, obj) -> int:
        return obj.loans.filter(status__in=['OPEN', 'PARTIALLY_PAID']).count()

    def get_currency_breakdown(self, obj) -> dict:
        breakdown = {}
        for l in obj.loans.all():
            if l.status == 'CANCELLED':
                continue
            curr = l.currency or 'INR'
            b = calculate_loan_balance(l)
            if curr not in breakdown:
                breakdown[curr] = {
                    'currency': curr,
                    'total_lent': 0.0,
                    'total_repaid': 0.0,
                    'outstanding': 0.0,
                    'count': 0
                }
            breakdown[curr]['total_lent'] = round(breakdown[curr]['total_lent'] + float(b['principal']), 2)
            breakdown[curr]['total_repaid'] = round(breakdown[curr]['total_repaid'] + float(b['total_repaid']), 2)
            breakdown[curr]['outstanding'] = round(breakdown[curr]['outstanding'] + float(b['outstanding']), 2)
            breakdown[curr]['count'] += 1
        return breakdown

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

