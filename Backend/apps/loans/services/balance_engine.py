from decimal import Decimal, ROUND_HALF_UP


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


def calculate_loan_balance(loan) -> dict:
    """
    Authoritative Balance Engine:
    Outstanding = Principal + applicable charges/interest − allocated non-voided repayments.
    """
    principal = Decimal(str(loan.principal_amount))
    interest_or_fee = calculate_interest_or_fees(loan)
    total_payable = principal + interest_or_fee

    valid_payments = loan.payments.filter(is_voided=False)
    total_repaid = Decimal('0.00')
    for p in valid_payments:
        total_repaid += Decimal(str(p.amount))

    outstanding = total_payable - total_repaid
    if outstanding < Decimal('0.00'):
        outstanding = Decimal('0.00')

    return {
        'principal': principal,
        'interest_or_fee': interest_or_fee,
        'total_payable': total_payable,
        'total_repaid': total_repaid,
        'outstanding': outstanding,
        'is_fully_paid': outstanding == Decimal('0.00') and total_repaid >= total_payable,
        'payment_count': valid_payments.count()
    }
