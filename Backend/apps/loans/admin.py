from django.contrib import admin
from .models import Loan


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ('loan_reference', 'person', 'principal_amount', 'currency', 'date_given', 'due_date', 'status', 'created_by')
    list_filter = ('status', 'currency', 'interest_model', 'is_archived')
    search_fields = ('loan_reference', 'person__name', 'purpose', 'notes')
