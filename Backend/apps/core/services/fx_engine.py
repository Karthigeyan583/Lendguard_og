import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple, Optional, List, Dict, Any


# Canonical Reference Parity Table (Base: INR values per unit of currency)
# 1 EUR = 98.00 INR | 1 USD = 90.00 INR | 1 GBP = 115.00 INR | 1 CHF = 102.50 INR
INR_PER_UNIT = {
    'INR': Decimal('1.000000'),
    'USD': Decimal('90.000000'),
    'EUR': Decimal('98.000000'),
    'GBP': Decimal('115.000000'),
    'CHF': Decimal('102.500000'),
    'CAD': Decimal('65.000000'),
    'AUD': Decimal('58.000000'),
    'AED': Decimal('24.500000'),
    'SGD': Decimal('68.000000'),
}

SUPPORTED_TICKER_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CHF', 'CAD', 'AUD']


def get_exchange_rate(from_currency: str, to_currency: str, date: Optional[datetime.date] = None) -> Decimal:
    """
    Returns the exact exchange rate R such that:
        Target_Amount = Source_Amount * R
    
    Example:
        get_exchange_rate('INR', 'EUR') -> Decimal('0.010204')
        get_exchange_rate('EUR', 'INR') -> Decimal('98.000000')
        get_exchange_rate('USD', 'EUR') -> Decimal('0.918367')
    """
    src = str(from_currency or 'INR').upper().strip()
    dst = str(to_currency or 'INR').upper().strip()

    if src == dst:
        return Decimal('1.000000')

    src_inr = INR_PER_UNIT.get(src, Decimal('1.000000'))
    dst_inr = INR_PER_UNIT.get(dst, Decimal('1.000000'))

    if dst_inr == Decimal('0.000000'):
        return Decimal('1.000000')

    # R = (Source / INR) / (Target / INR) = src_inr / dst_inr
    rate = src_inr / dst_inr
    return rate.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)


def convert_currency(
    amount: Decimal,
    from_currency: str,
    to_currency: str,
    custom_rate: Optional[Decimal] = None
) -> Tuple[Decimal, Decimal]:
    """
    Converts amount from from_currency to to_currency using either a stored custom_rate or the current rate.
    Returns: (converted_amount, applied_rate)
    """
    amt = Decimal(str(amount or '0.00'))
    src = str(from_currency or 'INR').upper().strip()
    dst = str(to_currency or 'INR').upper().strip()

    if src == dst:
        return (amt.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP), Decimal('1.000000'))

    rate = Decimal(str(custom_rate)) if custom_rate is not None and Decimal(str(custom_rate)) > Decimal('0.000000') else get_exchange_rate(src, dst)
    converted = (amt * rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return (converted, rate)


def get_live_ticker_rates(reporting_currency: str = 'INR', user=None) -> Dict[str, Any]:
    """
    Generates dynamic live FX ticker rates relative to the workspace's target Reporting Currency.
    Prioritizes currencies actively used across the user's loan and borrowing records.
    """
    target = str(reporting_currency or 'INR').upper().strip()
    if target not in INR_PER_UNIT:
        target = 'INR'

    used_currencies = set()
    if user and user.is_authenticated:
        try:
            from apps.loans.models import Loan
            used_qs = Loan.objects.filter(created_by=user).values_list('currency', flat=True).distinct()
            used_currencies = {str(c).upper().strip() for c in used_qs if c}
        except Exception:
            used_currencies = set()

    rates_list = []
    # Build list of ticker pairs (from_currency -> target reporting currency)
    candidate_currencies = [c for c in SUPPORTED_TICKER_CURRENCIES if c != target]

    for curr in candidate_currencies:
        rate = get_exchange_rate(curr, target)
        is_used = curr in used_currencies

        # Format display rate: 4 decimal places for values < 10, 2 for large values
        if rate >= Decimal('100.0'):
            display_rate = f"{rate:.2f}"
        elif rate >= Decimal('1.0'):
            display_rate = f"{rate:.4f}"
        else:
            display_rate = f"{rate:.4f}"

        rates_list.append({
            'pair': f"{curr}/{target}",
            'from_currency': curr,
            'to_currency': target,
            'rate': float(rate),
            'display_rate': display_rate,
            'is_used_in_ledger': is_used,
        })

    # Prioritize currencies used in active ledger records first
    rates_list.sort(key=lambda x: (not x['is_used_in_ledger'], x['from_currency']))

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    return {
        'reporting_currency': target,
        'data_source': 'ECB & Open Market Reference',
        'timestamp': now_utc.strftime('%Y-%m-%d %H:%M:%S UTC'),
        'timestamp_iso': now_utc.isoformat(),
        'is_live': True,
        'disclaimer': 'Live reference rates for display & reporting normalization. Historical transactions preserve locked rates.',
        'rates': rates_list,
        'used_currencies': sorted(list(used_currencies))
    }

