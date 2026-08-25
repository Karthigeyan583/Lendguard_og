from decimal import Decimal, ROUND_HALF_UP
from apps.core.services.fx_engine import get_exchange_rate, convert_currency


def calculate_interest_or_fees(loan) -> Decimal:
    """
    Calculates applicable interest or fixed fee according to the loan's approved interest model.
    Decimal-safe financial arithmetic.
    """
    principal = Decimal(str(loan.principal_amount))
    model = loan.interest_model

    if model == 'none' or not model:
        return Decimal('0.00')

    elif model == 'fixed_fee':
        return Decimal(str(loan.fixed_fee_amount or '0.00'))

    elif model == 'simple_annual':
        rate = Decimal(str(loan.interest_rate or '0.00'))
        if rate <= 0 or not loan.date_given:
            return Decimal('0.00')
        # Day count calculation if due_date exists
        if loan.due_date and loan.due_date > loan.date_given:
            days = (loan.due_date - loan.date_given).days
            interest = (principal * (rate / Decimal('100.00')) * Decimal(days)) / Decimal('365.00')
            return interest.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return Decimal('0.00')

    elif model == 'monthly_rate':
        rate = Decimal(str(loan.interest_rate or '0.00'))
        if rate <= 0:
            return Decimal('0.00')
        if loan.due_date and loan.due_date > loan.date_given:
            days = (loan.due_date - loan.date_given).days
            months = Decimal(days) / Decimal('30.00')
            interest = (principal * (rate / Decimal('100.00')) * months)
            return interest.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return Decimal('0.00')

    return Decimal('0.00')


def calculate_loan_balance(loan, target_reporting_currency=None) -> dict:
    """
    Authoritative Multi-Currency Balance Engine:
    - Calculates transaction balances in original currency (retaining exact financial fidelity).
    - Calculates normalized reporting balances in the target/user's reporting currency via historical FX rates.
    """
    principal = Decimal(str(loan.principal_amount))
    currency = loan.currency or 'INR'
    interest_or_fee = calculate_interest_or_fees(loan)
    total_payable = principal + interest_or_fee

    valid_payments = loan.payments.filter(is_voided=False)
    total_repaid = Decimal('0.00')
    for p in valid_payments:
        total_repaid += Decimal(str(p.amount))

    outstanding = total_payable - total_repaid
    if outstanding < Decimal('0.00'):
        outstanding = Decimal('0.00')

    # Recovery % in original transaction currency (immune to FX fluctuations)
    recovery_rate = float(round((total_repaid / principal * Decimal('100.00')), 1)) if principal > Decimal('0.00') else 100.0

    # Reporting Currency Normalization
    reporting_currency = target_reporting_currency or getattr(loan, 'reporting_currency', 'INR') or 'INR'
    if getattr(loan, 'reporting_currency', None) == reporting_currency and getattr(loan, 'exchange_rate', None):
        fx_rate = Decimal(str(loan.exchange_rate))
    else:
        fx_rate = get_exchange_rate(currency, reporting_currency)

    reporting_principal = getattr(loan, 'reporting_principal_amount', None)
    if reporting_principal is None or reporting_principal == Decimal('0.00') or getattr(loan, 'reporting_currency', None) != reporting_currency:
        reporting_principal = (principal * fx_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    else:
        reporting_principal = Decimal(str(reporting_principal))

    reporting_total_repaid = Decimal('0.00')
    for p in valid_payments:
        if getattr(p, 'reporting_currency', None) == reporting_currency and getattr(p, 'reporting_amount', None):
            reporting_total_repaid += Decimal(str(p.reporting_amount))
        else:
            reporting_total_repaid += (Decimal(str(p.amount)) * fx_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    reporting_outstanding = (outstanding * fx_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    return {
        'principal': principal,
        'currency': currency,
        'interest_or_fee': interest_or_fee,
        'total_payable': total_payable,
        'total_repaid': total_repaid,
        'outstanding': outstanding,
        'recovery_rate': recovery_rate,
        'is_fully_paid': outstanding == Decimal('0.00') and total_repaid >= total_payable,
        'payment_count': valid_payments.count(),
        
        # Reporting Currency normalized values
        'reporting_currency': reporting_currency,
        'exchange_rate': fx_rate,
        'reporting_principal': reporting_principal,
        'reporting_total_repaid': reporting_total_repaid,
        'reporting_outstanding': reporting_outstanding
    }

