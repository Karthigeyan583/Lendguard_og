import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Tuple, Optional


# Canonical Reference Parity Table (Base: INR values per unit of currency)
# 1 EUR = 98.00 INR | 1 USD = 90.00 INR | 1 GBP = 115.00 INR
INR_PER_UNIT = {
    'INR': Decimal('1.000000'),
    'USD': Decimal('90.000000'),
    'EUR': Decimal('98.000000'),
    'GBP': Decimal('115.000000'),
    'CAD': Decimal('65.000000'),
    'AUD': Decimal('58.000000'),
    'AED': Decimal('24.500000'),
    'SGD': Decimal('68.000000'),
}


def get_exchange_rate(from_currency: str, to_currency: str, date: Optional[datetime.date] = None) -> Decimal:
    """
    Returns the exact exchange rate R such that:
        Target_Amount = Source_Amount * R
    
    Example:
        get_exchange_rate('INR', 'EUR') -> Decimal('0.0102040816...')
        get_exchange_rate('EUR', 'INR') -> Decimal('98.000000')
        get_exchange_rate('USD', 'EUR') -> Decimal('0.9183673469...')
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
