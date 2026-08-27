import React, { useState } from 'react';
import { X, Users, Plus, AlertCircle } from 'lucide-react';
import { GLOBAL_COUNTRY_PHONE_CONFIG } from '../utils/countries';

export const AddPersonModal = ({ isOpen, onClose, onPersonAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    relationship: 'friend',
    email: '',
    tags: '',
    notes: ''
  });
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileDigits, setMobileDigits] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentCountryConfig = GLOBAL_COUNTRY_PHONE_CONFIG.find(c => c.code === countryCode) || GLOBAL_COUNTRY_PHONE_CONFIG[0];

  const handleMobileChange = (e) => {
    // Strictly strip non-digit characters (no alphabets, no symbols, no spaces)
    const rawDigits = e.target.value.replace(/\D/g, '');
    const maxDigits = currentCountryConfig.digits || 10;
    const trimmed = rawDigits.slice(0, maxDigits);
    setMobileDigits(trimmed);
  };

  const handleCountryCodeChange = (e) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    const newConfig = COUNTRY_PHONE_CONFIG.find(c => c.code === newCode) || COUNTRY_PHONE_CONFIG[0];
    // Re-truncate existing digits to new country length
    setMobileDigits(prev => prev.slice(0, newConfig.digits));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim()) {
      setError('Please enter contact first name.');
      return;
    }

    if (mobileDigits && mobileDigits.length < (currentCountryConfig.digits - 2)) {
      setError(`Please enter a valid ${currentCountryConfig.digits}-digit mobile number for ${currentCountryConfig.name}.`);
      return;
    }

    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    const formattedMobile = mobileDigits ? (countryCode ? `${countryCode} ${mobileDigits}` : mobileDigits) : '';

    setSubmitting(true);
    try {
      await onPersonAdded({
        ...formData,
        name: fullName,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        mobile: formattedMobile
      });
      setFormData({ firstName: '', lastName: '', relationship: 'friend', email: '', tags: '', notes: '' });
      setMobileDigits('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add contact.');
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
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add Borrower / Contact</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Add a person to track their loans and repayment exposure
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
              marginBottom: '1.25rem'
            }}>
              {error}
            </div>
          )}

          {/* First Name & Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul"
                className="form-input"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                placeholder="e.g. Sharma"
                className="form-input"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          {/* Relationship & Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
            <div className="form-group">
              <label className="form-label">Relationship</label>
              <select
                className="form-select"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              >
                <option value="friend">Friend</option>
                <option value="family">Family</option>
                <option value="colleague">Colleague</option>
                <option value="business">Business / Client</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Mobile Number</label>
                {mobileDigits && (
                  <span style={{ fontSize: '0.68rem', color: mobileDigits.length === currentCountryConfig.digits ? 'var(--accent-emerald)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {mobileDigits.length} / {currentCountryConfig.digits}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <select
                  className="form-select"
                  style={{ width: '130px', flexShrink: 0, paddingLeft: '0.5rem', paddingRight: '1.25rem', fontSize: '0.78rem' }}
                  value={countryCode}
                  onChange={handleCountryCodeChange}
                >
                  {GLOBAL_COUNTRY_PHONE_CONFIG.map(c => (
                    <option key={c.country + c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={currentCountryConfig.placeholder}
                  className="form-input"
                  value={mobileDigits}
                  onChange={handleMobileChange}
                  maxLength={currentCountryConfig.digits}
                />
              </div>
            </div>
          </div>

          {/* Email & Tags */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="rahul@example.com"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. work, emergency, close_friend"
                className="form-input"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          {/* Private Notes */}
          <div className="form-group">
            <label className="form-label">Private Contact Notes</label>
            <textarea
              rows={2}
              placeholder="Private remarks..."
              className="form-textarea"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Plus size={16} />
              <span>{submitting ? 'Adding Contact...' : 'Save Contact'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
