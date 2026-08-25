from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import CustomDashboard, DashboardWidget, SavedReport, ReportSchedule, AlertRule, AuditEvent
from .serializers import (
    CustomDashboardSerializer,
    DashboardWidgetSerializer,
    SavedReportSerializer,
    ReportScheduleSerializer,
    AlertRuleSerializer,
    AuditEventSerializer
)
from .services.metric_engine import AnalyticsMetricService, METRIC_REGISTRY
from .services.cashflow_engine import CashFlowEngine
from .services.report_engine import CustomReportEngine
from .services.export_engine import UniversalExportEngine
from .services.alert_engine import AlertEngine


def _extract_reporting_currency(request) -> str:
    user = request.user
    curr = request.query_params.get('reporting_currency') or request.query_params.get('currency')
    if curr and curr.upper() != 'REPORTING':
        return curr.upper().strip()
    if hasattr(user, 'profile') and getattr(user.profile, 'base_currency', None):
        return user.profile.base_currency
    return 'INR'


def _extract_query_filters(request) -> dict:
    params = request.query_params
    return {
        'direction': params.get('direction'),
        'currency': params.get('currency'),
        'person': params.get('person') or params.get('person_id'),
        'status': params.get('status'),
        'is_overdue': params.get('is_overdue'),
        'date_range': params.get('date_range') or params.get('date_preset'),
        'start_date': params.get('start_date') or params.get('date_from'),
        'end_date': params.get('end_date') or params.get('date_to'),
        'search': params.get('search'),
        'min_amount': params.get('min_amount'),
        'max_amount': params.get('max_amount'),
        'comparison_mode': params.get('comparison_mode', 'previous_period')
    }


class AnalyticsOverviewView(APIView):
    """
    Executive Analytics Overview: Lending, Borrowing, Net Financial Position,
    Currency Exposure, Comparison Period Delta.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Analytics Executive Overview", tags=["Analytics"])
    def get(self, request):
        rep_curr = _extract_reporting_currency(request)
        filters = _extract_query_filters(request)
        data = AnalyticsMetricService.get_executive_overview(request.user, filters, reporting_currency=rep_curr)
        return Response(data)


class LendingAnalyticsView(APIView):
    """
    Dedicated Lending Portfolio Analytics: Volumes, Trends, Loan Size Bands, Purpose, Counterparty rankings.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Lending Portfolio Analytics", tags=["Analytics"])
    def get(self, request):
        rep_curr = _extract_reporting_currency(request)
        filters = _extract_query_filters(request)
        data = AnalyticsMetricService.get_lending_analytics(request.user, filters, reporting_currency=rep_curr)
        return Response(data)


class BorrowingAnalyticsView(APIView):
    """
    Dedicated Borrowing Obligations Analytics: Debt Liabilities, Repayment Pace, Maturity Schedules, Lenders.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Borrowing Obligations Analytics", tags=["Analytics"])
    def get(self, request):
        rep_curr = _extract_reporting_currency(request)
        filters = _extract_query_filters(request)
        data = AnalyticsMetricService.get_borrowing_analytics(request.user, filters, reporting_currency=rep_curr)
        return Response(data)


class PaymentsAnalyticsView(APIView):
    """
    Repayment & Collection Transactions: Payment Methods, Volumes, On-time vs Late behavior.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Payments & Transactions Analytics", tags=["Analytics"])
    def get(self, request):
        rep_curr = _extract_reporting_currency(request)
        filters = _extract_query_filters(request)
        data = AnalyticsMetricService.get_payments_analytics(request.user, filters, reporting_currency=rep_curr)
        return Response(data)


class CashFlowAnalyticsView(APIView):
    """
    Cash-Flow Timeline: Realized Historical Inflows/Outflows & Forward 12-Month Inflow/Outflow Forecasts.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Cash-Flow Timeline & Forecasts", tags=["Analytics"])
    def get(self, request):
        rep_curr = _extract_reporting_currency(request)
        filters = _extract_query_filters(request)
        data = CashFlowEngine.get_cashflow_timeline(request.user, filters, reporting_currency=rep_curr)
        return Response(data)


class MetricsDictionaryView(APIView):
    """
    Central Metric Dictionary Metadata: Definition, formula, directional scope, and currency treatment.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Central Metric Dictionary Catalog", tags=["Analytics"])
    def get(self, request):
        return Response({
            'metrics_count': len(METRIC_REGISTRY),
            'metrics': list(METRIC_REGISTRY.values())
        })


