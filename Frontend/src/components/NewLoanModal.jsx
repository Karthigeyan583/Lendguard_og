import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, Plus, Users, Calendar, AlertCircle } from 'lucide-react';

export const NewLoanModal = ({ isOpen, onClose, people = [], onLoanCreated, onOpenAddPerson, initialData }) => {
  const [formData, setFormData] = useState({
    person: '',
    direction: 'lent',
    principal_amount: '25000',
    currency: localStorage.getItem('lendguard_currency') || 'INR',
    date_given: new Date().toISOString().split('T')[0],
    due_date: '',
    interest_model: 'none',
    interest_rate: '0.00',
    fixed_fee_amount: '0.00',
    purpose: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (people.length > 0 && !formData.person) {
      setFormData(prev => ({ ...prev, person: String(people[0].id) }));
    }
  }, [people]);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        person: initialData.person ? String(initialData.person) : prev.person,
        principal_amount: String(initialData.principal_amount || initialData.amount || prev.principal_amount),
        due_date: initialData.due_date || prev.due_date,
        currency: initialData.currency || prev.currency || localStorage.getItem('lendguard_currency') || 'INR'
      }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.person) {
      setError('Please select or create a borrower contact.');
      return;
    }

    const principal = parseFloat(formData.principal_amount);
    if (!principal || principal <= 0) {
      setError('Please enter a valid loan amount greater than 0.');
      return;
    }

    if (!formData.purpose || !formData.purpose.trim()) {
      setError('Purpose / Lending context is mandatory.');
      return;
    }

    if (formData.due_date && formData.date_given && formData.due_date < formData.date_given) {
      setError('Agreed due date cannot be earlier than the date the money was given.');
      return;
    }

    setSubmitting(true);
    try {
      await onLoanCreated({
        ...formData,
        person: parseInt(formData.person),
        principal_amount: principal,
        purpose: formData.purpose.trim(),
        interest_rate: parseFloat(formData.interest_rate || 0),
        fixed_fee_amount: parseFloat(formData.fixed_fee_amount || 0),
        due_date: formData.due_date || null
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create loan record.');
    } finally {
      setSubmitting(false);
    }
  };

  const isBorrowing = formData.direction === 'borrowed';

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
              {isBorrowing ? 'Record Money Borrowed' : 'Record Money Lent'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isBorrowing 
                ? 'Create a new payable liability entry in your financial ledger'
                : 'Create a new receivable entry in your authoritative lending ledger'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
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

          {/* Direction Switcher (Lending vs Borrowing) */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Transaction Direction <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              background: 'var(--inner-card-bg)',
              padding: '0.35rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'lent' })}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: !isBorrowing ? 'var(--accent-emerald)' : 'transparent',
                  color: !isBorrowing ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>🤝 Money I Lent</span>
                <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>(Receivable)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, direction: 'borrowed' })}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isBorrowing ? 'var(--accent-indigo)' : 'transparent',
                  color: isBorrowing ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>📥 Money I Borrowed</span>
                <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>(Payable)</span>
              </button>
            </div>
          </div>

          {/* Party / Contact Selector */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                {isBorrowing ? 'Lender (Contact)' : 'Borrower (Contact)'}
              </label>
              {people.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenAddPerson}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-emerald)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  + New Contact
                </button>
              )}
            </div>

            {people.length === 0 ? (
              <div 
                onClick={onOpenAddPerson}
                style={{ 
                  padding: '0.75rem 1rem', 
                  background: 'var(--inner-card-bg)', 
                  border: '1px dashed var(--border-subtle)', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '0.8rem', 
                  color: 'var(--text-muted)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <span>No contacts found in directory</span>
                <span style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.78rem' }}>
                  + Add Contact
                </span>
              </div>
            ) : (
              <select
                className="form-select"
                required
                value={formData.person}
                onChange={(e) => setFormData({ ...formData, person: e.target.value })}
              >
                <option value="">-- Select {isBorrowing ? 'Lender' : 'Borrower'} --</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.relationship}) {p.mobile ? `• ${p.mobile}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount & Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                Principal Amount <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                className="form-input"
                placeholder={isBorrowing ? "Amount borrowed (e.g. 25000)" : "Amount lent (e.g. 25000)"}
                value={formData.principal_amount}
                onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Currency <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <select
                className="form-select"
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (CA$)</option>
                <option value="AUD">AUD (AU$)</option>
                <option value="AED">AED (AED)</option>
                <option value="SGD">SGD (S$)</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                {isBorrowing ? 'Date Borrowed' : 'Date Disbursed'} <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                type="date"
                required
                className="form-input"
                value={formData.date_given}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    date_given: newDate,
                    due_date: (prev.due_date && prev.due_date < newDate) ? newDate : prev.due_date
                  }));
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Repayment Target Due Date
              </label>
              <input
                type="date"
                className="form-input"
                min={formData.date_given}
                value={formData.due_date}
                onChange={(e) => {
                  const newDueDate = e.target.value;
                  if (newDueDate && formData.date_given && newDueDate < formData.date_given) {
                    setError(`Repayment target due date cannot be earlier than the disbursement date (${formData.date_given}).`);
                  } else {
                    setError('');
                  }
                  setFormData({ ...formData, due_date: newDueDate });
                }}
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Must be on or after {isBorrowing ? 'borrowing date' : 'disbursement date'}
              </span>
            </div>
          </div>

          {/* Purpose */}
          <div className="form-group">
            <label className="form-label">
              Purpose / Financial Context <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder={isBorrowing ? "e.g. Bridge loan for invoice clearance" : "e.g. Emergency medical bridge, Home renovation"}
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Private Audit Notes</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Private lender notes, agreements, or repayment terms"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn ${isBorrowing ? 'btn-primary' : 'btn-primary'}`}
              style={{
                background: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
                borderColor: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
                padding: '0.6rem 1.4rem'
              }}
              disabled={submitting}
            >
              {submitting ? 'Recording...' : isBorrowing ? 'Record Money Borrowed' : 'Record Money Lent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
