import datetime
from decimal import Decimal
from django.db.models import Q
from django.utils import timezone
from typing import Dict, Any, Tuple, Optional


def get_date_range_bounds(preset: str, custom_start: Optional[str] = None, custom_end: Optional[str] = None) -> Tuple[Optional[datetime.date], Optional[datetime.date]]:
    """
    Computes absolute (start_date, end_date) for standard financial date presets.
    """
    today = timezone.localdate()
    p = str(preset or 'all_time').lower().strip()

    if p == 'today':
        return (today, today)
    elif p == 'yesterday':
        y = today - datetime.timedelta(days=1)
        return (y, y)
    elif p == 'this_week':
        start = today - datetime.timedelta(days=today.weekday())
        return (start, today)
    elif p == 'last_week':
        start = today - datetime.timedelta(days=today.weekday() + 7)
        end = start + datetime.timedelta(days=6)
        return (start, end)
    elif p == 'this_month':
        start = today.replace(day=1)
        return (start, today)
    elif p == 'last_month':
        first_this_month = today.replace(day=1)
        end = first_this_month - datetime.timedelta(days=1)
        start = end.replace(day=1)
        return (start, end)
    elif p == 'this_quarter':
        quarter_month = ((today.month - 1) // 3) * 3 + 1
        start = today.replace(month=quarter_month, day=1)
        return (start, today)
    elif p == 'last_quarter':
        current_quarter_start = today.replace(month=((today.month - 1) // 3) * 3 + 1, day=1)
        end = current_quarter_start - datetime.timedelta(days=1)
        start_month = ((end.month - 1) // 3) * 3 + 1
        start = end.replace(month=start_month, day=1)
        return (start, end)
    elif p == 'this_year':
        start = today.replace(month=1, day=1)
        return (start, today)
    elif p == 'last_year':
        start = today.replace(year=today.year - 1, month=1, day=1)
        end = today.replace(year=today.year - 1, month=12, day=31)
        return (start, end)
    elif p == 'last_7_days':
        return (today - datetime.timedelta(days=6), today)
    elif p == 'last_30_days':
        return (today - datetime.timedelta(days=29), today)
    elif p == 'last_90_days':
        return (today - datetime.timedelta(days=89), today)
    elif p == 'last_12_months':
        return (today - datetime.timedelta(days=364), today)
    elif p == 'custom':
        start = datetime.date.fromisoformat(custom_start) if custom_start else None
        end = datetime.date.fromisoformat(custom_end) if custom_end else None
        return (start, end)
    elif p == 'all_time' or not p:
        return (None, None)
    return (None, None)


def get_comparison_date_bounds(start_date: datetime.date, end_date: datetime.date, mode: str = 'previous_period') -> Tuple[datetime.date, datetime.date]:
    """
    Computes prior comparison window for comparative analysis:
    - 'previous_period': Equal duration directly preceding the current range.
    - 'previous_year': Same month/days in the previous year.
    """
    delta_days = (end_date - start_date).days + 1
    if mode == 'previous_year':
        try:
            prev_start = start_date.replace(year=start_date.year - 1)
            prev_end = end_date.replace(year=end_date.year - 1)
        except ValueError: # Leap day handling
            prev_start = start_date - datetime.timedelta(days=365)
            prev_end = end_date - datetime.timedelta(days=365)
        return (prev_start, prev_end)
    else:
        prev_end = start_date - datetime.timedelta(days=1)
        prev_start = prev_end - datetime.timedelta(days=delta_days - 1)
        return (prev_start, prev_end)


def build_loan_q_filter(filters: Dict[str, Any]) -> Q:
    """
    Translates raw filter dictionary or AST into a Django Q object for Loan querysets.
    """
    q = Q(is_archived=False)

    if not filters:
        return q

    # 1. Direction Filter
    direction = str(filters.get('direction', '')).lower().strip()
    if direction in ['lent', 'lending']:
        q &= (Q(direction='lent') | Q(direction='LENDING'))
    elif direction in ['borrowed', 'borrowing']:
        q &= (Q(direction='borrowed') | Q(direction='BORROWING'))

    # 2. Currency Filter
    currency = filters.get('currency')
    if currency and currency.upper() != 'ALL':
        if isinstance(currency, list):
            q &= Q(currency__in=[c.upper() for c in currency])
        else:
            q &= Q(currency=currency.upper().strip())

    # 3. Person / Counterparty Filter
    person_id = filters.get('person') or filters.get('person_id')
    if person_id and str(person_id).lower() != 'all':
        q &= (Q(person__id=person_id) | Q(person__name__icontains=str(person_id)))

    # 4. Status Filter
    status_val = filters.get('status')
    if status_val and status_val.upper() != 'ALL':
        if isinstance(status_val, list):
            q &= Q(status__in=[s.upper() for s in status_val])
        else:
            q &= Q(status=status_val.upper().strip())

    # 5. Overdue Flag Filter
    is_overdue = filters.get('is_overdue')
    today = timezone.localdate()
    if is_overdue is True or str(is_overdue).lower() == 'true':
        q &= Q(status__in=['OPEN', 'PARTIALLY_PAID'], due_date__lt=today)
    elif is_overdue is False or str(is_overdue).lower() == 'false':
        q &= Q(due_date__gte=today) | Q(due_date__isnull=True)

    # 6. Date Given Preset / Range
    date_preset = filters.get('date_range') or filters.get('date_preset')
    custom_start = filters.get('start_date') or filters.get('date_from')
    custom_end = filters.get('end_date') or filters.get('date_to')
    start_d, end_d = get_date_range_bounds(date_preset, custom_start, custom_end)
    
    if start_d:
        q &= Q(date_given__gte=start_d)
    if end_d:
        q &= Q(date_given__lte=end_d)

    # 7. Due Date Bounds
    due_from = filters.get('due_date_from')
    due_to = filters.get('due_date_to')
    if due_from:
        q &= Q(due_date__gte=datetime.date.fromisoformat(due_from))
    if due_to:
        q &= Q(due_date__lte=datetime.date.fromisoformat(due_to))

    # 8. Amount Range Filter
    min_amount = filters.get('min_amount')
    max_amount = filters.get('max_amount')
    if min_amount:
        q &= Q(principal_amount__gte=Decimal(str(min_amount)))
    if max_amount:
        q &= Q(principal_amount__lte=Decimal(str(max_amount)))

    # 9. Search Text (Reference, Person Name, Purpose, Notes)
    search = filters.get('search')
    if search:
        s = str(search).strip()
        q &= (
            Q(loan_reference__icontains=s) |
            Q(person__name__icontains=s) |
            Q(purpose__icontains=s) |
            Q(notes__icontains=s)
        )

    # 10. AST Tree Filter Support
    ast_rules = filters.get('rules')
    if isinstance(ast_rules, list) and ast_rules:
        condition = str(filters.get('condition', 'AND')).upper()
        ast_q = Q()
        for rule in ast_rules:
            field = rule.get('field')
            operator = rule.get('operator', 'eq')
            val = rule.get('value')
            if not field or val is None:
                continue

            sub_q = _build_single_ast_q(field, operator, val)
            if condition == 'OR':
                ast_q |= sub_q
            else:
                ast_q &= sub_q
        q &= ast_q

    return q


def _build_single_ast_q(field: str, operator: str, value: Any) -> Q:
    """Helper to convert a single AST rule to a Q expression."""
    f_map = {
        'direction': 'direction',
        'currency': 'currency',
        'person': 'person__name',
        'person_name': 'person__name',
        'status': 'status',
        'purpose': 'purpose',
        'amount': 'principal_amount',
        'principal_amount': 'principal_amount',
        'date_given': 'date_given',
        'due_date': 'due_date',
    }
    target_field = f_map.get(field, field)
    op = str(operator).lower()

    if op in ['eq', '=']:
        return Q(**{target_field: value})
    elif op in ['neq', '!=']:
        return ~Q(**{target_field: value})
    elif op in ['gt', '>']:
        return Q(**{f"{target_field}__gt": value})
    elif op in ['gte', '>=']:
        return Q(**{f"{target_field}__gte": value})
    elif op in ['lt', '<']:
        return Q(**{f"{target_field}__lt": value})
    elif op in ['lte', '<=']:
        return Q(**{f"{target_field}__lte": value})
    elif op in ['contains', 'like']:
        return Q(**{f"{target_field}__icontains": value})
    elif op == 'in':
        val_list = value if isinstance(value, list) else [v.strip() for v in str(value).split(',')]
        return Q(**{f"{target_field}__in": val_list})
    elif op == 'between' and isinstance(value, (list, tuple)) and len(value) == 2:
        return Q(**{f"{target_field}__range": (value[0], value[1])})

    return Q(**{target_field: value})
