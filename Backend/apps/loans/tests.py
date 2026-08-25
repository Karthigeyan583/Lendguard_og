import datetime
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from apps.people.models import Person
from apps.loans.models import Loan
from apps.payments.models import Payment
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.loans.services.status_engine import evaluate_loan_status


class BalanceAndStatusEngineTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testlender', password='Password123!')
        self.person = Person.objects.create(created_by=self.user, name='Test Borrower', mobile='+91-9000000000')
        self.today = datetime.date.today()

    def test_balance_engine_with_repayments(self):
        loan = Loan.objects.create(
            created_by=self.user,
            person=self.person,
            loan_reference='LG-TEST-0001',
            principal_amount=Decimal('50000.00'),
            currency='INR',
            date_given=self.today - datetime.timedelta(days=10),
            due_date=self.today + datetime.timedelta(days=10)
        )

        # Initial balance
        b1 = calculate_loan_balance(loan)
        self.assertEqual(b1['principal'], Decimal('50000.00'))
        self.assertEqual(b1['total_repaid'], Decimal('0.00'))
        self.assertEqual(b1['outstanding'], Decimal('50000.00'))

        # Add partial payment
        Payment.objects.create(
            created_by=self.user,
            loan=loan,
            amount=Decimal('20000.00'),
            payment_date=self.today - datetime.timedelta(days=2)
        )

        b2 = calculate_loan_balance(loan)
        self.assertEqual(b2['total_repaid'], Decimal('20000.00'))
        self.assertEqual(b2['outstanding'], Decimal('30000.00'))
        self.assertFalse(b2['is_fully_paid'])

        # Status engine check
        s1 = evaluate_loan_status(loan)
        self.assertEqual(s1['financial_status'], 'PARTIALLY_PAID')

        # Add final settlement payment
        Payment.objects.create(
            created_by=self.user,
            loan=loan,
            amount=Decimal('30000.00'),
            payment_date=self.today
        )

        b3 = calculate_loan_balance(loan)
        self.assertEqual(b3['total_repaid'], Decimal('50000.00'))
        self.assertEqual(b3['outstanding'], Decimal('0.00'))
        self.assertTrue(b3['is_fully_paid'])

        # Status engine check
        s2 = evaluate_loan_status(loan)
        self.assertEqual(s2['financial_status'], 'PAID')

    def test_overdue_status_calculation(self):
        loan = Loan.objects.create(
            created_by=self.user,
            person=self.person,
            loan_reference='LG-TEST-0002',
            principal_amount=Decimal('10000.00'),
            currency='INR',
            date_given=self.today - datetime.timedelta(days=30),
            due_date=self.today - datetime.timedelta(days=5) # 5 days overdue
        )

        status_info = evaluate_loan_status(loan)
        self.assertEqual(status_info['time_status'], 'OVERDUE')
        self.assertEqual(status_info['days_overdue'], 5)
