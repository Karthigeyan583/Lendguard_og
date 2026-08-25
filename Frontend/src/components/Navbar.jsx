import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  BarChart3, 
  Calculator, 
  Terminal, 
  Bell, 
  Plus, 
  LogOut, 
  User, 
  Sparkles, 
  Check, 
  FileText,
  Sun,
  Moon
} from 'lucide-react';

export const Navbar = ({ 
  activeTab, 
  setActiveTab, 
  onOpenNewLoan, 
  onOpenAddPerson, 
  onOpenAuth,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead
}) => {
  const { user, logout, loginAsDemo, backendOnline } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'people', label: 'People & Contacts', icon: Users },
    { id: 'loans', label: 'Lending Ledger', icon: BookOpen },
    { id: 'aging', label: 'Overdue Aging', icon: FileText },
    { id: 'calculator', label: 'Tools / EMI', icon: Calculator },
  ];

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--header-bg)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.75rem 1.5rem',
      transition: 'background-color 0.2s ease, border-color 0.2s ease'
    }}>
      <div style={{
        maxWidth: 1320,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} 
            onClick={() => setActiveTab('dashboard')}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
            }}>
              <ShieldCheck size={22} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>LendGuard</span>
                <span style={{
                  fontSize: '0.65rem',
                  background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}>v2.0</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Personal Lending & Ledger Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className="btn"
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    background: isActive ? 'var(--bg-surface)' : 'transparent',
                    color: isActive ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                    padding: '0.45rem 0.8rem',
                    fontSize: '0.825rem',
                    border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                    gap: '0.4rem'
                  }}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Backend Status Badge */}
          <div
            title={backendOnline ? 'PostgreSQL Backend Connected (Port 8000)' : 'Offline Mode Active'}
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
            <span>{backendOnline ? 'PostgreSQL Active' : 'Offline Mode'}</span>
          </div>

          {/* Theme Mode Toggle (Night / Day) */}
          <button
            className="btn btn-secondary"
            style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={toggleTheme}
            title={isDark ? "Switch to Day Mode (Light Theme)" : "Switch to Night Mode (Dark Theme)"}
          >
            {isDark ? <Sun size={16} color="var(--accent-amber)" /> : <Moon size={16} color="var(--accent-indigo)" />}
          </button>

          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.45rem', position: 'relative' }}
              onClick={() => setShowNotifications(!showNotifications)}
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
                  fontSize: '0.65rem',
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

          {/* User Profile & Logout */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'var(--bg-surface)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem'
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  color: '#ffffff'
                }}>
                  {user.first_name ? user.first_name[0] : (user.username ? user.username[0].toUpperCase() : 'K')}
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.first_name ? `${user.first_name}` : user.username}</span>
              </div>
              <button className="btn btn-secondary" title="Logout" onClick={logout} style={{ padding: '0.45rem' }}>
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={onOpenAuth} style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}>
              <User size={15} />
              <span>Sign In</span>
            </button>
          )}

          {/* Action Buttons */}
          <button className="btn btn-secondary" onClick={onOpenAddPerson} style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}>
            <Plus size={15} />
            <span>Add Contact</span>
          </button>

          <button className="btn btn-primary" onClick={onOpenNewLoan} style={{ padding: '0.45rem 0.9rem', fontSize: '0.825rem' }}>
            <Plus size={15} strokeWidth={2.5} />
            <span>Record Loan Lent</span>
          </button>
        </div>
      </div>
    </header>
  );
};
