from django.db import models
from django.contrib.auth.models import User
from apps.workspaces.models import Workspace


class Person(models.Model):
    RELATIONSHIP_CHOICES = [
        ('friend', 'Friend'),
        ('family', 'Family'),
        ('colleague', 'Colleague'),
        ('business', 'Business Partner / Client'),
        ('other', 'Other'),
    ]

    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='people', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_people')
    name = models.CharField(max_length=150)
    mobile = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    relationship = models.CharField(max_length=30, choices=RELATIONSHIP_CHOICES, default='friend')
    tags = models.CharField(max_length=255, blank=True, help_text="Comma-separated tags for filtering")
    notes = models.TextField(blank=True, help_text="Private notes")
    is_archived = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

class BankAccount(models.Model):
    COUNTRY_CHOICES = [
        ('IN', 'India'),
        ('GB', 'United Kingdom'),
        ('US', 'United States'),
        ('EU', 'European Union (SEPA)'),
        ('AE', 'United Arab Emirates'),
        ('CA', 'Canada'),
        ('AU', 'Australia'),
        ('OTHER', 'International / Other'),
    ]

    ACCOUNT_TYPE_CHOICES = [
        ('savings', 'Savings Account'),
        ('current', 'Current / Checking Account'),
        ('business', 'Business Account'),
        ('salary', 'Salary Account'),
        ('other', 'Other'),
    ]

    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name='bank_accounts')
    country = models.CharField(max_length=10, choices=COUNTRY_CHOICES, default='IN')
    bank_name = models.CharField(max_length=150, help_text="Name of the financial institution")
    account_holder_name = models.CharField(max_length=150, help_text="Beneficiary name on bank record")
    account_number = models.CharField(max_length=64, help_text="Bank Account Number or IBAN")
    account_type = models.CharField(max_length=30, choices=ACCOUNT_TYPE_CHOICES, default='savings', blank=True)
    is_primary = models.BooleanField(default=False, help_text="Default disbursement account for this contact")
    
    # Country Specific Mandates
    # India:
    ifsc_code = models.CharField(max_length=20, blank=True, help_text="11-digit IFSC code for India (e.g. HDFC0001234)")
    upi_id = models.CharField(max_length=100, blank=True, help_text="Virtual Payment Address / UPI ID (e.g. name@okhdfcbank)")
    
    # United Kingdom:
    sort_code = models.CharField(max_length=20, blank=True, help_text="6-digit UK Sort Code (e.g. 20-45-77)")
    
    # United States:
    routing_number = models.CharField(max_length=20, blank=True, help_text="9-digit ABA Routing Transit Number for USA")
    
    # Europe / SEPA / International:
    iban = models.CharField(max_length=40, blank=True, help_text="International Bank Account Number (IBAN)")
    swift_bic = models.CharField(max_length=20, blank=True, help_text="8 or 11 character SWIFT/BIC code")
    
    # Canada:
    transit_number = models.CharField(max_length=10, blank=True, help_text="5-digit Branch Transit Number")
    institution_number = models.CharField(max_length=10, blank=True, help_text="3-digit Financial Institution Number")
    
    # Australia:
    bsb_number = models.CharField(max_length=20, blank=True, help_text="6-digit Bank State Branch (BSB) number")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_primary', 'created_at']

    def __str__(self):
        return f"{self.bank_name} - {self.person.name} ({'Primary' if self.is_primary else 'Secondary'})"
