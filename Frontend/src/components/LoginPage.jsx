import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  FileText, 
  BarChart3,
  Sun,
  Moon
} from 'lucide-react';

export const LoginPage = () => {
  const { login, register, loginAsDemo, backendOnline } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'admin',
    phone_number: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (isRegister) {
        const result = await register(formData);
        if (result.success) {
          setIsRegister(false);
          setFormData(prev => ({ ...prev, password: '' }));
          setSuccessMsg('Account created successfully! Please sign in with your password.');
        } else {
          setError(result.error || 'Registration failed. Please verify your details.');
        }
      } else {
        const result = await login(formData.username, formData.password);
        if (result.success) {
          setSuccessMsg('Login successful! Entering dashboard...');
        } else {
          setError(result.error || 'Authentication failed. Please check your username/email and password.');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (acc) => {
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      const res = await loginAsDemo(acc);
      if (res.success) {
        setSuccessMsg(`Welcome, ${acc.name}! Loading ledger...`);
      } else {
        setError(res.error || 'Demo login failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? 'radial-gradient(ellipse at top, #0f172a 0%, #060913 100%)' : 'radial-gradient(ellipse at top, #e2e8f0 0%, #f8fafc 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background 0.3s ease'
    }}>
      {/* Top Floating Theme Toggle */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
        <button
          className="btn btn-secondary"
          style={{
            padding: '0.5rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)'
          }}
          onClick={toggleTheme}
          title={isDark ? "Switch to Day Mode (Light)" : "Switch to Night Mode (Dark)"}
        >
          {isDark ? <Sun size={16} color="var(--accent-amber)" /> : <Moon size={16} color="var(--accent-indigo)" />}
          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{isDark ? 'Day Mode' : 'Night Mode'}</span>
        </button>
      </div>

      {/* Background Decorative Glow */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '20%',
        width: 500,
        height: 500,
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '15%',
        width: 450,
        height: 450,
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: 1040,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '2.5rem',
        alignItems: 'center',
        zIndex: 1
      }}>
        {/* Left Side: Brand Story & Feature Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', padding: '1rem 0' }}>
          {/* Brand Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: 46,
                height: 46,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)'
              }}>
                <ShieldCheck size={28} color="#ffffff" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: 'var(--text-primary)' }}>
                    LendGuard
                  </h1>
                  <span style={{
                    fontSize: '0.75rem',
                    background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    v2.0
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Personal & Business Lending Ledger Platform
                </p>
              </div>
            </div>
            
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '1rem' }}>
              Know who owes you, how much, when due, what was repaid, and what remains — with cryptographic audit trail.
            </p>
          </div>

          {/* Feature Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={16} color="var(--accent-emerald)" />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>Authoritative Lending Ledger</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keep track of principal, payment installments, and remaining balances.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={16} color="var(--accent-cyan)" />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>Verifiable Digital IOUs & Statements</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Generate formal PDF/print statements with cryptographic SHA-256 seal.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BarChart3 size={16} color="var(--accent-rose)" />
              </div>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>Overdue Aging Analysis & Automated Reminders</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tiered aging buckets (0–7d, 8–30d, 31–60d, 60+d) with auto-suppression.</span>
              </div>
            </div>
          </div>

          {/* System Status Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.85rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            color: backendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)',
            width: 'fit-content'
          }}>
            <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
            <span>{backendOnline ? 'PostgreSQL Backend Connected (Port 8000)' : 'Standalone Offline Mode'}</span>
          </div>
        </div>

        {/* Right Side: Login & Registration Glass Card */}
        <div className="glass-panel" style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            padding: '0.3rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: !isRegister ? 'var(--bg-card)' : 'transparent',
                color: !isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: !isRegister ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: isRegister ? 'var(--bg-card)' : 'transparent',
                color: isRegister ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isRegister ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Create Account
            </button>
          </div>

          {/* 1-Click Quick Demo Login */}
          {!isRegister && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                <Sparkles size={13} />
                <span>QUICK 1-CLICK TEST LOGIN</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  justifyContent: 'space-between',
                  background: 'rgba(16, 185, 129, 0.08)',
                  borderColor: 'rgba(16, 185, 129, 0.3)'
                }}
                onClick={() => handleDemoLogin(DEMO_ACCOUNTS[0])}
                disabled={submitting}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={15} color="var(--accent-emerald)" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      Karthik Ramaswamy
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Primary Lender (Password123!)
                    </div>
                  </div>
                </div>
                <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>Log In ➔</span>
              </button>
            </div>
          )}

          {!isRegister && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Or enter credentials</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fb7185',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem'
              }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-emerald)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {isRegister && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Karthik"
                    className="form-input"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Ramaswamy"
                    className="form-input"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                {isRegister ? 'Username' : 'Username or Email Address'}
              </label>
              <input
                type="text"
                required
                placeholder={isRegister ? "karthik" : "karthik or karthik@lendguard.io"}
                className="form-input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>

            {isRegister && (
              <>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="karthik@lendguard.io"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98844 09190"
                    className="form-input"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Password (Min. 6 characters)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingRight: '2.5rem' }}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.9rem' }}
              disabled={submitting}
            >
              <span>{submitting ? 'Authenticating...' : (isRegister ? 'Create Account & Open Ledger' : 'Sign In to Dashboard')}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Privacy and Encryption note */}
          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            🔒 256-bit Encrypted & Protected by LendGuard Security
          </div>
        </div>
      </div>
    </div>
  );
};
