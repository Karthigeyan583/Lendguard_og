from django.db import models
from django.contrib.auth.models import User
from apps.loans.models import Loan


class DigitalStatement(models.Model):
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='statements')
    statement_number = models.CharField(max_length=60, unique=True, help_text="e.g. STMT-LG-2026-0001-01")
    canonical_data_snapshot = models.JSONField(help_text="Canonical JSON snapshot of loan, person, balance, and repayment ledger")
    sha256_hash = models.CharField(max_length=64, help_text="Cryptographic SHA-256 integrity hash")
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='generated_statements')
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"{self.statement_number} ({self.sha256_hash[:8]}...)"
