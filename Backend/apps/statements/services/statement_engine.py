import json
import hashlib
from django.utils import timezone
from apps.loans.services.balance_engine import calculate_loan_balance
from apps.loans.services.status_engine import evaluate_loan_status
from apps.statements.models import DigitalStatement


def generate_digital_statement(loan, user=None) -> DigitalStatement:
    """
    Statement & IOU Engine:
    Constructs a canonical immutable data snapshot and computes a verifiable SHA-256 cryptographic hash seal.
    """
    balance = calculate_loan_balance(loan)
    status_info = evaluate_loan_status(loan)
    now_iso = timezone.now().isoformat()

    # Repayment history list
    payments_list = []
    for p in loan.payments.filter(is_voided=False).order_by('payment_date'):
        payments_list.append({
            'payment_id': p.id,
            'amount': str(p.amount),
            'payment_date': str(p.payment_date),
            'payment_method': p.payment_method,
            'reference_number': p.reference_number or ''
        })

    # Canonical snapshot dictionary
    is_borrowing = (loan.direction == 'borrowed')

    user_info = {
        'username': loan.created_by.username,
        'email': loan.created_by.email,
        'full_name': f"{loan.created_by.first_name} {loan.created_by.last_name}".strip() or loan.created_by.username
    }
    person_info = {
        'person_id': loan.person.id,
        'name': loan.person.name,
        'mobile': loan.person.mobile,
        'email': loan.person.email,
        'relationship': loan.person.relationship
    }

    # Direction-aware party assignments
    lender_party = person_info if is_borrowing else user_info
    borrower_party = user_info if is_borrowing else person_info

    # Canonical snapshot dictionary
    canonical_snapshot = {
        'platform': 'LendGuard Personal Lending & Ledger Platform',
        'version': '2.0',
        'statement_type': 'OFFICIAL_DIGITAL_BORROWING_STATEMENT' if is_borrowing else 'OFFICIAL_DIGITAL_STATEMENT_AND_IOU',
        'direction': loan.direction,
        'generated_at': now_iso,
        'lender': lender_party,
        'borrower': borrower_party,
        'loan_details': {
            'loan_id': loan.id,
            'loan_reference': loan.loan_reference,
            'direction': loan.direction,
            'direction_label': 'Money Borrowed (Payable)' if is_borrowing else 'Money Lent (Receivable)',
            'principal_amount': str(loan.principal_amount),
            'currency': loan.currency,
            'date_given': str(loan.date_given),
            'due_date': str(loan.due_date) if loan.due_date else None,
            'interest_model': loan.interest_model,
            'interest_rate': str(loan.interest_rate),
            'purpose': loan.purpose or ''
        },
        'financial_summary': {
            'principal': str(balance['principal']),
            'interest_charges': str(balance['interest_or_fee']),
            'total_payable': str(balance['total_payable']),
            'total_repaid': str(balance['total_repaid']),
            'outstanding_balance': str(balance['outstanding']),
            'financial_status': status_info['financial_status'],
            'time_status': status_info['time_status']
        },
        'repayment_ledger': payments_list
    }

    # Deterministic JSON string (sorted keys, compact separators)
    canonical_json_str = json.dumps(canonical_snapshot, sort_keys=True, separators=(',', ':'))
    sha256_hash = hashlib.sha256(canonical_json_str.encode('utf-8')).hexdigest()

    # Generate sequential statement number
    count = DigitalStatement.objects.filter(loan=loan).count() + 1
    stmt_number = f"STMT-{loan.loan_reference}-{count:02d}"

    statement = DigitalStatement.objects.create(
        loan=loan,
        statement_number=stmt_number,
        canonical_data_snapshot=canonical_snapshot,
        sha256_hash=sha256_hash,
        generated_by=user or loan.created_by
    )

    return statement
