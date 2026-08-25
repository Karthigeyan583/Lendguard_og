import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ArrowDownLeft, AlertCircle } from 'lucide-react';

export const RecordPaymentModal = ({ isOpen, onClose, loan, onPaymentRecorded }) => {
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('upi_bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      setError(`Overpayment Alert: Entered amount (₹${numAmount.toLocaleString()}) exceeds the outstanding balance (₹${outstanding.toLocaleString()}).`);
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Record Repayment</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Loan #{loan.loan_reference} • Borrower: {loan.person_name}
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
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Total Principal</span>
              <strong style={{ fontSize: '0.95rem' }}>₹{Number(loan.principal_amount).toLocaleString()} {loan.currency}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Current Outstanding</span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--accent-cyan)' }}>₹{outstanding.toLocaleString()} {loan.currency}</strong>
            </div>
          </div>

          {/* Amount & Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Repayment Amount (₹)</label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                className="form-input"
                placeholder="Enter repayment amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Date</label>
              <input
                type="date"
                required
                className="form-input"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
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
            <label className="form-label">Reference ID / Cheque No / Notes</label>
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
              placeholder="e.g. Received partial cash installment at office"
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
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <ArrowDownLeft size={16} />
              <span>{submitting ? 'Recording Repayment...' : `Confirm Repayment (₹${Number(amount || 0).toLocaleString()})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
