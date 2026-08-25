import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  BarChart3, 
  Calculator, 
  Terminal, 
  Plus, 
  LogOut, 
  FileText,
  Sun,
  Moon,
  ChevronRight,
  TrendingUp,
  Layers,
  Settings
} from 'lucide-react';
import { CURRENCY_MAP, getDefaultCurrency } from '../utils/currency';

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
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, description: 'Overview & Urgency' },
    { id: 'people', label: 'People & Contacts', icon: Users, description: 'Borrower directory' },
    { id: 'loans', label: 'Lending Ledger', icon: BookOpen, description: 'Source of Truth' },
    { id: 'aging', label: 'Overdue Aging', icon: FileText, description: 'Recovery buckets', badge: overdueCount > 0 ? `${overdueCount}` : null, badgeColor: 'var(--accent-rose)' },
  ];

  const toolsNavItems = [
    { id: 'calculator', label: 'Tools / EMI', icon: Calculator, description: 'Repayment calculator' },
    { id: 'api-explorer', label: 'API & Swagger', icon: Terminal, description: 'OpenAPI 3.0 docs' },
    { id: 'settings', label: 'Settings & Security', icon: Settings, description: 'P24-P30 Admin Hub' },
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
              <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
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
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Personal Lending Ledger
            </div>
          </div>
        </div>

        {/* Workspace Pill */}
        <div style={{
          marginTop: '1rem',
          padding: '0.45rem 0.65rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Layers size={14} color="var(--accent-emerald)" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.first_name ? `${user.first_name}'s Ledger` : "My Ledger"}
            </span>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>INR (₹)</span>
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
          <span>Record Money Lent</span>
        </button>
      </div>

      {/* 3. Navigation Sections */}
      <div className="sidebar-nav-container">
        {/* Main Section */}
        <div className="sidebar-section-title">LENDING & LEDGER</div>
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
                  <Icon size={17} color={isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
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
                  <Icon size={17} color={isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)'} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: isActive ? 700 : 600, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
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

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.username || 'Karthik')}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
