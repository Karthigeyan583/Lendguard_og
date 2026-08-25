from rest_framework import serializers
from .models import DigitalStatement


class DigitalStatementSerializer(serializers.ModelSerializer):
    loan_reference = serializers.CharField(source='loan.loan_reference', read_only=True)
    person_name = serializers.CharField(source='loan.person.name', read_only=True)

    class Meta:
        model = DigitalStatement
        fields = [
            'id',
            'loan',
            'loan_reference',
            'person_name',
            'statement_number',
            'canonical_data_snapshot',
            'sha256_hash',
            'generated_at'
        ]
        read_only_fields = ['id', 'statement_number', 'canonical_data_snapshot', 'sha256_hash', 'generated_at']


class StatementGenerateRequestSerializer(serializers.Serializer):
    loan_id = serializers.IntegerField(required=True, help_text="ID of the loan to generate a formal Digital IOU/Statement for")
