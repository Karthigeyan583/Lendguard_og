from django.contrib import admin
from .models import DigitalStatement


@admin.register(DigitalStatement)
class DigitalStatementAdmin(admin.ModelAdmin):
    list_display = ('statement_number', 'loan', 'sha256_hash', 'generated_by', 'generated_at')
    search_fields = ('statement_number', 'sha256_hash', 'loan__loan_reference')
