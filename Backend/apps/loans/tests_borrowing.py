import datetime
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.loans.models import Loan
from apps.people.models import Person
from apps.payments.models import Payment
from apps.workspaces.models import Workspace
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.loans.services.status_engine import evaluate_loan_status
from apps.reminders.services.reminder_engine import format_reminder_message


class BorrowingExtensionTestSuite(TestCase):
    """
    Comprehensive Test Suite for Borrowing Module Extension:
    BOR-001 through BOR-010.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='karthik_tester',
            email='karthik@test.io',
            password='TestPassword123!',
            first_name='Karthik',
            last_name='Ramaswamy'
        )
        self.other_user = User.objects.create_user(
            username='other_user',
            email='other@test.io',
            password='TestPassword123!'
        )

        self.workspace = Workspace.objects.create(name="Karthik Workspace", owner=self.user)
        self.person = Person.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            name="Sabari",
            mobile="+919876543210",
            email="sabari@test.io",
            relationship="friend"
        )

        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_bor_001_create_borrowing_record(self):
        """
        BOR-001: Create borrowing record via API.
        Expected: direction='borrowed', status='OPEN', outstanding=principal.
        """
        response = self.client.post('/api/loans/', {
            'person': self.person.id,
            'direction': 'BORROWING',
            'principal_amount': '20000.00',
            'currency': 'EUR',
            'date_given': str(timezone.localdate()),
            'due_date': str(timezone.localdate() + datetime.timedelta(days=60)),
            'purpose': 'Emergency bridge borrowing'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data
        self.assertEqual(data['direction'], 'borrowed')
        self.assertEqual(data['status'], 'OPEN')
        self.assertEqual(data['balance']['outstanding'], 20000.0)
        self.assertEqual(data['balance']['total_repaid'], 0.0)

    def test_bor_002_partial_repayment(self):
        """
        BOR-002: Partial repayment on borrowing reduces payable liability.
        """
        loan = Loan.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            person=self.person,
            direction='borrowed',
            loan_reference='LG-2026-TEST-0002',
            principal_amount=Decimal('20000.00'),
            currency='EUR',
            date_given=timezone.localdate(),
            due_date=timezone.localdate() + datetime.timedelta(days=30),
            purpose='Test Partial Payment'
        )

        # Make payment of 5000
        pay_res = self.client.post('/api/payments/', {
            'loan': loan.id,
            'amount': '5000.00',
            'payment_date': str(timezone.localdate()),
            'payment_method': 'BANK_TRANSFER',
            'notes': 'Partial payment to lender'
        }, format='json')

        self.assertEqual(pay_res.status_code, status.HTTP_201_CREATED)
        loan.refresh_from_db()
        balance = calculate_loan_balance(loan)
        self.assertEqual(balance['outstanding'], Decimal('15000.00'))
        self.assertEqual(balance['total_repaid'], Decimal('5000.00'))
        self.assertEqual(loan.status, 'PARTIALLY_PAID')

    def test_bor_003_full_repayment(self):
        """
        BOR-003: Full repayment sets status='PAID' and outstanding=0.
        """
        loan = Loan.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            person=self.person,
            direction='borrowed',
            loan_reference='LG-2026-TEST-0003',
            principal_amount=Decimal('20000.00'),
            currency='EUR',
            date_given=timezone.localdate(),
            due_date=timezone.localdate() + datetime.timedelta(days=30),
            purpose='Test Full Payment'
        )

        pay_res = self.client.post('/api/payments/', {
            'loan': loan.id,
            'amount': '20000.00',
            'payment_date': str(timezone.localdate()),
            'payment_method': 'BANK_TRANSFER'
        }, format='json')

        self.assertEqual(pay_res.status_code, status.HTTP_201_CREATED)
        loan.refresh_from_db()
        balance = calculate_loan_balance(loan)
        self.assertEqual(balance['outstanding'], Decimal('0.00'))
        self.assertEqual(loan.status, 'PAID')
        self.assertTrue(balance['is_fully_paid'])

    def test_bor_004_borrowing_overdue(self):
        """
        BOR-004: Overdue borrowing classifies time state as OVERDUE.
        """
        past_date = timezone.localdate() - datetime.timedelta(days=15)
        loan = Loan.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            person=self.person,
            direction='borrowed',
            loan_reference='LG-2026-TEST-0004',
            principal_amount=Decimal('10000.00'),
            currency='INR',
            date_given=past_date - datetime.timedelta(days=30),
            due_date=past_date,
            purpose='Test Overdue'
        )

        status_info = evaluate_loan_status(loan)
        self.assertEqual(status_info['time_status'], 'OVERDUE')
        self.assertEqual(status_info['days_overdue'], 15)

    def test_bor_005_borrowing_reminder_wording(self):
        """
        BOR-005: Borrowing reminder identifies the user as the payer.
        """
        loan = Loan.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            person=self.person,
            direction='borrowed',
            loan_reference='LG-2026-TEST-0005',
            principal_amount=Decimal('5000.00'),
            currency='EUR',
            date_given=timezone.localdate(),
            due_date=timezone.localdate() + datetime.timedelta(days=3),
            purpose='Test Reminder'
        )

        msg = format_reminder_message(loan, '3_days_before')
        self.assertIn("Your repayment of EUR 5000.00 to Sabari is due in 3 days.", msg)

    def test_bor_006_simultaneous_lending_and_borrowing_same_person(self):
        """
        BOR-006: Lending + Borrowing with same person computes gross & net exposure accurately.
        I lent Sabari €25,000 (repaid €10,000 -> outstanding €15,000).
        I borrowed from Sabari €5,000 (repaid €2,000 -> outstanding €3,000).
        Net exposure: €12,000 receivable.
        """
        # Lent loan
        loan_lent = Loan.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            person=self.person,
            direction='lent',
            loan_reference='LG-2026-TEST-LENT-01',
            principal_amount=Decimal('25000.00'),
            currency='INR',
            date_given=timezone.localdate(),
            purpose='Lent to Sabari'
        )
        Payment.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            loan=loan_lent,
            amount=Decimal('10000.00'),
            payment_date=timezone.localdate()
        )

        # Borrowed loan
        loan_borrowed = Loan.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            person=self.person,
            direction='borrowed',
            loan_reference='LG-2026-TEST-BORR-01',
            principal_amount=Decimal('5000.00'),
            currency='INR',
            date_given=timezone.localdate(),
            purpose='Borrowed from Sabari'
        )
        Payment.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            loan=loan_borrowed,
            amount=Decimal('2000.00'),
            payment_date=timezone.localdate()
        )

        # Check Person details API
        res = self.client.get(f'/api/people/{self.person.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data

        self.assertEqual(data['lent']['outstanding'], 15000.0)
        self.assertEqual(data['borrowed']['outstanding'], 3000.0)
        self.assertEqual(data['net_exposure'], 12000.0)
        self.assertIn('Receivable', data['net_exposure_label'])

    def test_bor_007_multi_currency_lending_and_borrowing_separation(self):
        """
        BOR-007: Multi-currency lending and borrowing separate aggregates without artificial blending.
        """
        # Lent €25,000 EUR
        Loan.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            person=self.person,
            direction='lent',
            loan_reference='LG-2026-TEST-EUR',
            principal_amount=Decimal('25000.00'),
            currency='EUR',
            date_given=timezone.localdate(),
            purpose='Lent EUR'
        )
        # Borrowed ₹100,000 INR
        Loan.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            person=self.person,
            direction='borrowed',
            loan_reference='LG-2026-TEST-INR',
            principal_amount=Decimal('100000.00'),
            currency='INR',
            date_given=timezone.localdate(),
            purpose='Borrowed INR'
        )

        res = self.client.get('/api/core/dashboard/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        cb = res.data['currency_breakdown']
        self.assertIn('EUR', cb)
        self.assertIn('INR', cb)
        self.assertEqual(cb['EUR']['total_lent'], 25000.0)
        self.assertEqual(cb['EUR']['total_borrowed'], 0.0)
        self.assertEqual(cb['INR']['total_lent'], 0.0)
        self.assertEqual(cb['INR']['total_borrowed'], 100000.0)

    def test_bor_008_existing_lending_records_after_migration(self):
        """
        BOR-008: Existing lending records retain direction='lent'.
        """
        loan = Loan.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            person=self.person,
            loan_reference='LG-2026-TEST-LEGACY',
            principal_amount=Decimal('50000.00'),
            currency='INR',
            date_given=timezone.localdate(),
            purpose='Legacy Loan'
        )
        self.assertEqual(loan.direction, 'lent')

    def test_bor_009_cross_workspace_borrowing_access(self):
        """
        BOR-009: Cross-workspace borrowing access denied.
        """
        other_person = Person.objects.create(
            created_by=self.other_user,
            name="Other Contact"
        )
        other_loan = Loan.objects.create(
            created_by=self.other_user,
            person=other_person,
            direction='borrowed',
            loan_reference='LG-2026-OTHER-01',
            principal_amount=Decimal('10000.00'),
            currency='INR',
            date_given=timezone.localdate(),
            purpose='Private borrowing'
        )

        res = self.client.get(f'/api/loans/{other_loan.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_bor_010_borrowing_payment_void(self):
        """
        BOR-010: Borrowing payment void restores payable liability and retains audit trail.
        """
        loan = Loan.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            person=self.person,
            direction='borrowed',
            loan_reference='LG-2026-TEST-VOID',
            principal_amount=Decimal('20000.00'),
            currency='EUR',
            date_given=timezone.localdate(),
            purpose='Test Void'
        )
        payment = Payment.objects.create(
            created_by=self.user,
            workspace=self.workspace,
            loan=loan,
            amount=Decimal('5000.00'),
            payment_date=timezone.localdate()
        )

        # Balance before void: 15000
        self.assertEqual(calculate_loan_balance(loan)['outstanding'], Decimal('15000.00'))

        # Void payment via API
        void_res = self.client.post(f'/api/payments/{payment.id}/void_payment/', {
            'void_reason': 'Accidental duplicate payment entry'
        }, format='json')

        self.assertEqual(void_res.status_code, status.HTTP_200_OK)
        loan.refresh_from_db()
        balance = calculate_loan_balance(loan)
        self.assertEqual(balance['outstanding'], Decimal('20000.00'))
        self.assertEqual(balance['total_repaid'], Decimal('0.00'))
        self.assertTrue(payment.is_voided)
