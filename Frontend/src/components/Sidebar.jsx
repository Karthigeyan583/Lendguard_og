import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldCheck, 
  Users, 
  LayoutDashboard,
  LineChart,
  HandCoins,
  Landmark,
  Hourglass,
  Calculator, 
  Plus, 
  LogOut, 
  Sun, 
  Moon, 
  ChevronRight, 
  Layers, 
  Settings2,
  Sparkles
} from 'lucide-react';

export const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  onOpenNewLoan, 
  onOpenAddPerson,
  overdueCount = 0
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & Position' },
    { id: 'analytics', label: 'Analytics & Reports', icon: LineChart, description: 'Intelligence & Studio', badge: 'v2.0', badgeColor: 'var(--accent-emerald)' },
    { id: 'people', label: 'People & Contacts', icon: Users, description: 'Borrowers & Lenders' },
    { id: 'loans', label: 'Lending Ledger', icon: HandCoins, description: 'Money Lent (Receivables)' },
    { id: 'borrowing', label: 'Borrowing Ledger', icon: Landmark, description: 'Money Borrowed (Payables)' },
    { id: 'aging', label: 'Overdue Aging', icon: Hourglass, description: 'Recovery buckets', badge: overdueCount > 0 ? `${overdueCount}` : null, badgeColor: 'var(--accent-rose)' },
  ];

  const toolsNavItems = [
    { id: 'calculator', label: 'Tools / EMI', icon: Calculator, description: 'Repayment calculator' },
    { id: 'settings', label: 'Settings & Security', icon: Settings2, description: 'P24-P30 Admin Hub' },
  ];

  return (
    <aside className="sidebar">
      {/* 1. Brand & Workspace Header */}
      <div className="sidebar-brand-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
            flexShrink: 0
          }}>
            <ShieldCheck size={22} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--sidebar-brand-text, #ffffff)' }}>
                LendGuard
              </span>
              <span style={{
                fontSize: '0.62rem',
                background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}>v2.0</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--sidebar-subtitle-text, #94a3b8)' }}>
              Lending & Borrowing Ledger
            </div>
          </div>
        </div>

        {/* Workspace Pill */}
        <div style={{
          marginTop: '1rem',
          padding: '0.45rem 0.75rem',
          background: 'var(--sidebar-pill-bg)',
          border: '1px solid var(--sidebar-pill-border)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.78rem'
        }}>
          <Layers size={14} color="var(--accent-emerald)" />
          <span style={{ fontWeight: 600, color: 'var(--sidebar-pill-text, #ffffff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.first_name ? `${user.first_name}'s Ledger` : "My Ledger"}
          </span>
        </div>
      </div>

      {/* 2. Quick Action CTA */}
      <div style={{ padding: '0 1rem 1rem' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.6rem 0.9rem', fontSize: '0.825rem', gap: '0.45rem' }}
          onClick={onOpenNewLoan}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Record Loan / Borrow</span>
        </button>
      </div>

      {/* 3. Navigation Sections */}
      <div className="sidebar-nav-container">
        {/* Main Section */}
        <div className="sidebar-section-title">LENDING & BORROWING</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1.25rem' }}>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={17} color={isActive ? 'var(--accent-emerald)' : 'var(--sidebar-nav-inactive-text, #94a3b8)'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--sidebar-nav-active-text, #ffffff)' : 'var(--sidebar-nav-inactive-text, #94a3b8)' }}>
                      {item.label}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(244, 63, 94, 0.18)',
                    color: 'var(--accent-rose)',
                    border: '1px solid rgba(244, 63, 94, 0.3)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tools Section */}
        <div className="sidebar-section-title">TOOLS & DEVELOPER</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {toolsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={17} color={isActive ? 'var(--accent-emerald)' : 'var(--sidebar-nav-inactive-text, #94a3b8)'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--sidebar-nav-active-text, #ffffff)' : 'var(--sidebar-nav-inactive-text, #94a3b8)' }}>
                      {item.label}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Bottom User Profile & Preferences Footer */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.5rem' }}>
          {/* User Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
            {user?.avatar || localStorage.getItem('lendguard_user_avatar') ? (
              <img
                src={user?.avatar || localStorage.getItem('lendguard_user_avatar')}
                alt={user?.first_name || 'User'}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--accent-emerald)',
                  flexShrink: 0
                }}
              />
            ) : (
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.8rem',
                color: '#ffffff',
                flexShrink: 0
              }}>
                {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'K')}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--sidebar-footer-text, #ffffff)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.username || 'Karthik')}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--sidebar-footer-muted, #94a3b8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'karthik@lendguard.io'}
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
              onClick={toggleTheme}
              title={isDark ? "Switch to Day Mode (Light)" : "Switch to Night Mode (Dark)"}
            >
              {isDark ? <Sun size={15} color="var(--accent-amber)" /> : <Moon size={15} color="var(--accent-indigo)" />}
            </button>

            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}
              onClick={logout}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
