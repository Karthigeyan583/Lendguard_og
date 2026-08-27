from django.urls import path
from .views import (
    HealthCheckView,
    DashboardSummaryView,
    ReportsAgingView,
    DataExportView,
    DataPurgeView,
    CurrencyTickerAPIView
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('reports/aging/', ReportsAgingView.as_view(), name='reports-aging'),
    path('data/export/', DataExportView.as_view(), name='data-export'),
    path('data/purge/', DataPurgeView.as_view(), name='data-purge'),
    path('ticker/', CurrencyTickerAPIView.as_view(), name='currency-ticker'),
]

