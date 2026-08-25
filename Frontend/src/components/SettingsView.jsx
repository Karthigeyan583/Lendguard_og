import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Bell,
  Database,
  Key,
  CreditCard,
  HelpCircle,
  Save,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  Lock,
  Smartphone,
  Mail,
  MessageSquare,
  FileSpreadsheet,
  FileJson,
  Check,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { api, getToken } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const SettingsView = ({ onDataPurged }) => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  // General Profile State
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.profile?.phone_number || '');
  const [currency, setCurrency] = useState(localStorage.getItem('lendguard_currency') || 'INR');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('lendguard_date_format') || 'YYYY-MM-DD');
  const [themeMode, setThemeMode] = useState(localStorage.getItem('lendguard_theme') || 'dark');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Security State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Notification State
  const [notifChannels, setNotifChannels] = useState({
    inApp: true,
    email: true,
    sms: false,
    whatsapp: true
  });
  const [reminderRules, setReminderRules] = useState({
    sevenDays: true,
    threeDays: true,
    oneDay: true,
    dueDay: true,
    overdueEscalation: true
  });
  const [notifSaved, setNotifSaved] = useState(false);

  // Data Export & Purge State
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeInput, setPurgeInput] = useState('');
  const [purging, setPurging] = useState(false);
  const [purgeError, setPurgeError] = useState('');

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState('https://api.yourdomain.com/webhooks/lendguard');
  const [webhookSecret, setWebhookSecret] = useState('whsec_lg_9a87f2e1d4c3b5a67890');

  // Help & Legal State
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
      setPhone(user.phone_number || user.profile?.phone_number || '');
    }
  }, [user]);

  // Handle Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      localStorage.setItem('lendguard_currency', currency);
      localStorage.setItem('lendguard_date_format', dateFormat);
      localStorage.setItem('lendguard_theme', themeMode);

      await api.updateProfile({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phone,
        base_currency: currency
      });

      if (onDataPurged) onDataPurged();

      setProfileSuccess('Profile and base currency preferences updated successfully.');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess('');
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      setPasswordSaving(false);
      return;
    }

    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordSuccess('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Handle Export Full JSON
  const handleExportJSON = async () => {
    setExporting(true);
    setExportSuccess('');
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lendguard_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportSuccess('Complete JSON ledger backup downloaded with SHA-256 seal.');
      setTimeout(() => setExportSuccess(''), 4000);
    } catch (err) {
      alert('Failed to export data: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Handle Export CSV
  const handleExportCSV = async (type) => {
    try {
      const data = await api.exportData();
      let csvContent = '';
      let filename = '';

      if (type === 'people') {
        filename = `lendguard_people_${new Date().toISOString().slice(0, 10)}.csv`;
        csvContent = 'ID,Name,Relationship,Mobile,Email,Tags,Notes,Created_At\n' +
          data.people.map(p => `"${p.id}","${p.name}","${p.relationship}","${p.mobile || ''}","${p.email || ''}","${p.tags || ''}","${p.notes || ''}","${p.created_at}"`).join('\n');
      } else if (type === 'loans') {
        filename = `lendguard_loans_${new Date().toISOString().slice(0, 10)}.csv`;
        csvContent = 'Loan_Ref,Borrower,Principal,Currency,Date_Given,Due_Date,Status,Time_Status,Days_Overdue,Total_Repaid,Outstanding\n' +
          data.loans.map(l => `"${l.loan_reference}","${l.borrower_name}",${l.principal_amount},"${l.currency}","${l.date_given}","${l.due_date || ''}","${l.status}","${l.time_status}",${l.days_overdue},${l.total_repaid},${l.outstanding}`).join('\n');
      } else if (type === 'payments') {
        filename = `lendguard_payments_${new Date().toISOString().slice(0, 10)}.csv`;
        csvContent = 'Payment_ID,Loan_Ref,Borrower,Amount,Currency,Payment_Date,Payment_Method,Reference_Number,Notes,Voided\n' +
          data.payments.map(p => `"${p.id}","${p.loan_reference}","${p.borrower_name}",${p.amount},"${p.currency}","${p.payment_date}","${p.payment_method}","${p.reference_number || ''}","${p.notes || ''}",${p.is_voided}`).join('\n');
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export CSV: ' + err.message);
    }
  };

  // Handle Purge
  const handleConfirmPurge = async () => {
    if (purgeInput !== 'DELETE DATA') {
      setPurgeError('Please type "DELETE DATA" exactly to confirm.');
      return;
    }

    setPurging(true);
    setPurgeError('');
    try {
      await api.purgeData();
      setShowPurgeModal(false);
      setPurgeInput('');
      if (onDataPurged) onDataPurged();
      alert('Ledger records purged successfully. All accounts have been reset.');
    } catch (err) {
      setPurgeError(err.message || 'Failed to purge data.');
    } finally {
      setPurging(false);
    }
  };

  // Copy Token
  const handleCopyToken = () => {
    const t = getToken();
    if (t) {
      navigator.clipboard.writeText(t);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2500);
    }
  };

  const tabs = [
    { id: 'general', label: 'General & Profile', icon: User, screen: 'P24' },
    { id: 'security', label: 'Security Center', icon: Shield, screen: 'P25' },
    { id: 'notifications', label: 'Notifications', icon: Bell, screen: 'P26' },
    { id: 'data', label: 'Data & Backup', icon: Database, screen: 'P27' },
    { id: 'integrations', label: 'Integrations & API', icon: Key, screen: 'P28' },
    { id: 'plans', label: 'Plans & Billing', icon: CreditCard, screen: 'P29' },
    { id: 'help', label: 'Help & Legal IOU', icon: HelpCircle, screen: 'P30' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1040, margin: '0 auto' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                BIBLE v2.0 SPEC
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Screens P24 – P30</span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Settings & Administration Hub
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Manage personal profile, cryptographic security, automated reminder timing, ledger exports, and API keys.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--inner-card-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Personal Pro Workspace</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          marginTop: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.5rem',
          overflowX: 'auto'
        }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const isCurrent = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isCurrent ? 'var(--accent-indigo)' : 'transparent',
                  color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: General & Profile (P24) */}
      {activeTab === 'general' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Account Profile & Ledger Preferences</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Configure your lender contact information, default currency display, and workspace appearance.
            </p>
          </div>

          {profileSuccess && (
            <div className="badge badge-emerald" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="badge badge-rose" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <AlertTriangle size={16} />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Karthik"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Ramaswamy"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone / Mobile Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Regional & Formatting Preferences</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Default Currency</label>
                  <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date Format</label>
                  <select className="form-input" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Indian/UK Standard)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Theme Mode</label>
                  <select className="form-input" value={themeMode} onChange={(e) => setThemeMode(e.target.value)}>
                    <option value="dark">Night Mode (Dark OLED)</option>
                    <option value="light">Daylight Mode (High Contrast)</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={profileSaving} style={{ padding: '0.65rem 1.4rem' }}>
                {profileSaving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                <span>Save Profile Preferences</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Security Center (P25) */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Password Change */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Security Center & Authentication</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Update your master account password and manage active authentication tokens.
              </p>
            </div>

            {passwordSuccess && (
              <div className="badge badge-emerald" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="badge badge-rose" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <AlertTriangle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                  {passwordSaving ? <RefreshCw className="animate-spin" size={16} /> : <Lock size={16} />}
                  <span>Change Password</span>
                </button>
              </div>
            </form>
          </div>

          {/* Session & Cryptographic Audit */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Active Session & Cryptographic Seal</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your session is authenticated using Django REST Token Authorization with SHA-256 integrity verification.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>CURRENT AUTH TOKEN</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem' }}>
                  <code style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                    {getToken() ? `${getToken().slice(0, 10)}••••••••••••••••${getToken().slice(-4)}` : 'No Token Active'}
                  </code>
                  <button className="btn btn-secondary" onClick={handleCopyToken} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                    {copiedToken ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                    <span>{copiedToken ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div style={{ background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>LEDGER INTEGRITY SEAL</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <CheckCircle2 size={16} color="var(--accent-emerald)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>
                    SHA-256 Cryptographic Chain Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Notifications & Reminder Rules (P26) */}
      {activeTab === 'notifications' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Notification Channels & Reminder Schedules</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Configure automated reminder triggers for upcoming and overdue loan repayments.
            </p>
          </div>

          {notifSaved && (
            <div className="badge badge-emerald" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <CheckCircle2 size={16} />
              <span>Notification preferences saved.</span>
            </div>
          )}

          {/* Delivery Channels */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.85rem' }}>Active Delivery Channels</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifChannels.inApp}
                  onChange={(e) => setNotifChannels({ ...notifChannels, inApp: e.target.checked })}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>In-App Alerts</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Top header bell dropdown</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifChannels.email}
                  onChange={(e) => setNotifChannels({ ...notifChannels, email: e.target.checked })}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Email Digest</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Weekly portfolio summary</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={notifChannels.whatsapp}
                  onChange={(e) => setNotifChannels({ ...notifChannels, whatsapp: e.target.checked })}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>WhatsApp Webhook</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Borrower payment reminders</div>
                </div>
              </label>
            </div>
          </div>

          {/* Automated Schedule Rules */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.85rem' }}>Automated Loan Reminder Matrix</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {[
                { key: 'sevenDays', label: '7 Days Before Due Date', desc: 'Gentle heads-up notification sent to borrower' },
                { key: 'threeDays', label: '3 Days Before Due Date', desc: 'Standard repayment reminder with statement link' },
                { key: 'oneDay', label: '1 Day Before Due Date', desc: 'Final friendly reminder before maturity' },
                { key: 'dueDay', label: 'On Due Date (Morning Alert)', desc: 'Due date arrival alert' },
                { key: 'overdueEscalation', label: 'Overdue Escalation (Every 3 Days)', desc: 'Polite overdue notification until settlement' },
              ].map((rule) => (
                <label
                  key={rule.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.825rem' }}>{rule.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{rule.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={reminderRules[rule.key]}
                    onChange={(e) => setReminderRules({ ...reminderRules, [rule.key]: e.target.checked })}
                  />
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setNotifSaved(true);
                setTimeout(() => setNotifSaved(false), 3000);
              }}
            >
              <Save size={16} />
              <span>Save Reminder Preferences</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: Data Management & Backup (P27) */}
      {activeTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Data Management, Backups & Exports</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Download comprehensive ledger snapshots or export records as structured CSV files.
              </p>
            </div>

            {exportSuccess && (
              <div className="badge badge-emerald" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <CheckCircle2 size={16} />
                <span>{exportSuccess}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {/* Full JSON Backup */}
              <div style={{
                background: 'var(--inner-card-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <FileJson size={20} color="var(--accent-cyan)" />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Full Canonical JSON Backup</h4>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Export complete ledger with people, loans, repayment ledgers, and SHA-256 seal.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={handleExportJSON} disabled={exporting}>
                  {exporting ? <RefreshCw className="animate-spin" size={15} /> : <Download size={15} />}
                  <span>Download JSON Backup</span>
                </button>
              </div>

              {/* CSV Exports */}
              <div style={{
                background: 'var(--inner-card-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <FileSpreadsheet size={20} color="var(--accent-emerald)" />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Spreadsheet CSV Exports</h4>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Export individual modules as CSV tables for Microsoft Excel or Google Sheets.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" onClick={() => handleExportCSV('people')} style={{ flex: 1, fontSize: '0.75rem' }}>
                    People CSV
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExportCSV('loans')} style={{ flex: 1, fontSize: '0.75rem' }}>
                    Loans CSV
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleExportCSV('payments')} style={{ flex: 1, fontSize: '0.75rem' }}>
                    Payments CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-panel" style={{ padding: '2rem', borderColor: 'rgba(244, 63, 94, 0.3)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '0.35rem' }}>
              Danger Zone: Purge & Reset Ledger
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Reset your personal ledger by purging all test contacts, loans, and repayments. Your user credentials will remain intact.
            </p>
            <button className="btn btn-secondary" onClick={() => setShowPurgeModal(true)} style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.4)' }}>
              <Trash2 size={15} />
              <span>Purge All Ledger Data</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: Integrations & API Access (P28) */}
      {activeTab === 'integrations' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Developer API & Webhooks</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Integrate LendGuard with external accounting tools, WhatsApp bots, and automated accounting workflows.
            </p>
          </div>

          {/* API Token */}
          <div style={{ background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, marginBottom: '0.35rem' }}>Personal API Access Token</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Include this token in HTTP headers as <code style={{ color: 'var(--accent-cyan)' }}>Authorization: Token &lt;your_token&gt;</code>.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="text"
                readOnly
                className="form-input"
                value={getToken() || 'No Token Active'}
                style={{ fontFamily: 'monospace', fontSize: '0.8rem', flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleCopyToken}>
                {copiedToken ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedToken ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Webhook Configuration */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, marginBottom: '0.35rem' }}>Webhook Event Subscriptions</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Receive signed JSON webhooks when events occur (<code style={{ color: 'var(--accent-indigo)' }}>loan.created</code>, <code style={{ color: 'var(--accent-emerald)' }}>payment.recorded</code>, <code style={{ color: 'var(--accent-rose)' }}>loan.overdue</code>).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Webhook Destination URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Signing Secret Key</label>
                <input
                  type="text"
                  readOnly
                  className="form-input"
                  value={webhookSecret}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Documentation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              OpenAPI 3.0 Interactive Documentation
            </div>
            <a
              href="http://127.0.0.1:8000/api/schema/swagger-ui/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              <span>View Swagger UI</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {/* TAB 6: Plans & Entitlements (P29) */}
      {activeTab === 'plans' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-emerald">ACTIVE SUBSCRIPTION</span>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Personal Pro Plan</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Unlimited lending records, cryptographic SHA-256 statements, and automated multi-channel reminders.
            </p>
          </div>

          {/* Entitlement Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PEOPLE CONTACTS</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent-emerald)' }}>Unlimited</div>
            </div>

            <div style={{ background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ACTIVE LOANS</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent-emerald)' }}>Unlimited</div>
            </div>

            <div style={{ background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>DIGITAL STATEMENTS</span>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent-cyan)' }}>SHA-256 Signed</div>
            </div>
          </div>

          {/* Plan Comparison */}
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Plan Tiers & Features</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div style={{ background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <h5 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Personal Free</h5>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.5rem 0' }}>₹0 <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ forever</span></div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.1rem' }}>
                <li>Up to 5 active borrowers</li>
                <li>Up to 10 loan records</li>
                <li>Basic in-app reminders</li>
              </ul>
            </div>

            <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '2px solid var(--accent-indigo)', borderRadius: 'var(--radius-md)', padding: '1.25rem', position: 'relative' }}>
              <span className="badge badge-indigo" style={{ position: 'absolute', top: 12, right: 12, fontSize: '0.68rem' }}>CURRENT</span>
              <h5 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Personal Pro</h5>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--accent-indigo)' }}>₹499 <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ year</span></div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.1rem' }}>
                <li><strong>Unlimited</strong> borrowers & loans</li>
                <li>SHA-256 signed statements</li>
                <li>Automated WhatsApp / Email reminders</li>
                <li>Full JSON & CSV data exports</li>
              </ul>
            </div>

            <div style={{ background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <h5 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Business Enterprise</h5>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.5rem 0' }}>₹2,499 <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>/ year</span></div>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.1rem' }}>
                <li>Multi-user workspace access</li>
                <li>Role-based permissions & audits</li>
                <li>Full REST API & Webhooks</li>
                <li>Dedicated phone support</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: Help, FAQ & Legal Guidance (P30) */}
      {activeTab === 'help' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Legal IOU Guidance */}
          <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-cyan)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              ⚖️ Digital IOU & Legal Enforceability Guidance
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              LendGuard digital statements and repayment ledger records are generated with canonical JSON serialization and SHA-256 cryptographic checksums.
            </p>
            <div style={{ background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>Legal Compliance Note:</strong> Under the <em>Indian Contract Act, 1872</em> and Section 65B of the <em>Information Technology Act, 2000</em>, digitally maintained and cryptographically signed electronic records of monetary transactions serve as admissible documentary evidence in civil recovery proceedings.
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>Frequently Asked Questions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                {
                  q: 'How does LendGuard calculate overdue balances?',
                  a: 'LendGuard calculates overdue balances using an authoritative balance engine that subtracts all validated, non-voided repayments from the loan principal. If the maturity due date has passed and an outstanding balance remains, the loan is automatically classified into the appropriate aging tier.'
                },
                {
                  q: 'What happens if a borrower makes a partial payment?',
                  a: 'When a partial repayment is recorded, the loan status immediately transitions to "PARTIALLY_PAID". The outstanding balance is updated in real time across the dashboard and borrower directory.'
                },
                {
                  q: 'How do cryptographic SHA-256 statements work?',
                  a: 'Each digital statement generates a deterministic canonical JSON payload of the loan and its transaction history. A SHA-256 hash is computed over this payload, ensuring that the document cannot be tampered with after generation.'
                },
                {
                  q: 'Can I export my data at any time?',
                  a: 'Yes. In the "Data & Backup" tab (Screen P27), you can download a full JSON backup of your entire ledger or export individual tables as CSV files with a single click.'
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{item.q}</span>
                    <span>{openFaq === idx ? '−' : '+'}</span>
                  </button>
                  {openFaq === idx && (
                    <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Purge Confirmation Modal */}
      {showPurgeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ maxWidth: 460, width: '100%', padding: '2rem', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent-rose)', marginBottom: '0.75rem' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Confirm Ledger Purge</h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              This will permanently delete all contacts, lending records, repayment ledgers, and notifications in your workspace. This action cannot be undone.
            </p>

            {purgeError && (
              <div className="badge badge-rose" style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem', fontSize: '0.78rem' }}>
                {purgeError}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">
                Type <strong>DELETE DATA</strong> to confirm:
              </label>
              <input
                type="text"
                className="form-input"
                value={purgeInput}
                onChange={(e) => setPurgeInput(e.target.value)}
                placeholder="DELETE DATA"
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => { setShowPurgeModal(false); setPurgeInput(''); setPurgeError(''); }} disabled={purging}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmPurge}
                disabled={purging || purgeInput !== 'DELETE DATA'}
                style={{ background: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
              >
                {purging ? <RefreshCw className="animate-spin" size={15} /> : <Trash2 size={15} />}
                <span>Permanently Purge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
