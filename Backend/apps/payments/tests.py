import datetime
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.people.models import Person
from apps.loans.models import Loan
from apps.payments.models import Payment


class PaymentApiAndOverpaymentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='paymentuser', password='Password123!')
        self.person = Person.objects.create(created_by=self.user, name='Jane Borrower')
        self.loan = Loan.objects.create(
            created_by=self.user,
            person=self.person,
            loan_reference='LG-PAY-0001',
            principal_amount=Decimal('10000.00'),
            currency='USD',
            date_given=datetime.date.today(),
            due_date=datetime.date.today() + datetime.timedelta(days=30)
        )
        self.client.force_authenticate(user=self.user)

    def test_overpayment_rejected(self):
        payload = {
            'loan': self.loan.id,
            'amount': '15000.00', # Greater than 10000.00
            'payment_date': str(datetime.date.today()),
            'payment_method': 'cash'
        }
        res = self.client.post('/api/v1/payments/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Overpayment Alert', str(res.data))

    def test_valid_payment_and_void(self):
        payload = {
            'loan': self.loan.id,
            'amount': '4000.00',
            'payment_date': str(datetime.date.today()),
            'payment_method': 'cash'
        }
        create_res = self.client.post('/api/v1/payments/', payload, format='json')
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        payment_id = create_res.data['id']

        # Verify loan updated to PARTIALLY_PAID
        self.loan.refresh_from_db()
        self.assertEqual(self.loan.status, 'PARTIALLY_PAID')

        # Void payment
        void_payload = {'void_reason': 'Entered wrong amount accidentally'}
        void_res = self.client.post(f'/api/v1/payments/{payment_id}/void/', void_payload, format='json')
        self.assertEqual(void_res.status_code, status.HTTP_200_OK)
        self.assertTrue(void_res.data['is_voided'])

        # Verify loan restored to OPEN
        self.loan.refresh_from_db()
        self.assertEqual(self.loan.status, 'OPEN')
