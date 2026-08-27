import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Globe2 } from 'lucide-react';
import { CURRENCY_MAP, getDefaultCurrency, setDefaultCurrency } from '../utils/currency';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const CurrencySelector = ({ onCurrencyChange }) => {
  const { user } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState(getDefaultCurrency());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Synchronize state with local storage and global events
  useEffect(() => {
    const handleStorage = () => {
      setSelectedCurrency(getDefaultCurrency());
    };

    const handleCustomChange = (e) => {
      if (e.detail && e.detail.currency) {
        setSelectedCurrency(e.detail.currency);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('lendguard_currency_changed', handleCustomChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('lendguard_currency_changed', handleCustomChange);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = async (code) => {
    setSelectedCurrency(code);
    setDefaultCurrency(code);
    setIsOpen(false);

    // Sync with backend profile if logged in
    try {
      if (user) {
        await api.updateProfile({ base_currency: code });
      }
    } catch (err) {
      console.warn('Could not sync base currency with backend profile:', err);
    }

    if (onCurrencyChange) {
      onCurrencyChange(code);
    }
  };

  const currInfo = CURRENCY_MAP[selectedCurrency] || { symbol: selectedCurrency, name: selectedCurrency, flag: '🌐' };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'var(--inner-card-bg)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '0.35rem 0.75rem',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxShadow: isOpen ? '0 0 10px var(--border-glow)' : 'none'
        }}
        title="Reporting Currency — Select base currency for the dashboard & calculations"
      >
        <span style={{ fontSize: '0.9rem' }}>{currInfo.flag}</span>
        <span style={{ color: 'var(--accent-emerald)', fontWeight: 800 }}>{selectedCurrency}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({currInfo.symbol})</span>
        <ChevronDown
          size={13}
          color="var(--text-muted)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            marginLeft: '0.15rem'
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '210px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35), 0 0 15px rgba(16, 185, 129, 0.08)',
            zIndex: 1100,
            padding: '0.4rem',
            animation: 'fadeIn 0.12s ease-out'
          }}
        >
          <div style={{
            padding: '0.35rem 0.6rem 0.4rem',
            fontSize: '0.66rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '0.3rem'
          }}>
            Select Base Currency
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {Object.entries(CURRENCY_MAP).map(([code, info]) => {
              const isSelected = selectedCurrency === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelect(code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.45rem 0.6rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: isSelected ? 'var(--accent-emerald)' : 'var(--text-primary)',
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 800 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--inner-card-bg)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.95rem' }}>{info.flag}</span>
                    <div>
                      <span style={{ fontWeight: 700 }}>{code}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
                        ({info.symbol})
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check size={13} color="var(--accent-emerald)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
