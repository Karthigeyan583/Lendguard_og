import React, { useState, useEffect } from 'react';
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
  FileCheck2, 
  BarChart3,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Database
} from 'lucide-react';

const POINTER_SLIDES = [
  {
    id: 'ledger',
    number: '01',
    title: 'Authoritative Multi-Currency Ledger',
    tag: 'CORE LEDGER',
    tagColor: 'var(--accent-emerald)',
    tagBg: 'rgba(16, 185, 129, 0.15)',
    icon: BookOpen,
    image: '/assets/slides/slide_ledger.jpg',
    badge: 'EUR • INR • USD Native',
    description: 'Maintains original lending currencies without artificial mixing. Provides real-time principal, repayment installments, and deterministic balance calculation.',
    highlights: ['Zero FX Distortion', 'Deterministic Balances', 'Installment Tracking']
  },
  {
    id: 'statements',
    number: '02',
    title: 'Verifiable Digital IOUs & Statements',
    tag: 'SHA-256 PROOF',
    tagColor: 'var(--accent-cyan)',
    tagBg: 'rgba(6, 182, 212, 0.15)',
    icon: FileCheck2,
    image: '/assets/slides/slide_statements.jpg',
    badge: 'Cryptographic Security',
    description: 'Generates formal printable PDF statements with tamper-evident SHA-256 cryptographic verification seals, signature verification, and dispute prevention.',
    highlights: ['SHA-256 Verification', 'Print & PDF Export', 'Legal Dispute Proof']
  },
  {
    id: 'aging',
    number: '03',
    title: 'Overdue Aging & Automated Reminders',
    tag: 'SMART RECOVERY',
    tagColor: 'var(--accent-rose)',
    tagBg: 'rgba(244, 63, 94, 0.15)',
    icon: BarChart3,
    image: '/assets/slides/slide_aging.jpg',
    badge: 'Auto Delinquency Engine',
    description: 'Tiered overdue aging buckets (0–7d, 8–30d, 31–60d, 60+d) with smart suppression for settled debts and automated WhatsApp/SMS payment reminders.',
    highlights: ['4 Tiered Buckets', 'Smart Suppression', 'WhatsApp & SMS Alerts']
  }
];

export const LoginPage = () => {
  const { login, register, loginAsDemo, backendOnline } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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

  // Auto-looping carousel timer (every 4.5s, pauses on hover)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % POINTER_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused]);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % POINTER_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + POINTER_SLIDES.length) % POINTER_SLIDES.length);
  };

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

  const currentSlide = POINTER_SLIDES[activeSlide];
  const CurrentIcon = currentSlide.icon;

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? 'radial-gradient(ellipse at top, #0f172a 0%, #060913 100%)' : 'radial-gradient(ellipse at top, #e2e8f0 0%, #f8fafc 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1.5rem',
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

      {/* Background Decorative Ambient Glows */}
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

      {/* Main 2-Column Equal Flex/Grid */}
      <div style={{
        width: '100%',
        maxWidth: 1200,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
        gap: '2rem',
        alignItems: 'stretch',
        zIndex: 1
      }}>
        {/* Left Side: Brand & Looping Pointer Carousel Card */}
        <div 
          className="glass-panel" 
          style={{
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1.25rem'
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Brand Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
                }}>
                  <ShieldCheck size={24} color="#ffffff" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: 'var(--text-primary)' }}>
                      LendGuard
                    </h1>
                    <span style={{
                      fontSize: '0.7rem',
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
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Personal & Business Lending Ledger Platform
                  </p>
                </div>
              </div>

              {/* Carousel Slide Counter */}
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ color: currentSlide.tagColor }}>{currentSlide.number}</span> / 03
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0.5rem 0 0' }}>
              Know who owes you, how much, when due, what was repaid, and what remains — with cryptographic audit trail.
            </p>
          </div>

          {/* Active Carousel Slide Visual & Description */}
          <div style={{
            background: 'var(--inner-card-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            position: 'relative'
          }}>
            {/* Slide Image Frame */}
            <div style={{
              position: 'relative',
              width: '100%',
              height: '185px',
              overflow: 'hidden',
              background: '#090e1a'
            }}>
              <img
                key={currentSlide.id}
                src={currentSlide.image}
                alt={currentSlide.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(1.02) contrast(1.04)',
                  transition: 'opacity 0.4s ease'
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(6, 9, 19, 0.92) 100%)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                padding: '0.65rem 0.9rem'
              }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  borderRadius: 'var(--radius-full)',
                  background: currentSlide.tagBg,
                  color: currentSlide.tagColor,
                  border: `1px solid ${currentSlide.tagColor}40`,
                  backdropFilter: 'blur(8px)'
                }}>
                  {currentSlide.badge}
                </span>

                {/* Prev / Next controls over image */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(6px)',
                      transition: 'all 0.2s ease'
                    }}
                    title="Previous Slide"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      backdropFilter: 'blur(6px)',
                      transition: 'all 0.2s ease'
                    }}
                    title="Next Slide"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Slide Content */}
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  background: currentSlide.tagBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentSlide.tagColor
                }}>
                  <CurrentIcon size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {currentSlide.title}
                  </h3>
                </div>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0.4rem 0 0.65rem' }}>
                {currentSlide.description}
              </p>

              {/* Highlight Chips */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {currentSlide.highlights.map((h, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Pointer Tabs / Thumbnails */}
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem'
            }}>
              {POINTER_SLIDES.map((slide, idx) => {
                const Icon = slide.icon;
                const isActive = activeSlide === idx;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    style={{
                      padding: '0.55rem 0.5rem',
                      borderRadius: '10px',
                      border: isActive ? `1.5px solid ${slide.tagColor}` : '1px solid var(--border-subtle)',
                      background: isActive ? slide.tagBg : 'var(--bg-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    <Icon size={16} color={isActive ? slide.tagColor : 'var(--text-muted)'} />
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%'
                    }}>
                      {slide.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Auto-Progress Bar Indicator */}
            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem' }}>
              {POINTER_SLIDES.map((_, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  style={{
                    flex: 1,
                    height: 3,
                    borderRadius: 2,
                    background: activeSlide === idx ? currentSlide.tagColor : 'var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'background 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Bottom System Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`} />
              <span style={{ color: backendOnline ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 600 }}>
                {backendOnline ? 'PostgreSQL 16 Connected' : 'Standalone Mode'}
              </span>
            </div>
            <span>🔒 AES-256 Encrypted</span>
          </div>
        </div>

        {/* Right Side: Login & Registration Glass Card */}
        <div className="glass-panel" style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
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
