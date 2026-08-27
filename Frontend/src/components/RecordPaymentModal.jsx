import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';

export const RecordPaymentModal = ({ isOpen, onClose, loan, onPaymentRecorded }) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('upi_bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currencySymbol = getCurrencySymbol(loan?.currency);
  const outstanding = Number(loan?.balance?.outstanding || (Number(loan?.principal_amount || 0) - Number(loan?.balance?.total_repaid || 0)));

  useEffect(() => {
    if (loan) {
      setAmount(String(outstanding || ''));
      setReferenceNumber('');
      setNotes('');
      setError('');
    }
  }, [loan, isOpen]);

  if (!isOpen || !loan) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid repayment amount greater than 0.');
      return;
    }

    if (numAmount > outstanding) {
      setError(`Overpayment Alert: Entered amount (${currencySymbol}${numAmount.toLocaleString()}) exceeds the outstanding balance (${currencySymbol}${outstanding.toLocaleString()}).`);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (paymentDate > today) {
      setError('Repayment date cannot be in the future. Please select today or a past date.');
      return;
    }

    if (loan?.date_given && paymentDate && paymentDate < loan.date_given) {
      setError(`Repayment date (${paymentDate}) cannot be earlier than the loan origination / disbursement date (${loan.date_given}).`);
      return;
    }

    setSubmitting(true);
    try {
      await onPaymentRecorded({
        loan: loan.id,
        amount: numAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes: notes
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record repayment.');
    } finally {
      setSubmitting(false);
    }
  };

  const isBorrowing = loan?.direction === 'borrowed';
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              {isBorrowing ? 'Record Debt Repayment Made' : 'Record Repayment Received'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              #{loan.loan_reference} • {isBorrowing ? `Paid to Lender: ${loan.person_name}` : `Received from Borrower: ${loan.person_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Balance Overview Pill */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                {isBorrowing ? 'Original Borrowed Amount' : 'Original Lent Amount'}
              </span>
              <strong style={{ fontSize: '0.95rem' }}>{currencySymbol}{Number(loan.principal_amount).toLocaleString()} {loan.currency}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                {isBorrowing ? 'Remaining Payable Liability' : 'Current Outstanding Receivable'}
              </span>
              <strong style={{ fontSize: '1.05rem', color: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-cyan)' }}>
                {currencySymbol}{outstanding.toLocaleString()} {loan.currency}
              </strong>
            </div>
          </div>

          {/* Amount & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                {isBorrowing ? 'Amount Paid' : 'Repayment Amount'} ({currencySymbol.trim() || loan.currency})
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                className="form-input"
                placeholder={`Enter repayment amount in ${loan.currency}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Transfer / Payment Date</label>
              <input
                type="date"
                required
                min={loan?.date_given}
                max={todayStr}
                className="form-input"
                value={paymentDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  if (newDate > todayStr) {
                    setError('Repayment date cannot be in the future. Please select today or a past date.');
                  } else if (loan?.date_given && newDate && newDate < loan.date_given) {
                    setError(`Repayment date cannot be earlier than the loan origination date (${loan.date_given}).`);
                  } else {
                    setError('');
                  }
                  setPaymentDate(newDate);
                }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Must be between {loan?.date_given || 'origination date'} and today ({todayStr})
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="upi_bank_transfer">UPI / Direct Bank Transfer / NEFT / IMPS</option>
              <option value="cash">Cash in Hand</option>
              <option value="card">Debit / Credit Card</option>
              <option value="check">Cheque</option>
              <option value="other">Other Transfer Method</option>
            </select>
          </div>

          {/* Reference / Transaction ID */}
          <div className="form-group">
            <label className="form-label">Reference ID / Cheque No / UTR</label>
            <input
              type="text"
              placeholder="e.g. UPI/2026/982173 or Cheque #001248"
              className="form-input"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          {/* Audit Notes */}
          <div className="form-group">
            <label className="form-label">Remarks / Confirmation Note</label>
            <input
              type="text"
              placeholder={isBorrowing ? "e.g. Cleared monthly repayment installment via netbanking" : "e.g. Received partial cash installment at office"}
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                background: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
                borderColor: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)'
              }}
              disabled={submitting}
            >
              <ArrowDownLeft size={16} />
              <span>{submitting ? 'Recording Repayment...' : `Confirm Payment (${currencySymbol}${Number(amount || 0).toLocaleString()})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
