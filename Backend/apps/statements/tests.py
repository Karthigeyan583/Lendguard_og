import datetime
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from apps.people.models import Person
from apps.loans.models import Loan
from apps.statements.services.statement_engine import generate_digital_statement


class DigitalStatementTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='statementuser', password='Password123!')
        self.person = Person.objects.create(created_by=self.user, name='Statement Borrower', mobile='+91-9999988888')
        self.loan = Loan.objects.create(
            created_by=self.user,
            person=self.person,
            loan_reference='LG-STMT-0001',
            principal_amount=Decimal('75000.00'),
            currency='INR',
            date_given=datetime.date.today() - datetime.timedelta(days=15),
            due_date=datetime.date.today() + datetime.timedelta(days=15),
            purpose='Bridge loan'
        )

    def test_generate_statement_and_sha256_hash(self):
        stmt = generate_digital_statement(self.loan, user=self.user)
        self.assertIsNotNone(stmt.statement_number)
        self.assertIsNotNone(stmt.sha256_hash)
        self.assertEqual(len(stmt.sha256_hash), 64) # Valid SHA-256 length
        self.assertIn('financial_summary', stmt.canonical_data_snapshot)
        self.assertEqual(stmt.canonical_data_snapshot['financial_summary']['principal'], '75000.00')
