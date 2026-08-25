from django.urls import path
from .views import HealthCheckView, DashboardSummaryView, ReportsAgingView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('reports/aging/', ReportsAgingView.as_view(), name='reports-aging'),
]
