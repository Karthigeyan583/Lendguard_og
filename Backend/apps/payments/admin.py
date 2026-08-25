from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'loan', 'amount', 'payment_date', 'payment_method', 'is_voided', 'created_by')
    list_filter = ('payment_method', 'is_voided', 'payment_date')
    search_fields = ('loan__loan_reference', 'reference_number', 'notes')
