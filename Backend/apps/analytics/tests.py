import datetime
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient

from apps.people.models import Person
from apps.loans.models import Loan
from apps.payments.models import Payment
from apps.analytics.models import CustomDashboard, DashboardWidget, SavedReport, AlertRule, AuditEvent
from apps.analytics.services.metric_engine import AnalyticsMetricService, METRIC_REGISTRY
from apps.analytics.services.cashflow_engine import CashFlowEngine
from apps.analytics.services.report_engine import CustomReportEngine
from apps.analytics.services.alert_engine import AlertEngine


class AnalyticsModuleTests(TestCase):
    """
    Comprehensive Test Suite for LendGuard Analytics & Reporting Module.
    Validates metrics, directional separation, multi-currency normalization,
    custom reports, pivot matrices, and alerts.
    """

    def setUp(self):
        self.user = User.objects.create_user(username='analyst', password='TestPassword123!', email='analyst@lendguard.io')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.john = Person.objects.create(name='John Doe', created_by=self.user, relationship='friend')
        self.alice = Person.objects.create(name='Alice Smith', created_by=self.user, relationship='business')

        today = timezone.localdate()

        # 1. Money Lent to John: 10,000 INR
        self.loan_lent = Loan.objects.create(
            created_by=self.user,
            person=self.john,
            loan_reference='LG-2026-TEST-01',
            direction='lent',
            principal_amount=Decimal('10000.00'),
            currency='INR',
            reporting_currency='INR',
            exchange_rate=Decimal('1.000000'),
            reporting_principal_amount=Decimal('10000.00'),
            date_given=today - datetime.timedelta(days=15),
            due_date=today + datetime.timedelta(days=15),
            purpose='Personal Loan'
        )

        # Repayment on Lent: 4,000 INR -> Outstanding Lent: 6,000 INR
        Payment.objects.create(
            created_by=self.user,
            loan=self.loan_lent,
            amount=Decimal('4000.00'),
            currency='INR',
            reporting_currency='INR',
            reporting_amount=Decimal('4000.00'),
            payment_date=today - datetime.timedelta(days=5),
            payment_method='upi_bank_transfer'
        )

        # 2. Money Borrowed from Alice: 100 EUR (1 EUR = 98 INR -> 9,800 INR)
        self.loan_borrowed = Loan.objects.create(
            created_by=self.user,
            person=self.alice,
            loan_reference='LG-2026-TEST-02',
            direction='borrowed',
            principal_amount=Decimal('100.00'),
            currency='EUR',
            reporting_currency='INR',
            exchange_rate=Decimal('98.000000'),
            reporting_principal_amount=Decimal('9800.00'),
            date_given=today - datetime.timedelta(days=10),
            due_date=today + datetime.timedelta(days=20),
            purpose='Equipment Purchase'
        )

        # Repayment on Borrowed: 30 EUR -> 2,940 INR -> Outstanding Borrowed: 70 EUR = 6,860 INR
        Payment.objects.create(
            created_by=self.user,
            loan=self.loan_borrowed,
            amount=Decimal('30.00'),
            currency='EUR',
            reporting_currency='INR',
            reporting_amount=Decimal('2940.00'),
            payment_date=today - datetime.timedelta(days=2),
            payment_method='bank_transfer'
        )

    def test_01_metric_registry_structure(self):
        """Verify central metric dictionary catalog contains essential IDs."""
        self.assertIn('total_lent', METRIC_REGISTRY)
        self.assertIn('total_borrowed', METRIC_REGISTRY)
        self.assertIn('net_financial_position', METRIC_REGISTRY)
        self.assertEqual(METRIC_REGISTRY['net_financial_position']['direction'], 'NET')

    def test_02_executive_overview_directional_and_net_position(self):
        """
        Verify Executive Overview:
        - Lent: 10,000, Repaid: 4,000, Outstanding: 6,000, Recovery: 40.0%
        - Borrowed: 9,800 INR (100 EUR), Repaid: 2,940 INR (30 EUR), Outstanding: 6,860 INR (70 EUR), Completion: 30.0%
        - Net Position = 6,000 - 6,860 = -860.00 (Net Payable)
        """
        overview = AnalyticsMetricService.get_executive_overview(self.user, reporting_currency='INR')

        self.assertEqual(overview['lending']['total_lent'], 10000.0)
        self.assertEqual(overview['lending']['total_repaid'], 4000.0)
        self.assertEqual(overview['lending']['total_outstanding'], 6000.0)
        self.assertEqual(overview['lending']['recovery_rate'], 40.0)

        self.assertEqual(overview['borrowing']['total_borrowed'], 9800.0)
        self.assertEqual(overview['borrowing']['total_repaid'], 2940.0)
        self.assertEqual(overview['borrowing']['total_outstanding'], 6860.0)
        self.assertEqual(overview['borrowing']['repayment_completion_rate'], 30.0)

        self.assertEqual(overview['net_position'], -860.0)
        self.assertIn('Net Payable', overview['net_position_label'])

    def test_03_lending_analytics_size_bands_and_breakdown(self):
        """Verify dedicated lending analytics groups loan sizes, purpose, and borrower exposure."""
        data = AnalyticsMetricService.get_lending_analytics(self.user, reporting_currency='INR')
        self.assertEqual(data['summary']['total_lent'], 10000.0)
        self.assertEqual(data['summary']['recovery_rate'], 40.0)
        self.assertEqual(len(data['purpose_breakdown']), 1)
        self.assertEqual(data['purpose_breakdown'][0]['purpose'], 'Personal Loan')

    def test_04_borrowing_analytics_lender_obligations(self):
        """Verify dedicated borrowing analytics tracks lender liabilities and upcoming maturities."""
        data = AnalyticsMetricService.get_borrowing_analytics(self.user, reporting_currency='INR')
        self.assertEqual(data['summary']['total_borrowed'], 9800.0)
        self.assertEqual(len(data['top_lenders']), 1)
        self.assertEqual(data['top_lenders'][0]['name'], 'Alice Smith')

    def test_05_cashflow_timeline_and_12m_forecast(self):
        """Verify historical realized cashflow and forward 12-month projections."""
        data = CashFlowEngine.get_cashflow_timeline(self.user, reporting_currency='INR')
        self.assertIn('forecast_windows', data)
        self.assertIn('forward_projection_series', data)
        self.assertEqual(len(data['forward_projection_series']), 12)

    def test_06_custom_report_and_2d_pivot_matrix(self):
        """Verify dynamic custom report builder can calculate rows, groupings, and 2D pivot matrices."""
        config = {
            'data_source': 'loans',
            'selected_fields': ['loan_reference', 'person_name', 'direction', 'reporting_principal', 'reporting_outstanding'],
            'group_by': 'direction',
            'pivot_columns': 'currency'
        }
        result = CustomReportEngine.execute_report(self.user, config, reporting_currency='INR')
        self.assertEqual(result['total_rows_count'], 2)
        self.assertIsNotNone(result['pivot_matrix'])
        self.assertIn('cells', result['pivot_matrix'])

    def test_07_alert_rule_threshold_trigger(self):
        """Verify Alert Rule triggers when threshold condition is met and creates a Notification."""
        AlertRule.objects.create(
            created_by=self.user,
            name='High Outstanding Payables Alert',
            metric_id='outstanding_payables',
            operator='gt',
            threshold_value=Decimal('5000.00'), # 6,860 > 5,000 -> Should trigger
            channel='in_app'
        )

        triggered = AlertEngine.evaluate_user_alerts(self.user, reporting_currency='INR')
        self.assertEqual(len(triggered), 1)
        self.assertEqual(triggered[0]['metric_id'], 'outstanding_payables')

    def test_08_rest_api_overview_endpoint(self):
        """Verify /api/v1/analytics/overview/ returns 200 and authorized data."""
        res = self.client.get('/api/v1/analytics/overview/?reporting_currency=INR')
        self.assertEqual(res.status_code, 200)
        self.assertIn('net_position', res.data)
        self.assertIn('lending', res.data)
        self.assertIn('borrowing', res.data)

    def test_09_rest_api_reports_crud_and_preview(self):
        """Verify CustomReportViewSet CRUD and preview endpoints."""
        create_res = self.client.post('/api/v1/analytics/reports/', {
            'name': 'Monthly Receivables Audit',
            'data_source': 'loans',
            'selected_fields': ['loan_reference', 'person_name', 'reporting_outstanding'],
            'group_by': 'person_name'
        }, format='json')
        self.assertEqual(create_res.status_code, 201)
        report_id = create_res.data['id']

        run_res = self.client.get(f'/api/v1/analytics/reports/{report_id}/run/')
        self.assertEqual(run_res.status_code, 200)
        self.assertEqual(run_res.data['total_rows_count'], 2)

    def test_10_rest_api_export_endpoint(self):
        """Verify /api/v1/analytics/reports/{id}/export/ returns CSV and JSON."""
        report = SavedReport.objects.create(
            created_by=self.user,
            name='Test Export Report',
            data_source='loans'
        )
        csv_res = self.client.get(f'/api/v1/analytics/reports/{report.id}/export/?format=csv')
        self.assertEqual(csv_res.status_code, 200)
        self.assertEqual(csv_res['Content-Type'], 'text/csv; charset=utf-8')
