from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from apps.workspaces.models import Workspace
from apps.loans.models import Loan


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash in Hand'),
        ('upi_bank_transfer', 'UPI / Direct Bank Transfer / NEFT / IMPS'),
        ('card', 'Debit / Credit Card'),
        ('check', 'Cheque'),
        ('other', 'Other Transfer Method'),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))], help_text="Repayment amount in original loan currency")
    currency = models.CharField(max_length=10, default='INR', help_text="Original transaction currency")
    
    # Multi-Currency & Reporting Currency Engine (Bible v2.0)
    reporting_currency = models.CharField(max_length=10, default='INR', help_text="Base/Reporting currency")
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=6, default=Decimal('1.000000'), help_text="FX rate: 1 original_currency = X reporting_currency")
    fx_rate_date = models.DateTimeField(null=True, blank=True, help_text="Timestamp when exchange rate was applied")
    reporting_amount = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'), help_text="Repayment amount converted to reporting_currency")
    
    payment_date = models.DateField(help_text="Date repayment was received")
    payment_method = models.CharField(max_length=30, choices=PAYMENT_METHOD_CHOICES, default='cash')
    reference_number = models.CharField(max_length=100, blank=True, help_text="Transaction ID, Cheque No, or Bank Reference")
    notes = models.TextField(blank=True)
    
    is_voided = models.BooleanField(default=False, help_text="Set to true if payment is reversed/cancelled")
    void_reason = models.TextField(blank=True, help_text="Audit explanation for payment reversal")
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recorded_payments')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']

    def __str__(self):
        return f"Payment #{self.id}: {self.amount} for Loan {self.loan.loan_reference} ({'VOIDED' if self.is_voided else 'ACTIVE'})"
