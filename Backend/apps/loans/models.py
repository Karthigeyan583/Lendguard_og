from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from apps.workspaces.models import Workspace
from apps.people.models import Person


class Loan(models.Model):
    DIRECTION_CHOICES = [
        ('lent', 'Money Lent (Given)'),
        ('borrowed', 'Money Borrowed (Received)'),
    ]

    INTEREST_MODEL_CHOICES = [
        ('none', 'No Interest (Principal Only)'),
        ('simple_annual', 'Simple Annual Rate (%)'),
        ('monthly_rate', 'Monthly Rate (%)'),
        ('fixed_fee', 'Fixed Fee Amount'),
    ]

    FINANCIAL_STATUS_CHOICES = [
        ('OPEN', 'Open (No Repayments)'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('PAID', 'Fully Paid / Settled'),
        ('WRITTEN_OFF', 'Written Off (Defaulted)'),
        ('CANCELLED', 'Cancelled / Voided'),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='loans', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='loans')
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='loans')
    
    loan_reference = models.CharField(max_length=50, unique=True, help_text="Unique reference code (e.g. LG-2026-0001)")
    direction = models.CharField(max_length=20, choices=DIRECTION_CHOICES, default='lent')
    principal_amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.CharField(max_length=10, default='INR', help_text="Original transaction currency")
    
    # Multi-Currency & Reporting Currency Engine (Bible v2.0)
    reporting_currency = models.CharField(max_length=10, default='INR', help_text="Base/Reporting currency at origination")
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=6, default=Decimal('1.000000'), help_text="FX rate: 1 original_currency = X reporting_currency")
    fx_rate_date = models.DateTimeField(null=True, blank=True, help_text="Timestamp when exchange rate was applied")
    reporting_principal_amount = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'), help_text="Principal amount converted to reporting_currency")
    
    date_given = models.DateField(help_text="Date money was handed over/transferred")
    due_date = models.DateField(null=True, blank=True, help_text="Agreed repayment target date")
    
    interest_model = models.CharField(max_length=30, choices=INTEREST_MODEL_CHOICES, default='none')
    interest_rate = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'), help_text="Annual or Monthly percentage rate if applicable")
    fixed_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="Fixed one-time borrowing fee if applicable")
    
    purpose = models.CharField(max_length=255, blank=True, help_text="Short description of what the money was lent for")
    notes = models.TextField(blank=True, help_text="Private audit notes")
    
    status = models.CharField(max_length=30, choices=FINANCIAL_STATUS_CHOICES, default='OPEN')
    is_archived = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date_given', '-created_at']

    def __str__(self):
        return f"{self.loan_reference} - {self.person.name}: {self.principal_amount} {self.currency} [{self.status}]"
