import React, { useState } from 'react';
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
  ChevronDown, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { CURRENCY_MAP, getDefaultCurrency, setDefaultCurrency, getCurrencySymbol } from '../utils/currency';
import { CurrencyTicker } from './CurrencyTicker';

const TAB_METADATA = {
  dashboard: { title: 'LendGuard Dashboard', subtitle: 'Real-time financial position, active lending & borrowing portfolios' },
  people: { title: 'People & Contacts Directory', subtitle: 'Manage borrower & lender relationships, contact details, and financial exposure' },
  loans: { title: 'Lending Ledger', subtitle: 'Authoritative source of truth for money lent, due dates, and recovery progress' },
  borrowing: { title: 'Borrowing Ledger', subtitle: 'Authoritative source of truth for money borrowed, due dates, and debt liabilities' },
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
  onToggleMobileSidebar,
  isMasked = false,
  onToggleMask
}) => {
  const { backendOnline } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

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

      {/* Right: FX Ticker, Number Mask Button, Notifications, & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {/* Dynamic FX Currency Ticker */}
        <CurrencyTicker />

        {/* Number Mask Privacy Toggle Button */}
        <button
          type="button"
          onClick={onToggleMask}
          className={`btn ${isMasked ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '0.4rem 0.8rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            borderRadius: 'var(--radius-full)',
            background: isMasked ? 'rgba(99, 102, 241, 0.18)' : 'var(--inner-card-bg)',
            borderColor: isMasked ? 'var(--accent-indigo)' : 'var(--border-subtle)',
            color: isMasked ? 'var(--accent-indigo)' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.18s ease'
          }}
          title={isMasked ? "Numbers are currently masked (Privacy ON) — Click to reveal" : "Click to mask financial numbers (Privacy Mode)"}
        >
          {isMasked ? <EyeOff size={15} color="var(--accent-indigo)" /> : <Eye size={15} />}
          <span>{isMasked ? 'Masked' : 'Mask Numbers'}</span>
        </button>

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
