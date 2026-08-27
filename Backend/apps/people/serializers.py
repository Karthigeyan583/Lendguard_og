from rest_framework import serializers
from .models import Person
from apps.loans.services.balance_engine import calculate_loan_balance


class PersonSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    reporting_currency = serializers.SerializerMethodField()
    total_lent = serializers.SerializerMethodField()
    total_repaid = serializers.SerializerMethodField()
    outstanding_balance = serializers.SerializerMethodField()
    active_loans_count = serializers.SerializerMethodField()
    
    # Directional Breakdown & Net Exposure (Borrowing Extension)
    lent = serializers.SerializerMethodField()
    borrowed = serializers.SerializerMethodField()
    net_exposure = serializers.SerializerMethodField()
    net_exposure_label = serializers.SerializerMethodField()
    currency_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Person
        fields = [
            'id',
            'workspace',
            'created_by',
            'name',
            'first_name',
            'last_name',
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
            'lent',
            'borrowed',
            'net_exposure',
            'net_exposure_label',
            'currency_breakdown',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate(self, attrs):
        first_name = attrs.pop('first_name', None)
        last_name = attrs.pop('last_name', None)
        if first_name is not None or last_name is not None:
            full = f"{first_name or ''} {last_name or ''}".strip()
            if full:
                attrs['name'] = full
        if not attrs.get('name'):
            raise serializers.ValidationError({"first_name": "Contact first name is required."})
        return attrs

    def _get_reporting_currency(self, obj) -> str:
        request = self.context.get('request')
        user = request.user if (request and hasattr(request, 'user')) else obj.created_by
        if user and hasattr(user, 'profile') and user.profile.base_currency:
            return user.profile.base_currency
        return 'INR'

    def get_reporting_currency(self, obj) -> str:
        return self._get_reporting_currency(obj)

    def get_lent(self, obj) -> dict:
        rep_curr = self._get_reporting_currency(obj)
        total_lent = 0.0
        total_repaid = 0.0
        outstanding = 0.0
        active_count = 0

        for l in obj.loans.filter(direction='lent'):
            if l.status == 'CANCELLED':
                continue
            b = calculate_loan_balance(l, target_reporting_currency=rep_curr)
            total_lent += float(b['reporting_principal'])
            total_repaid += float(b['reporting_total_repaid'])
            if l.status in ['OPEN', 'PARTIALLY_PAID']:
                outstanding += float(b['reporting_outstanding'])
                active_count += 1

        return {
            'total_lent': round(total_lent, 2),
            'total_repaid': round(total_repaid, 2),
            'outstanding': round(outstanding, 2),
            'active_loans_count': active_count
        }

    def get_borrowed(self, obj) -> dict:
        rep_curr = self._get_reporting_currency(obj)
        total_borrowed = 0.0
        total_repaid = 0.0
        outstanding = 0.0
        active_count = 0

        for l in obj.loans.filter(direction='borrowed'):
            if l.status == 'CANCELLED':
                continue
            b = calculate_loan_balance(l, target_reporting_currency=rep_curr)
            total_borrowed += float(b['reporting_principal'])
            total_repaid += float(b['reporting_total_repaid'])
            if l.status in ['OPEN', 'PARTIALLY_PAID']:
                outstanding += float(b['reporting_outstanding'])
                active_count += 1

        return {
            'total_borrowed': round(total_borrowed, 2),
            'total_repaid': round(total_repaid, 2),
            'outstanding': round(outstanding, 2),
            'active_loans_count': active_count
        }

    def get_net_exposure(self, obj) -> float:
        lent_data = self.get_lent(obj)
        borrowed_data = self.get_borrowed(obj)
        net = lent_data['outstanding'] - borrowed_data['outstanding']
        return round(net, 2)

    def get_net_exposure_label(self, obj) -> str:
        net = self.get_net_exposure(obj)
        if net > 0:
            return 'Receivable (Owes You)'
        elif net < 0:
            return 'Payable (You Owe)'
        return 'Settled (Zero Net)'

    def get_total_lent(self, obj) -> float:
        return self.get_lent(obj)['total_lent']

    def get_total_repaid(self, obj) -> float:
        return self.get_lent(obj)['total_repaid']

    def get_outstanding_balance(self, obj) -> float:
        return self.get_lent(obj)['outstanding']

    def get_active_loans_count(self, obj) -> int:
        return self.get_lent(obj)['active_loans_count']

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
                    'total_borrowed': 0.0,
                    'lent_outstanding': 0.0,
                    'borrowed_outstanding': 0.0,
                    'net_outstanding': 0.0,
                    'outstanding': 0.0,
                    'total_repaid': 0.0,
                    'count': 0
                }
            
            is_borrowing = (l.direction == 'borrowed')
            if is_borrowing:
                breakdown[curr]['total_borrowed'] = round(breakdown[curr]['total_borrowed'] + float(b['principal']), 2)
                breakdown[curr]['borrowed_outstanding'] = round(breakdown[curr]['borrowed_outstanding'] + float(b['outstanding']), 2)
            else:
                breakdown[curr]['total_lent'] = round(breakdown[curr]['total_lent'] + float(b['principal']), 2)
                breakdown[curr]['lent_outstanding'] = round(breakdown[curr]['lent_outstanding'] + float(b['outstanding']), 2)
            
            breakdown[curr]['net_outstanding'] = round(breakdown[curr]['lent_outstanding'] - breakdown[curr]['borrowed_outstanding'], 2)
            breakdown[curr]['outstanding'] = breakdown[curr]['lent_outstanding']
            breakdown[curr]['total_repaid'] = round(breakdown[curr]['total_repaid'] + float(b['total_repaid']), 2)
            breakdown[curr]['count'] += 1
        return breakdown

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)

