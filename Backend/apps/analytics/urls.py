from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AnalyticsOverviewView,
    LendingAnalyticsView,
    BorrowingAnalyticsView,
    PaymentsAnalyticsView,
    CashFlowAnalyticsView,
    MetricsDictionaryView,
    CustomReportViewSet,
    CustomDashboardViewSet,
    ReportScheduleViewSet,
    AlertRuleViewSet,
    AuditAnalyticsView
)

router = DefaultRouter()
router.register(r'reports', CustomReportViewSet, basename='analytics-report')
router.register(r'dashboards', CustomDashboardViewSet, basename='analytics-dashboard')
router.register(r'schedules', ReportScheduleViewSet, basename='analytics-schedule')
router.register(r'alerts', AlertRuleViewSet, basename='analytics-alert')

urlpatterns = [
    path('overview/', AnalyticsOverviewView.as_view(), name='analytics-overview'),
    path('lending/', LendingAnalyticsView.as_view(), name='analytics-lending'),
    path('borrowing/', BorrowingAnalyticsView.as_view(), name='analytics-borrowing'),
    path('payments/', PaymentsAnalyticsView.as_view(), name='analytics-payments'),
    path('cashflow/', CashFlowAnalyticsView.as_view(), name='analytics-cashflow'),
    path('metrics/', MetricsDictionaryView.as_view(), name='analytics-metrics'),
    path('audit/', AuditAnalyticsView.as_view(), name='analytics-audit'),
    path('', include(router.urls)),
]
