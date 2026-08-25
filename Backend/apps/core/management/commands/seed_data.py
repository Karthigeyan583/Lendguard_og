import datetime
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from apps.authentication.models import UserProfile
from apps.workspaces.models import Workspace, WorkspaceMember
from apps.people.models import Person
from apps.loans.models import Loan
from apps.payments.models import Payment
from apps.loans.services.status_engine import evaluate_loan_status
from apps.reminders.services.reminder_engine import generate_loan_reminders
from apps.statements.services.statement_engine import generate_digital_statement


class Command(BaseCommand):
    help = 'Seeds LendGuard Bible v2.0 contacts, lending ledger, repayments, and digital statements.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding LendGuard Product Bible v2.0 data..."))

        # 1. Primary Lender User
        user, created = User.objects.get_or_create(
            username='karthik',
            defaults={
                'email': 'karthik@lendguard.io',
                'first_name': 'Karthik',
                'last_name': 'Ramaswamy',
                'is_staff': True,
                'is_superuser': True
            }
        )
        user.set_password('Password123!')
        user.save()
        if hasattr(user, 'profile'):
            user.profile.role = 'admin'
            user.profile.phone_number = '+91-9884409190'
            user.profile.is_kyc_verified = True
            user.profile.save()
        Token.objects.get_or_create(user=user)
        self.stdout.write(self.style.SUCCESS("✓ User 'karthik' ready (Password123!)"))

        # 2. Workspace
        workspace, _ = Workspace.objects.get_or_create(
            owner=user,
            defaults={'name': "Karthik's Lending Ledger", 'default_currency': 'INR', 'is_personal': True}
        )
        WorkspaceMember.objects.get_or_create(workspace=workspace, user=user, defaults={'role': 'owner'})

        # 3. People (Borrowers/Contacts)
        p1, _ = Person.objects.get_or_create(
            created_by=user,
            name='Rahul Sharma',
            defaults={'mobile': '+91-9884401122', 'email': 'rahul.sharma@example.com', 'relationship': 'colleague', 'tags': 'work, emergency', 'notes': 'Colleague at engineering dept.'}
        )
        p2, _ = Person.objects.get_or_create(
            created_by=user,
            name='Priya Patel',
            defaults={'mobile': '+91-9884403344', 'email': 'priya.patel@example.com', 'relationship': 'friend', 'tags': 'close_friend', 'notes': 'College batchmate.'}
        )
        p3, _ = Person.objects.get_or_create(
            created_by=user,
            name='Vikram Mehta',
            defaults={'mobile': '+91-9884405566', 'email': 'vikram.mehta@example.com', 'relationship': 'business', 'tags': 'vendor, equipment', 'notes': 'Commercial equipment purchase.'}
        )
        p4, _ = Person.objects.get_or_create(
            created_by=user,
            name='Anita Desai',
            defaults={'mobile': '+91-9884407788', 'email': 'anita.desai@example.com', 'relationship': 'family', 'tags': 'family, cousin', 'notes': 'Family medical loan.'}
        )
        self.stdout.write(self.style.SUCCESS("✓ Seeded 4 People contacts (Rahul, Priya, Vikram, Anita)"))

        today = datetime.date.today()

        # 4. Loans & Repayments
        # Loan 1: Rahul Sharma - ₹50,000 (Partially Paid: ₹20,000 repaid, ₹30,000 outstanding)
        l1, l1_created = Loan.objects.get_or_create(
            loan_reference='LG-2026-0001',
            defaults={
                'created_by': user,
                'workspace': workspace,
                'person': p1,
                'direction': 'lent',
                'principal_amount': Decimal('50000.00'),
                'currency': 'INR',
                'date_given': today - datetime.timedelta(days=25),
                'due_date': today + datetime.timedelta(days=10),
                'interest_model': 'none',
                'purpose': 'Emergency home repair expenses',
                'status': 'OPEN'
            }
        )
        if l1_created or l1.payments.count() == 0:
            Payment.objects.create(
                created_by=user,
                workspace=workspace,
                loan=l1,
                amount=Decimal('20000.00'),
                payment_date=today - datetime.timedelta(days=5),
                payment_method='upi_bank_transfer',
                reference_number='UPI/2026/894721',
                notes='First partial installment received via GPay'
            )
            evaluate_loan_status(l1)
            generate_loan_reminders(l1)

        # Loan 2: Priya Patel - ₹15,000 (Overdue: Due 5 days ago, ₹0 repaid)
        l2, l2_created = Loan.objects.get_or_create(
            loan_reference='LG-2026-0002',
            defaults={
                'created_by': user,
                'workspace': workspace,
                'person': p2,
                'direction': 'lent',
                'principal_amount': Decimal('15000.00'),
                'currency': 'INR',
                'date_given': today - datetime.timedelta(days=20),
                'due_date': today - datetime.timedelta(days=5),
                'interest_model': 'none',
                'purpose': 'Exam certification fees',
                'status': 'OPEN'
            }
        )
        if l2_created:
            evaluate_loan_status(l2)
            generate_loan_reminders(l2)

        # Loan 3: Vikram Mehta - ₹120,000 (Fully Settled / PAID: ₹120,000 repaid)
        l3, l3_created = Loan.objects.get_or_create(
            loan_reference='LG-2026-0003',
            defaults={
                'created_by': user,
                'workspace': workspace,
                'person': p3,
                'direction': 'lent',
                'principal_amount': Decimal('120000.00'),
                'currency': 'INR',
                'date_given': today - datetime.timedelta(days=50),
                'due_date': today - datetime.timedelta(days=10),
                'interest_model': 'none',
                'purpose': 'Advance raw materials procurement',
                'status': 'OPEN'
            }
        )
        if l3_created or l3.payments.count() == 0:
            Payment.objects.create(
                created_by=user,
                workspace=workspace,
                loan=l3,
                amount=Decimal('120000.00'),
                payment_date=today - datetime.timedelta(days=12),
                payment_method='upi_bank_transfer',
                reference_number='NEFT/HDFC/0091823',
                notes='Full loan settlement transfer'
            )
            evaluate_loan_status(l3)
            generate_digital_statement(l3, user=user)

        # Loan 4: Anita Desai - ₹25,000 (Upcoming: Due in 20 days)
        l4, l4_created = Loan.objects.get_or_create(
            loan_reference='LG-2026-0004',
            defaults={
                'created_by': user,
                'workspace': workspace,
                'person': p4,
                'direction': 'lent',
                'principal_amount': Decimal('25000.00'),
                'currency': 'INR',
                'date_given': today - datetime.timedelta(days=5),
                'due_date': today + datetime.timedelta(days=20),
                'interest_model': 'none',
                'purpose': 'Medical treatment bridge loan',
                'status': 'OPEN'
            }
        )
        if l4_created:
            evaluate_loan_status(l4)
            generate_loan_reminders(l4)

        self.stdout.write(self.style.SUCCESS("✓ Seeded 4 loans with partial, overdue, and settled payment histories!"))
        self.stdout.write(self.style.SUCCESS("✓ Generated Digital Statement with SHA-256 hash for settled loan LG-2026-0003"))
        self.stdout.write(self.style.SUCCESS("\nLendGuard Database successfully seeded with Product Bible v2.0 baseline!"))
