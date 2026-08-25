from django.contrib import admin
from .models import CustomDashboard, DashboardWidget, SavedReport, ReportSchedule, AlertRule, AuditEvent


@admin.register(CustomDashboard)
class CustomDashboardAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_by', 'is_default', 'created_at')
    search_fields = ('title', 'created_by__username')
    list_filter = ('is_default', 'created_at')


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ('title', 'dashboard', 'visualization_type', 'metric_id', 'created_at')
    list_filter = ('visualization_type', 'data_source')


@admin.register(SavedReport)
class SavedReportAdmin(admin.ModelAdmin):
    list_display = ('name', 'data_source', 'created_by', 'visibility', 'created_at')
    search_fields = ('name', 'created_by__username')
    list_filter = ('data_source', 'visibility')


@admin.register(ReportSchedule)
class ReportScheduleAdmin(admin.ModelAdmin):
    list_display = ('saved_report', 'frequency', 'delivery_channel', 'is_active', 'next_run_at')
    list_filter = ('frequency', 'delivery_channel', 'is_active')


@admin.register(AlertRule)
class AlertRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'metric_id', 'operator', 'threshold_value', 'is_active', 'created_by')
    list_filter = ('is_active', 'operator', 'channel')


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action', 'module', 'target_reference', 'ip_address')
    list_filter = ('action', 'module', 'timestamp')
    search_fields = ('target_reference', 'details', 'user__username')
    readonly_fields = ('timestamp', 'changes_json', 'details')
