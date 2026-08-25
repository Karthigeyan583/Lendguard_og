from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from .models import Loan
from .serializers import LoanSerializer, LoanCreateSerializer
from apps.loans.services.status_engine import evaluate_loan_status
from apps.reminders.services.reminder_engine import suppress_future_reminders


class LoanViewSet(viewsets.ModelViewSet):
    """
    Authoritative Lending Ledger API:
    Manage lending records, due dates, loan lifecycle, and financial state.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Loan.objects.none()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'person', 'currency', 'interest_model', 'direction', 'is_archived']
    search_fields = ['loan_reference', 'purpose', 'notes', 'person__name', 'person__mobile', 'person__email']
    ordering_fields = ['date_given', 'due_date', 'principal_amount', 'created_at']
    ordering = ['-date_given', '-created_at']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Loan.objects.none()
        user = self.request.user
        if not user.is_authenticated:
            return Loan.objects.none()
        qs = Loan.objects.filter(created_by=user).select_related('person', 'created_by')
        
        # Direction filter with alias support (lending/borrowing/lent/borrowed)
        direction = self.request.query_params.get('direction')
        if direction and direction.lower() != 'all':
            d_lower = direction.strip().lower()
            if d_lower in ['borrowed', 'borrowing']:
                qs = qs.filter(direction='borrowed')
            elif d_lower in ['lent', 'lending']:
                qs = qs.filter(direction='lent')

        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return LoanCreateSerializer
        return LoanSerializer

    @extend_schema(summary="Cancel Loan", description="Cancel or void a loan record. Suppresses future reminders.", tags=["Loans"])
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        loan = self.get_object()
        loan.status = 'CANCELLED'
        loan.save(update_fields=['status'])
        suppress_future_reminders(loan)
        return Response(LoanSerializer(loan).data, status=status.HTTP_200_OK)

    @extend_schema(summary="Write Off Loan", description="Mark loan as written off (defaulted) for accounting audit.", tags=["Loans"])
    @action(detail=True, methods=['post'])
    def write_off(self, request, pk=None):
        loan = self.get_object()
        loan.status = 'WRITTEN_OFF'
        loan.save(update_fields=['status'])
        suppress_future_reminders(loan)
        return Response(LoanSerializer(loan).data, status=status.HTTP_200_OK)

    @extend_schema(summary="Loan Ledger", description="Retrieve chronological repayment history for this specific loan.", tags=["Loans"])
    @action(detail=True, methods=['get'])
    def ledger(self, request, pk=None):
        loan = self.get_object()
        payments = loan.payments.all().order_by('payment_date')
        return Response({
            'loan': LoanSerializer(loan).data,
            'ledger': [{
                'id': p.id,
                'amount': float(p.amount),
                'payment_date': str(p.payment_date),
                'payment_method': p.payment_method,
                'reference_number': p.reference_number,
                'is_voided': p.is_voided,
                'void_reason': p.void_reason,
                'created_at': p.created_at.isoformat()
            } for p in payments]
        }, status=status.HTTP_200_OK)
