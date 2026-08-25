from rest_framework import serializers
from .models import CustomDashboard, DashboardWidget, SavedReport, ReportSchedule, AlertRule, AuditEvent


class DashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'dashboard', 'widget_type', 'title', 'description',
            'metric_id', 'data_source', 'filters_config', 'date_range',
            'group_by', 'sort_by', 'currency', 'visualization_type',
            'grid_position', 'refresh_interval', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CustomDashboardSerializer(serializers.ModelSerializer):
    widgets = DashboardWidgetSerializer(many=True, read_only=True)
    widgets_count = serializers.IntegerField(source='widgets.count', read_only=True)

    class Meta:
        model = CustomDashboard
        fields = [
            'id', 'workspace', 'created_by', 'title', 'description',
            'is_default', 'layout_config', 'widgets', 'widgets_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class SavedReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedReport
        fields = [
            'id', 'workspace', 'created_by', 'name', 'description',
            'data_source', 'selected_fields', 'metrics', 'filters_config',
            'group_by', 'pivot_columns', 'sort_by', 'sort_order',
            'visualization_type', 'visibility', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class ReportScheduleSerializer(serializers.ModelSerializer):
    report_name = serializers.CharField(source='saved_report.name', read_only=True)

    class Meta:
        model = ReportSchedule
        fields = [
            'id', 'saved_report', 'report_name', 'created_by', 'frequency',
            'delivery_channel', 'export_format', 'recipients', 'is_active',
            'last_run_at', 'next_run_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'last_run_at', 'created_at']


class AlertRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertRule
        fields = [
            'id', 'workspace', 'created_by', 'name', 'metric_id',
            'operator', 'threshold_value', 'currency', 'filters_config',
            'channel', 'is_active', 'last_triggered_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_by', 'last_triggered_at', 'created_at']


class AuditEventSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AuditEvent
        fields = [
            'id', 'workspace', 'user', 'username', 'action', 'module',
            'target_id', 'target_reference', 'details', 'changes_json',
            'ip_address', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']
