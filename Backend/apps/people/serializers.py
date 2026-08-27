import re
from rest_framework import serializers
from .models import Person, BankAccount
from apps.loans.services.balance_engine import calculate_loan_balance


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = [
            'id',
            'person',
            'country',
            'bank_name',
            'account_holder_name',
            'account_number',
            'account_type',
            'is_primary',
            'ifsc_code',
            'upi_id',
            'sort_code',
            'routing_number',
            'iban',
            'swift_bic',
            'transit_number',
            'institution_number',
            'bsb_number',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'person', 'created_at', 'updated_at']

    def validate(self, data):
        country = data.get('country', 'IN')
        bank_name = (data.get('bank_name') or '').strip()
        holder_name = (data.get('account_holder_name') or '').strip()
        acc_num = (data.get('account_number') or '').strip()

        if not bank_name:
            raise serializers.ValidationError({"bank_name": "Bank name is required."})
        if not holder_name:
            raise serializers.ValidationError({"account_holder_name": "Account holder name is required."})
        if not acc_num:
            raise serializers.ValidationError({"account_number": "Account number is required."})

        # Country Mandate Validations
        if country == 'IN':
            ifsc = (data.get('ifsc_code') or '').strip().upper()
            if not ifsc:
                raise serializers.ValidationError({"ifsc_code": "11-character IFSC code is mandatory for Indian bank accounts (e.g. HDFC0001234)."})
            if not re.match(r'^[A-Z]{4}0[A-Z0-9]{6}$', ifsc):
                raise serializers.ValidationError({"ifsc_code": "Invalid IFSC code format. Must be 11 characters (e.g. HDFC0001234, 5th character must be '0')."})
            data['ifsc_code'] = ifsc

            clean_acc = re.sub(r'[\s\-]', '', acc_num)
            if not re.match(r'^\d{9,18}$', clean_acc):
                raise serializers.ValidationError({"account_number": "Indian bank account number must be between 9 and 18 digits."})
            data['account_number'] = clean_acc

        elif country == 'GB':
            sort_code = re.sub(r'[\s\-]', '', (data.get('sort_code') or '').strip())
            if not sort_code or not re.match(r'^\d{6}$', sort_code):
                raise serializers.ValidationError({"sort_code": "UK Sort Code must be exactly 6 digits (e.g. 20-45-77)."})
            data['sort_code'] = f"{sort_code[:2]}-{sort_code[2:4]}-{sort_code[4:]}"
            
            clean_acc = re.sub(r'[\s\-]', '', acc_num)
            if not re.match(r'^\d{6,8}$', clean_acc):
                raise serializers.ValidationError({"account_number": "UK bank account number must be between 6 and 8 digits."})
            data['account_number'] = clean_acc

        elif country == 'US':
            routing = re.sub(r'[\s\-]', '', (data.get('routing_number') or '').strip())
            if not routing or not re.match(r'^\d{9}$', routing):
                raise serializers.ValidationError({"routing_number": "US ABA Routing Transit number must be exactly 9 digits."})
            data['routing_number'] = routing

            clean_acc = re.sub(r'[\s\-]', '', acc_num)
            if not re.match(r'^\d{4,17}$', clean_acc):
                raise serializers.ValidationError({"account_number": "US bank account number must be between 4 and 17 digits."})
            data['account_number'] = clean_acc

        elif country in ['EU', 'AE']:
            iban = re.sub(r'[\s\-]', '', (data.get('iban') or acc_num).strip().upper())
            if not iban:
                raise serializers.ValidationError({"iban": f"IBAN is mandatory for {country} bank accounts."})
            if country == 'AE' and not (iban.startswith('AE') and len(iban) == 23):
                raise serializers.ValidationError({"iban": "UAE IBAN must start with 'AE' and be exactly 23 characters long."})
            if len(iban) < 15 or len(iban) > 34:
                raise serializers.ValidationError({"iban": "Invalid IBAN length (must be between 15 and 34 characters)."})
            data['iban'] = iban
            if not data.get('account_number'):
                data['account_number'] = iban

        elif country == 'CA':
            transit = re.sub(r'[\s\-]', '', (data.get('transit_number') or '').strip())
            inst = re.sub(r'[\s\-]', '', (data.get('institution_number') or '').strip())
            if not transit or not re.match(r'^\d{5}$', transit):
                raise serializers.ValidationError({"transit_number": "Canada Transit number must be exactly 5 digits."})
            if not inst or not re.match(r'^\d{3}$', inst):
                raise serializers.ValidationError({"institution_number": "Canada Institution number must be exactly 3 digits."})
            data['transit_number'] = transit
            data['institution_number'] = inst

        elif country == 'AU':
            bsb = re.sub(r'[\s\-]', '', (data.get('bsb_number') or '').strip())
            if not bsb or not re.match(r'^\d{6}$', bsb):
                raise serializers.ValidationError({"bsb_number": "Australian BSB number must be exactly 6 digits (e.g. 062-000)."})
            data['bsb_number'] = f"{bsb[:3]}-{bsb[3:]}"

        return data


class PersonSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    last_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    bank_accounts = BankAccountSerializer(many=True, required=False)
    
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
            'bank_accounts',
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

        # Mandatory Bank Accounts Validation (Max 3, Min 1)
        bank_accounts_data = self.initial_data.get('bank_accounts', None)
        if self.instance is None:  # Creating new contact
            if not bank_accounts_data or len(bank_accounts_data) == 0:
                raise serializers.ValidationError({
                    "bank_accounts": "At least 1 bank account is mandatory for each contact as per banking mandates."
                })
            if len(bank_accounts_data) > 3:
                raise serializers.ValidationError({
                    "bank_accounts": "A maximum of 3 bank accounts is allowed per contact."
                })
        else:  # Updating contact
            if bank_accounts_data is not None:
                if len(bank_accounts_data) == 0:
                    raise serializers.ValidationError({
                        "bank_accounts": "At least 1 bank account is mandatory for each contact."
                    })
                if len(bank_accounts_data) > 3:
                    raise serializers.ValidationError({
                        "bank_accounts": "A maximum of 3 bank accounts is allowed per contact."
                    })

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if (request and hasattr(request, 'user')) else None
        if user:
            validated_data['created_by'] = user

        bank_accounts_data = self.initial_data.get('bank_accounts', [])
        # Pop bank_accounts from validated_data if present
        validated_data.pop('bank_accounts', None)
        person = super().create(validated_data)

        if bank_accounts_data:
            has_primary = any(bool(acc.get('is_primary')) for acc in bank_accounts_data)
            for idx, acc_data in enumerate(bank_accounts_data[:3]):
                serializer = BankAccountSerializer(data=acc_data)
                serializer.is_valid(raise_exception=True)
                is_prim = bool(acc_data.get('is_primary')) or (not has_primary and idx == 0)
                serializer.save(person=person, is_primary=is_prim)

        return person

    def update(self, instance, validated_data):
        validated_data.pop('bank_accounts', None)
        person = super().update(instance, validated_data)
        bank_accounts_data = self.initial_data.get('bank_accounts', None)
        if bank_accounts_data is not None:
            instance.bank_accounts.all().delete()
            has_primary = any(bool(acc.get('is_primary')) for acc in bank_accounts_data)
            for idx, acc_data in enumerate(bank_accounts_data[:3]):
                serializer = BankAccountSerializer(data=acc_data)
                serializer.is_valid(raise_exception=True)
                is_prim = bool(acc_data.get('is_primary')) or (not has_primary and idx == 0)
                serializer.save(person=instance, is_primary=is_prim)
        return person

    def _get_reporting_currency(self, obj) -> str:
        request = self.context.get('request')
        if request and hasattr(request, 'query_params'):
            param = request.query_params.get('reporting_currency')
            if param:
                return param.upper().strip()
        # If all contact loans are in a single currency, preserve that native currency
        if hasattr(obj, 'loans'):
            active_currs = list(obj.loans.exclude(status='CANCELLED').values_list('currency', flat=True).distinct())
            if len(active_currs) == 1 and active_currs[0]:
                return active_currs[0]
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