class CustomReportViewSet(viewsets.ModelViewSet):
    """
    Custom Dynamic Report Builder, execution, 2D pivot matrix, and multi-format exports.
    """
    serializer_class = SavedReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavedReport.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        report = serializer.save(created_by=self.request.user)
        AuditEvent.objects.create(
            user=self.request.user,
            action='CREATE',
            module='REPORTS',
            target_id=str(report.id),
            target_reference=report.name,
            details=f"Created custom report '{report.name}' for data source '{report.data_source}'."
        )

    @action(detail=False, methods=['post'], url_path='preview')
    def preview(self, request):
        """Live interactive preview of dynamic report configuration."""
        rep_curr = _extract_reporting_currency(request)
        config = request.data
        result = CustomReportEngine.execute_report(request.user, config, reporting_currency=rep_curr)
        return Response(result)

    @action(detail=True, methods=['get', 'post'], url_path='run')
    def run(self, request, pk=None):
        """Execute saved report and return structured data with optional 2D pivot."""
        report = self.get_object()
        rep_curr = _extract_reporting_currency(request)
        config = {
            'data_source': report.data_source,
            'selected_fields': report.selected_fields,
            'metrics': report.metrics,
            'filters_config': report.filters_config,
            'group_by': report.group_by,
            'pivot_columns': report.pivot_columns,
            'sort_by': report.sort_by,
            'sort_order': report.sort_order,
        }
        result = CustomReportEngine.execute_report(request.user, config, reporting_currency=rep_curr)
        return Response(result)

    @action(detail=True, methods=['get', 'post'], url_path='export')
    def export(self, request, pk=None, format=None):
        """Export report as CSV, JSON, or HTML-PDF."""
        report = self.get_object()
        fmt = str(
            request.query_params.get('export_format') or
            request.query_params.get('format') or
            format or
            request.data.get('format', 'csv')
        ).lower()
        rep_curr = _extract_reporting_currency(request)
        config = {
            'data_source': report.data_source,
            'selected_fields': report.selected_fields,
            'metrics': report.metrics,
            'filters_config': report.filters_config,
            'group_by': report.group_by,
            'pivot_columns': report.pivot_columns,
            'sort_by': report.sort_by,
            'sort_order': report.sort_order,
        }
        data = CustomReportEngine.execute_report(request.user, config, reporting_currency=rep_curr)

        # Audit Event
        AuditEvent.objects.create(
            user=request.user,
            action='EXPORT',
            module='REPORTS',
            target_id=str(report.id),
            target_reference=report.name,
            details=f"Exported report '{report.name}' in format '{fmt.upper()}'."
        )

        if fmt in ['json', 'application/json']:
            return UniversalExportEngine.export_json(data, f"{report.name.lower().replace(' ', '_')}.json")
        elif fmt in ['pdf', 'html']:
            return UniversalExportEngine.export_html_pdf(data, title=report.name)
        else:
            return UniversalExportEngine.export_csv(data, f"{report.name.lower().replace(' ', '_')}.csv")


class CustomDashboardViewSet(viewsets.ModelViewSet):
    """
    Custom Dashboard Manager: Multiple user dashboards, widget placement, and default views.
    """
    serializer_class = CustomDashboardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomDashboard.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='widgets')
    def add_widget(self, request, pk=None):
        dashboard = self.get_object()
        serializer = DashboardWidgetSerializer(data={**request.data, 'dashboard': dashboard.id})
        serializer.is_valid(raise_exception=True)
        widget = serializer.save()
        return Response(DashboardWidgetSerializer(widget).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'widgets/(?P<widget_id>[^/.]+)')
    def delete_widget(self, request, pk=None, widget_id=None):
        dashboard = self.get_object()
        DashboardWidget.objects.filter(id=widget_id, dashboard=dashboard).delete()
        return Response({'status': 'deleted'}, status=status.HTTP_204_NO_CONTENT)


class ReportScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ReportScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReportSchedule.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AlertRuleViewSet(viewsets.ModelViewSet):
    """
    Threshold Alert Rules: configure and evaluate alerts against live portfolio metrics.
    """
    serializer_class = AlertRuleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AlertRule.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post', 'get'], url_path='check')
    def check_alerts(self, request):
        rep_curr = _extract_reporting_currency(request)
        triggered = AlertEngine.evaluate_user_alerts(request.user, reporting_currency=rep_curr)
        return Response({
            'evaluated_count': AlertRule.objects.filter(created_by=request.user, is_active=True).count(),
            'triggered_alerts': triggered
        })


class AuditAnalyticsView(APIView):
    """
    Administrative Audit Trail & Activity Feed: Filter by module, user, and action.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Audit Log Analytics", tags=["Analytics"])
    def get(self, request):
        events = AuditEvent.objects.filter(user=request.user).order_by('-timestamp')[:50]
        return Response({
            'total_events': events.count(),
            'events': AuditEventSerializer(events, many=True).data
        })
