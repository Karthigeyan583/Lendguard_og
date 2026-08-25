import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from apps.workspaces.models import Workspace


class CustomDashboard(models.Model):
    """
    User/Workspace Custom Dashboard Configuration Container.
    Supports multiple dashboards per user, re-orderable widgets, and default layout flags.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='custom_dashboards', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_dashboards')
    title = models.CharField(max_length=150, help_text="e.g. Portfolio Risk, Monthly Collections")
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False, help_text="Whether this dashboard loads first")
    layout_config = models.JSONField(default=dict, blank=True, help_text="Grid coordinates and layout metadata")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'title']

    def __str__(self):
        return f"{self.title} ({self.created_by.username})"


class DashboardWidget(models.Model):
    """
    Individual Reusable Widget configuration tied to a CustomDashboard.
    """
    VISUALIZATION_CHOICES = [
        ('kpi_card', 'KPI Stat Card'),
        ('line_chart', 'Trend Line Chart'),
        ('area_chart', 'Cash Flow Area Chart'),
        ('bar_chart', 'Grouped Bar Chart'),
        ('stacked_bar', 'Stacked Composition Bar'),
        ('donut_chart', 'Donut Share Chart'),
        ('pie_chart', 'Pie Chart'),
        ('heatmap', 'Density Heatmap'),
        ('waterfall', 'Net Waterfall Chart'),
        ('progress_bar', 'Progress Meter'),
        ('table', 'Detail Data Table'),
        ('pivot_table', '2D Pivot Matrix Table'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dashboard = models.ForeignKey(CustomDashboard, on_delete=models.CASCADE, related_name='widgets')
    widget_type = models.CharField(max_length=50, default='metric')
    title = models.CharField(max_length=150)
    description = models.CharField(max_length=255, blank=True)
    
    metric_id = models.CharField(max_length=80, help_text="Central Metric ID from MetricRegistry")
    data_source = models.CharField(max_length=50, default='loans', help_text="loans, payments, people, reminders, audit")
    filters_config = models.JSONField(default=dict, blank=True, help_text="Dynamic AST filter tree")
    date_range = models.CharField(max_length=50, default='last_30_days')
    group_by = models.CharField(max_length=50, blank=True)
    sort_by = models.CharField(max_length=50, blank=True)
    currency = models.CharField(max_length=10, default='REPORTING')
    visualization_type = models.CharField(max_length=30, choices=VISUALIZATION_CHOICES, default='kpi_card')
    
    grid_position = models.JSONField(default=dict, blank=True, help_text="x, y, w, h grid coordinates")
    refresh_interval = models.IntegerField(default=0, help_text="Auto-refresh seconds (0 = manual)")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Widget {self.title} [{self.visualization_type}] on {self.dashboard.title}"


class SavedReport(models.Model):
    """
    Custom Dynamic Report Definition created via the Custom Report Builder.
    """
    DATA_SOURCE_CHOICES = [
        ('loans', 'Loans & Lending Ledger'),
        ('borrowing', 'Borrowing Obligations Ledger'),
        ('payments', 'Repayment & Collection Transactions'),
        ('people', 'People & Counterparty Directory'),
        ('reminders', 'Reminders & Notifications'),
        ('statements', 'Digital Statements Audit'),
        ('audit', 'Audit Ledger Activity'),
    ]

    VISIBILITY_CHOICES = [
        ('private', 'Private (Owner Only)'),
        ('workspace', 'Workspace Members'),
        ('shared', 'Shared via Link/Export'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='saved_reports', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_reports')
    
    name = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    data_source = models.CharField(max_length=40, choices=DATA_SOURCE_CHOICES, default='loans')
    
    selected_fields = models.JSONField(default=list, help_text="List of column field keys to display")
    metrics = models.JSONField(default=list, blank=True, help_text="Aggregated metrics like SUM(outstanding)")
    filters_config = models.JSONField(default=dict, blank=True, help_text="Dynamic AST filter tree")
    
    group_by = models.CharField(max_length=60, blank=True, help_text="e.g. person, currency, month, status")
    pivot_columns = models.CharField(max_length=60, blank=True, help_text="Secondary group-by for 2D pivot matrices")
    sort_by = models.CharField(max_length=60, default='created_at')
    sort_order = models.CharField(max_length=10, default='desc')
    
    visualization_type = models.CharField(max_length=40, default='table')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='private')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Report: {self.name} ({self.created_by.username})"


class ReportSchedule(models.Model):
    """
    Automated Recurring Schedule for saved reports.
    """
    FREQUENCY_CHOICES = [
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Summary'),
        ('monthly', 'Monthly Financial Report'),
        ('quarterly', 'Quarterly Portfolio Review'),
    ]

    DELIVERY_CHOICES = [
        ('in_app', 'In-App Notification & Download'),
        ('email', 'Email PDF/Excel Attachment'),
        ('download', 'Direct Ready Download'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    saved_report = models.ForeignKey(SavedReport, on_delete=models.CASCADE, related_name='schedules')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='report_schedules')
    
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='monthly')
    delivery_channel = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='in_app')
    export_format = models.CharField(max_length=10, default='PDF')
    recipients = models.JSONField(default=list, blank=True, help_text="List of email addresses or user IDs")
    
    is_active = models.BooleanField(default=True)
    last_run_at = models.DateTimeField(null=True, blank=True)
    next_run_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Schedule {self.frequency} for {self.saved_report.name}"


class AlertRule(models.Model):
    """
    Threshold Alert Rules configured by the user (e.g. Overdue > €10,000, Recovery < 80%).
    """
    OPERATOR_CHOICES = [
        ('gt', 'Greater Than (>)'),
        ('gte', 'Greater Than or Equal (>=)'),
        ('lt', 'Less Than (<)'),
        ('lte', 'Less Than or Equal (<=)'),
        ('eq', 'Equal (==)'),
        ('neq', 'Not Equal (!=)'),
    ]

    CHANNEL_CHOICES = [
        ('in_app', 'In-App Alert Notification'),
        ('email', 'Email Alert'),
        ('push', 'Push Notification'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='alert_rules', null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alert_rules')
    
    name = models.CharField(max_length=160, help_text="e.g. High Overdue Risk Alert")
    metric_id = models.CharField(max_length=80, help_text="e.g. total_overdue_receivables, recovery_rate")
    operator = models.CharField(max_length=10, choices=OPERATOR_CHOICES, default='gt')
    threshold_value = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=10, default='REPORTING')
    
    filters_config = models.JSONField(default=dict, blank=True)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='in_app')
    is_active = models.BooleanField(default=True)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Alert '{self.name}': {self.metric_id} {self.operator} {self.threshold_value}"


class AuditEvent(models.Model):
    """
    Centralized Enterprise Audit Trail recording all security, agreement, repayment, and export actions.
    """
    ACTION_CHOICES = [
        ('CREATE', 'Record Created'),
        ('UPDATE', 'Record Updated'),
        ('DELETE', 'Record Deleted'),
        ('VOID', 'Payment Voided/Reversed'),
        ('EXPORT', 'Data/Report Exported'),
        ('GENERATE', 'Statement Generated'),
        ('LOGIN', 'User Logged In'),
        ('SECURITY_CHANGE', 'Security/Profile Setting Changed'),
    ]

    MODULE_CHOICES = [
        ('LOANS', 'Lending Ledger'),
        ('BORROWING', 'Borrowing Ledger'),
        ('PAYMENTS', 'Repayments & Collections'),
        ('PEOPLE', 'Counterparty Contacts'),
        ('STATEMENTS', 'Digital Statements'),
        ('REPORTS', 'Analytics & Reports'),
        ('SETTINGS', 'Admin & Settings'),
        ('AUTH', 'Authentication'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='audit_events', null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_events')
    
    action = models.CharField(max_length=25, choices=ACTION_CHOICES)
    module = models.CharField(max_length=25, choices=MODULE_CHOICES)
    target_id = models.CharField(max_length=80, blank=True)
    target_reference = models.CharField(max_length=120, blank=True)
    
    details = models.TextField(blank=True)
    changes_json = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'module', 'action']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {self.user.username if self.user else 'System'} - {self.action} on {self.module} ({self.target_reference})"
