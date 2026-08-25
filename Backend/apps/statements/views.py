from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import DigitalStatement
from .serializers import DigitalStatementSerializer, StatementGenerateRequestSerializer
from apps.loans.models import Loan
from apps.statements.services.statement_engine import generate_digital_statement


class StatementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Digital Statements & IOU API:
    Generate and retrieve verifiable statements with SHA-256 cryptographic hashes.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DigitalStatementSerializer
    queryset = DigitalStatement.objects.none()

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return DigitalStatement.objects.none()
        user = self.request.user
        if not user.is_authenticated:
            return DigitalStatement.objects.none()
        return DigitalStatement.objects.filter(loan__created_by=user).select_related('loan', 'loan__person')

    @extend_schema(
        summary="Generate Digital Statement & IOU",
        description="Generates an immutable canonical snapshot of the loan ledger with a cryptographic SHA-256 hash seal.",
        request=StatementGenerateRequestSerializer,
        responses={201: DigitalStatementSerializer},
        tags=["Statements & IOU"]
    )
    @action(detail=False, methods=['post'])
    def generate(self, request):
        serializer = StatementGenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        loan_id = serializer.validated_data['loan_id']

        try:
            loan = Loan.objects.get(id=loan_id, created_by=request.user)
        except Loan.DoesNotExist:
            return Response({"error": "Loan not found or unauthorized."}, status=status.HTTP_404_NOT_FOUND)

        statement = generate_digital_statement(loan, user=request.user)
        return Response(DigitalStatementSerializer(statement).data, status=status.HTTP_201_CREATED)
