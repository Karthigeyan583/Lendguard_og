import React, { useState } from 'react';
import { X, Users, Plus, AlertCircle, Building, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { GLOBAL_COUNTRY_PHONE_CONFIG } from '../utils/countries';
import { COUNTRY_BANK_MANDATES, createDefaultBankAccount, validateBankAccount } from '../utils/bankValidation';

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
  
  // Bank accounts state: Minimum 1 mandatory, Max 3
  const [bankAccounts, setBankAccounts] = useState([
    createDefaultBankAccount('IN', true)
  ]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentCountryConfig = GLOBAL_COUNTRY_PHONE_CONFIG.find(c => c.code === countryCode) || GLOBAL_COUNTRY_PHONE_CONFIG[0];

  const handleMobileChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const maxDigits = currentCountryConfig.digits || 10;
    const trimmed = rawDigits.slice(0, maxDigits);
    setMobileDigits(trimmed);
  };

  const handleCountryCodeChange = (e) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    const newConfig = GLOBAL_COUNTRY_PHONE_CONFIG.find(c => c.code === newCode) || GLOBAL_COUNTRY_PHONE_CONFIG[0];
    setMobileDigits(prev => prev.slice(0, newConfig.digits));
  };

  // Bank Account Management Handlers
  const handleAddBankAccount = () => {
    if (bankAccounts.length >= 3) return;
    setBankAccounts(prev => [
      ...prev,
      createDefaultBankAccount('IN', false)
    ]);
  };

  const handleRemoveBankAccount = (indexToRemove) => {
    if (bankAccounts.length <= 1) return; // Keep at least 1 mandatory
    setBankAccounts(prev => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      // Ensure at least one account is marked primary
      if (!filtered.some(acc => acc.is_primary) && filtered.length > 0) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  const handleSetPrimaryAccount = (indexToPrimary) => {
    setBankAccounts(prev => prev.map((acc, idx) => ({
      ...acc,
      is_primary: idx === indexToPrimary
    })));
  };

  const handleAccountFieldChange = (index, field, value) => {
    setBankAccounts(prev => prev.map((acc, idx) => {
      if (idx !== index) return acc;
      
      const updated = { ...acc, [field]: value };
      // If country changed, re-initialize country specific fields
      if (field === 'country') {
        const mandate = COUNTRY_BANK_MANDATES.find(m => m.code === value) || COUNTRY_BANK_MANDATES[0];
        return {
          ...createDefaultBankAccount(value, acc.is_primary),
          account_holder_name: acc.account_holder_name || `${formData.firstName} ${formData.lastName}`.trim(),
          bank_name: ''
        };
      }
      return updated;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim()) {
      setError('Please enter contact first name.');
      return;
    }

    if (!formData.lastName.trim()) {
      setError('Please enter contact last name.');
      return;
    }

    if (!mobileDigits.trim()) {
      setError(`Please enter contact mobile number.`);
      return;
    }

    if (mobileDigits.length < (currentCountryConfig.digits - 2)) {
      setError(`Please enter a valid ${currentCountryConfig.digits}-digit mobile number for ${currentCountryConfig.name}.`);
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter contact email address.');
      return;
    }

    // Validate Bank Accounts (Mandatory min 1, max 3)
    if (!bankAccounts || bankAccounts.length === 0) {
      setError('At least 1 bank account is mandatory as per banking mandates.');
      return;
    }

    if (bankAccounts.length > 3) {
      setError('A maximum of 3 bank accounts is allowed per contact.');
      return;
    }

    for (let i = 0; i < bankAccounts.length; i++) {
      const acc = bankAccounts[i];
      const validation = validateBankAccount(acc);
      if (!validation.isValid) {
        const firstErrMsg = Object.values(validation.errors)[0];
        const mandate = COUNTRY_BANK_MANDATES.find(m => m.code === acc.country) || COUNTRY_BANK_MANDATES[0];
        setError(`Bank Account #${i + 1} (${mandate.name}): ${firstErrMsg}`);
        return;
      }
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
        mobile: formattedMobile,
        bank_accounts: bankAccounts
      });
      setFormData({ firstName: '', lastName: '', relationship: 'friend', email: '', tags: '', notes: '' });
      setMobileDigits('');
      setBankAccounts([createDefaultBankAccount('IN', true)]);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add contact.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 760, maxHeight: '92vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-card)',
          zIndex: 10
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Add Borrower / Contact</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Add contact profile and compliant banking details (Max 3 accounts)
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

          {/* Contact Information Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
            <Users size={16} color="var(--accent-indigo)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Contact Identity & Reach
            </span>
          </div>

          {/* First Name & Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                First Name <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul"
                className="form-input"
                value={formData.firstName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, firstName: val }));
                  // Auto-fill beneficiary name if blank
                  setBankAccounts(prev => prev.map(acc => (!acc.account_holder_name || acc.account_holder_name.trim() === `${formData.firstName} ${formData.lastName}`.trim()) ? { ...acc, account_holder_name: `${val} ${formData.lastName}`.trim() } : acc));
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Last Name <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sharma"
                className="form-input"
                value={formData.lastName}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, lastName: val }));
                  setBankAccounts(prev => prev.map(acc => (!acc.account_holder_name || acc.account_holder_name.trim() === `${formData.firstName} ${formData.lastName}`.trim()) ? { ...acc, account_holder_name: `${formData.firstName} ${val}`.trim() } : acc));
                }}
              />
            </div>
          </div>

          {/* Relationship & Mobile */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
            <div className="form-group">
              <label className="form-label">
                Relationship <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>*</span>
              </label>
              <select
                className="form-select"
                required
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
                <label className="form-label" style={{ margin: 0 }}>
                  Mobile Number <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>*</span>
                </label>
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
                  required
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
              <label className="form-label">
                Email Address <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>*</span>
              </label>
              <input
                type="email"
                required
                placeholder="rahul@example.com"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tags (Optional, Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. work, emergency, close_friend"
                className="form-input"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>
          </div>

          {/* Bank Accounts Section (Country Mandates, Min 1, Max 3) */}
          <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={16} color="var(--accent-indigo)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  2. Bank Accounts & Settlement Details <span style={{ color: 'var(--accent-rose)', fontWeight: 800 }}>*</span>
                </span>
                <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-indigo)' }}>
                  {bankAccounts.length} / 3 Accounts
                </span>
              </div>

              {bankAccounts.length < 3 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                  onClick={handleAddBankAccount}
                >
                  <Plus size={13} />
                  <span>Add Another Account</span>
                </button>
              )}
            </div>

            {/* Bank Account Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {bankAccounts.map((account, index) => {
                const mandate = COUNTRY_BANK_MANDATES.find(m => m.code === account.country) || COUNTRY_BANK_MANDATES[0];

                return (
                  <div
                    key={index}
                    style={{
                      background: 'var(--inner-card-bg)',
                      border: account.is_primary ? '1.5px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1.1rem',
                      position: 'relative'
                    }}
                  >
                    {/* Card Top Row: Account Badge, Primary Selector, Remove Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          Account #{index + 1} {mandate.flag}
                        </span>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.75rem', color: account.is_primary ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                          <input
                            type="radio"
                            name="primary_account_radio"
                            checked={account.is_primary}
                            onChange={() => handleSetPrimaryAccount(index)}
                            style={{ accentColor: 'var(--accent-emerald)', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: account.is_primary ? 700 : 500 }}>
                            {account.is_primary ? 'Primary Disbursement Account' : 'Set as Primary'}
                          </span>
                        </label>
                      </div>

                      {bankAccounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBankAccount(index)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-rose)',
                            cursor: 'pointer',
                            padding: '0.2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.72rem'
                          }}
                          title="Remove this bank account"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {/* Country Selector */}
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem' }}>
                        Country / Jurisdiction Mandate <span style={{ color: 'var(--accent-rose)' }}>*</span>
                      </label>
                      <select
                        className="form-select"
                        value={account.country}
                        onChange={(e) => handleAccountFieldChange(index, 'country', e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {COUNTRY_BANK_MANDATES.map(m => (
                          <option key={m.code} value={m.code}>
                            {m.flag} {m.name} ({m.currency})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dynamic Mandate Fields */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {mandate.fields.map(f => (
                        <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.72rem' }}>
                            {f.label} {f.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                          </label>
                          {f.type === 'select' ? (
                            <select
                              className="form-select"
                              value={account[f.key] || f.options[0].value}
                              onChange={(e) => handleAccountFieldChange(index, f.key, e.target.value)}
                              style={{ fontSize: '0.8rem' }}
                            >
                              {f.options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={f.type || 'text'}
                              required={f.required}
                              maxLength={f.maxLength}
                              placeholder={f.placeholder}
                              className="form-input"
                              value={account[f.key] || ''}
                              onChange={(e) => {
                                const val = f.uppercase ? e.target.value.toUpperCase() : e.target.value;
                                handleAccountFieldChange(index, f.key, val);
                              }}
                              style={{ fontSize: '0.8rem' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Private Notes */}
          <div className="form-group">
            <label className="form-label">Private Contact Notes</label>
            <textarea
              rows={2}
              placeholder="Private remarks or lending background..."
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
              <span>{submitting ? 'Saving Contact & Bank Details...' : 'Save Contact'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
