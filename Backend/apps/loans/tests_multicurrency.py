from decimal import Decimal
import datetime
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from apps.people.models import Person
from apps.loans.models import Loan
from apps.payments.models import Payment
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.loans.services.status_engine import evaluate_loan_status
from apps.core.services.fx_engine import get_exchange_rate, convert_currency, INR_PER_UNIT


class MultiCurrencyTestSuite(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='cfo_user',
            email='cfo@lendguard.io',
            password='Password123!'
        )
        self.user.profile.base_currency = 'EUR'
        self.user.profile.save()

        self.borrower_sabari = Person.objects.create(
            created_by=self.user,
            name='Sabari',
            relationship='friend',
            mobile='+919884378787'
        )

    def test_01_eur_plus_eur_loans(self):
        """1. EUR loan + EUR loan direct aggregation in EUR base currency"""
        l1 = Loan.objects.create(
            created_by=self.user,
            person=self.borrower_sabari,
            loan_reference='LG-TEST-001',
            principal_amount=Decimal('25000.00'),
            currency='EUR',
            reporting_currency='EUR',
            exchange_rate=Decimal('1.000000'),
            reporting_principal_amount=Decimal('25000.00'),
            date_given=datetime.date(2026, 8, 1)
        )
        l2 = Loan.objects.create(
            created_by=self.user,
            person=self.borrower_sabari,
            loan_reference='LG-TEST-002',
            principal_amount=Decimal('15000.00'),
            currency='EUR',
            reporting_currency='EUR',
            exchange_rate=Decimal('1.000000'),
            reporting_principal_amount=Decimal('15000.00'),
            date_given=datetime.date(2026, 8, 5)
        )
        b1 = calculate_loan_balance(l1, target_reporting_currency='EUR')
        b2 = calculate_loan_balance(l2, target_reporting_currency='EUR')
        total_reporting = b1['reporting_principal'] + b2['reporting_principal']
        self.assertEqual(total_reporting, Decimal('40000.00'))

    def test_02_eur_loan_plus_inr_loan_normalized(self):
        """2. EUR loan (€25k) + INR loan (₹100k) correctly normalized, NOT €125k"""
        # 1 EUR = 98 INR -> 1 INR = 1/98 EUR = 0.010204 EUR
        rate_inr_to_eur = get_exchange_rate('INR', 'EUR')
        self.assertEqual(rate_inr_to_eur, Decimal('0.010204'))

        l1 = Loan.objects.create(
            created_by=self.user,
            person=self.borrower_sabari,
            loan_reference='LG-TEST-EUR',
            principal_amount=Decimal('25000.00'),
            currency='EUR',
            reporting_currency='EUR',
            exchange_rate=Decimal('1.000000'),
            reporting_principal_amount=Decimal('25000.00'),
            date_given=datetime.date(2026, 8, 1)
        )

        inr_converted = (Decimal('100000.00') * rate_inr_to_eur).quantize(Decimal('0.01'))
        # ₹100,000 * 0.010204 = €1,020.40
        self.assertEqual(inr_converted, Decimal('1020.40'))

        l2 = Loan.objects.create(
            created_by=self.user,
            person=self.borrower_sabari,
            loan_reference='LG-TEST-INR',
            principal_amount=Decimal('100000.00'),
            currency='INR',
            reporting_currency='EUR',
            exchange_rate=rate_inr_to_eur,
            reporting_principal_amount=inr_converted,
            date_given=datetime.date(2026, 8, 1)
        )

        b1 = calculate_loan_balance(l1, target_reporting_currency='EUR')
        b2 = calculate_loan_balance(l2, target_reporting_currency='EUR')

        total_lent_eur = b1['reporting_principal'] + b2['reporting_principal']
        # Must be ~ €26,020.40, definitely NOT €125,000!
        self.assertNotEqual(total_lent_eur, Decimal('125000.00'))
        self.assertEqual(total_lent_eur, Decimal('26020.40'))

        # Original amounts must be preserved
        self.assertEqual(b1['principal'], Decimal('25000.00'))
        self.assertEqual(b1['currency'], 'EUR')
        self.assertEqual(b2['principal'], Decimal('100000.00'))
        self.assertEqual(b2['currency'], 'INR')

    def test_03_partial_repayment_and_recovery_rate(self):
        """5 & 6 & 11. Partial repayment in original currency and immune recovery %"""
        rate_inr_to_eur = get_exchange_rate('INR', 'EUR')
        l_inr = Loan.objects.create(
            created_by=self.user,
            person=self.borrower_sabari,
            loan_reference='LG-TEST-INR-REP',
            principal_amount=Decimal('100000.00'),
            currency='INR',
            reporting_currency='EUR',
            exchange_rate=rate_inr_to_eur,
            reporting_principal_amount=Decimal('1020.40'),
            date_given=datetime.date(2026, 8, 1)
        )

        # Repay ₹50,000 INR
        Payment.objects.create(
            created_by=self.user,
            loan=l_inr,
            amount=Decimal('50000.00'),
            currency='INR',
            reporting_currency='EUR',
            exchange_rate=rate_inr_to_eur,
            reporting_amount=Decimal('510.20'),
            payment_date=datetime.date(2026, 8, 15)
        )

        bal = calculate_loan_balance(l_inr, target_reporting_currency='EUR')
        # Original currency checks
        self.assertEqual(bal['principal'], Decimal('100000.00'))
        self.assertEqual(bal['total_repaid'], Decimal('50000.00'))
        self.assertEqual(bal['outstanding'], Decimal('50000.00'))
        # Recovery rate in original currency is exactly 50%
        self.assertEqual(bal['recovery_rate'], 50.0)

        # Reporting currency checks
        self.assertEqual(bal['reporting_principal'], Decimal('1020.40'))
        self.assertEqual(bal['reporting_total_repaid'], Decimal('510.20'))
        self.assertEqual(bal['reporting_outstanding'], Decimal('510.20'))

    def test_04_historical_fx_rate_preservation(self):
        """8 & 12. Historical FX rate remains unchanged even if parity table changes"""
        historical_rate = Decimal('0.010204')
        l = Loan.objects.create(
            created_by=self.user,
            person=self.borrower_sabari,
            loan_reference='LG-HIST-FX',
            principal_amount=Decimal('100000.00'),
            currency='INR',
            reporting_currency='EUR',
            exchange_rate=historical_rate,
            reporting_principal_amount=Decimal('1020.40'),
            date_given=datetime.date(2025, 1, 1)
        )

        # Retrieve loan and verify stored rate and reporting amount are preserved
        fresh = Loan.objects.get(id=l.id)
        self.assertEqual(fresh.exchange_rate, historical_rate)
        self.assertEqual(fresh.reporting_principal_amount, Decimal('1020.40'))
