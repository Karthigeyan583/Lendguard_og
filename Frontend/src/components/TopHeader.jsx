import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Search, 
  Plus, 
  Users, 
  ShieldCheck, 
  Menu,
  Check,
  Globe2,
  ChevronDown
} from 'lucide-react';
import { CURRENCY_MAP, getDefaultCurrency, setDefaultCurrency, getCurrencySymbol } from '../utils/currency';

const TAB_METADATA = {
  dashboard: { title: 'Lending Dashboard', subtitle: 'Real-time portfolio overview, balance calculations, and urgent follow-ups' },
  people: { title: 'People & Borrower Directory', subtitle: 'Manage borrower relationships, contact details, and financial exposure' },
  loans: { title: 'Lending Ledger', subtitle: 'Authoritative source of truth for money lent, due dates, and settlement progress' },
  aging: { title: 'Overdue Aging Analysis', subtitle: 'Deterministic overdue balance distribution categorized by days past due date' },
  calculator: { title: 'Loan EMI & Repayment Calculator', subtitle: 'Simulate monthly repayment schedules, interest accrual, and terms' },
  'api-explorer': { title: 'API & OpenAPI 3.0 Documentation', subtitle: 'Interactive DRF Spectacular Swagger UI and endpoint schema' },
  settings: { title: 'Settings & Administration Hub', subtitle: 'Manage personal profile, security, automated reminders, ledger exports, and API keys' }
};

export const TopHeader = ({ 
  activeTab, 
  onOpenNewLoan, 
  onOpenAddPerson,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onToggleMobileSidebar
}) => {
  const { backendOnline } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(getDefaultCurrency());
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  useEffect(() => {
    const handleCurrencyUpdate = () => {
      setSelectedCurrency(getDefaultCurrency());
    };
    window.addEventListener('currencyChange', handleCurrencyUpdate);
    return () => window.removeEventListener('currencyChange', handleCurrencyUpdate);
  }, []);

  const handleSelectCurrency = (code) => {
    setDefaultCurrency(code);
    setSelectedCurrency(code);
    setShowCurrencyDropdown(false);
    window.dispatchEvent(new Event('currencyChange'));
  };

  const currentMeta = TAB_METADATA[activeTab] || TAB_METADATA.dashboard;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="top-header">
      {/* Left: Mobile Menu Trigger + Contextual Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="mobile-menu-btn btn btn-secondary"
          onClick={onToggleMobileSidebar}
          style={{ padding: '0.45rem', display: 'none' }}
        >
          <Menu size={18} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text-primary)' }}>
            {currentMeta.title}
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Status, Currency Selector, Notifications, & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Global Currency Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary"
            style={{
              padding: '0.35rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)'
            }}
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            title="Switch Global Display Currency"
          >
            <Globe2 size={14} color="var(--accent-emerald)" />
            <span>{selectedCurrency} ({getCurrencySymbol(selectedCurrency)})</span>
            <ChevronDown size={13} color="var(--text-muted)" />
          </button>

          {showCurrencyDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '120%',
              width: 190,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 200,
              padding: '0.4rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem'
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.25rem 0.5rem', textTransform: 'uppercase' }}>
                Display Currency
              </div>
              {Object.entries(CURRENCY_MAP).map(([code, meta]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectCurrency(code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: selectedCurrency === code ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: selectedCurrency === code ? 'var(--accent-emerald)' : 'var(--text-primary)',
                    fontWeight: selectedCurrency === code ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <span>{meta.label}</span>
                  {selectedCurrency === code && <Check size={14} color="var(--accent-emerald)" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Backend Status Badge */}
        <div
          title={backendOnline ? 'PostgreSQL Database Connected (Port 8000)' : 'Standalone Offline Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.65rem',
            background: backendOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${backendOnline ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
            borderRadius: 'var(--radius-full)',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: backendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)'
          }}
        >
          <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
          <span>{backendOnline ? 'PostgreSQL Active' : 'Offline'}</span>
        </div>

        {/* Notification Bell Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.45rem', position: 'relative' }}
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications & Alerts"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: 'var(--accent-rose)',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.62rem',
                fontWeight: 700,
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '115%',
              width: 320,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-card)',
              zIndex: 200,
              maxHeight: 380,
              overflowY: 'auto'
            }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notifications & Alerts</span>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllNotificationsRead}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  No alerts at this time.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onMarkNotificationRead && onMarkNotificationRead(n.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: n.is_read ? 'transparent' : 'rgba(16, 185, 129, 0.06)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {n.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quick Action: Add Contact */}
        <button
          className="btn btn-secondary"
          onClick={onOpenAddPerson}
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
        >
          <Users size={15} />
          <span>Add Contact</span>
        </button>

        {/* Quick Action: Record Loan */}
        <button
          className="btn btn-primary"
          onClick={onOpenNewLoan}
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Record Loan</span>
        </button>
      </div>
    </header>
  );
};
