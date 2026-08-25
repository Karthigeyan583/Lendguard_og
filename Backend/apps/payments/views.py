from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from .models import Payment
from .serializers import PaymentSerializer, PaymentCreateSerializer, PaymentVoidSerializer
from apps.loans.services.status_engine import evaluate_loan_status


class PaymentViewSet(viewsets.ModelViewSet):
    """
    Repayments Ledger API:
    Record repayments, apply overpayment validations, view history, and perform reversals.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Payment.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['loan', 'payment_method', 'is_voided']
    search_fields = ['reference_number', 'notes', 'loan__loan_reference', 'loan__person__name']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date', '-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Payment.objects.none()
        user = self.request.user
        if not user.is_authenticated:
            return Payment.objects.none()
        return Payment.objects.filter(created_by=user).select_related('loan', 'loan__person', 'created_by')

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        elif self.action == 'void_payment':
            return PaymentVoidSerializer
        return PaymentSerializer

    @extend_schema(
        summary="Void / Reverse Repayment",
        description="Safely reverses a repayment entry without destructive deletion, restoring the loan balance.",
        request=PaymentVoidSerializer,
        responses={200: PaymentSerializer},
        tags=["Repayments"]
    )
    @action(detail=True, methods=['post'], url_path='void')
    def void_payment(self, request, pk=None):
        payment = self.get_object()
        if payment.is_voided:
            return Response({"error": "Payment is already voided."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PaymentVoidSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        payment.is_voided = True
        payment.void_reason = serializer.validated_data['void_reason']
        payment.save(update_fields=['is_voided', 'void_reason'])

        # Recalculate loan status and balance
        evaluate_loan_status(payment.loan)

        return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)
