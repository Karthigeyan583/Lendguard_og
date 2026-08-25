from decimal import Decimal
from django.utils import timezone
from typing import Dict, List, Any

from apps.analytics.models import AlertRule
from apps.reminders.models import Notification
from .metric_engine import AnalyticsMetricService


class AlertEngine:
    """
    Evaluates configured threshold alert rules against the authoritative metrics engine.
    """

    @classmethod
    def evaluate_user_alerts(cls, user, reporting_currency: str = 'INR') -> List[Dict[str, Any]]:
        active_rules = AlertRule.objects.filter(created_by=user, is_active=True)
        if not active_rules.exists():
            return []

        overview = AnalyticsMetricService.get_executive_overview(user, reporting_currency=reporting_currency)
        triggered_alerts = []

        # Flatten metric lookup map
        metric_values = {
            'total_lent': overview['lending']['total_lent'],
            'total_borrowed': overview['borrowing']['total_borrowed'],
            'total_repaid': overview['lending']['total_repaid'],
            'total_repaid_to_lenders': overview['borrowing']['total_repaid'],
            'outstanding_receivables': overview['lending']['total_outstanding'],
            'outstanding_payables': overview['borrowing']['total_outstanding'],
            'net_financial_position': overview['net_position'],
            'recovery_rate': overview['lending']['recovery_rate'],
            'repayment_completion_rate': overview['borrowing']['repayment_completion_rate'],
            'overdue_receivables': overview['lending']['total_overdue'],
            'overdue_payables': overview['borrowing']['total_overdue'],
        }

        for rule in active_rules:
            current_val = Decimal(str(metric_values.get(rule.metric_id, 0.0)))
            target_val = Decimal(str(rule.threshold_value))
            op = rule.operator

            is_triggered = False
            if op in ['gt', '>'] and current_val > target_val:
                is_triggered = True
            elif op in ['gte', '>='] and current_val >= target_val:
                is_triggered = True
            elif op in ['lt', '<'] and current_val < target_val:
                is_triggered = True
            elif op in ['lte', '<='] and current_val <= target_val:
                is_triggered = True
            elif op in ['eq', '=='] and current_val == target_val:
                is_triggered = True
            elif op in ['neq', '!='] and current_val != target_val:
                is_triggered = True

            if is_triggered:
                rule.last_triggered_at = timezone.now()
                rule.save(update_fields=['last_triggered_at'])

                # Log In-App Notification
                Notification.objects.create(
                    user=user,
                    workspace=rule.workspace,
                    title=f"⚠️ Alert Triggered: {rule.name}",
                    message=f"Metric '{rule.metric_id}' reached {current_val} {rule.currency} (Threshold: {op} {target_val}).",
                    channel='in_app',
                    deep_link='/analytics'
                )

                triggered_alerts.append({
                    'rule_id': str(rule.id),
                    'rule_name': rule.name,
                    'metric_id': rule.metric_id,
                    'current_value': float(current_val),
                    'threshold_value': float(target_val),
                    'operator': op,
                    'triggered_at': rule.last_triggered_at.isoformat()
                })

        return triggered_alerts
