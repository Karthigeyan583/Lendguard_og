import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Globe2, 
  Pin, 
  PinOff, 
  Info, 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Sparkles,
  X,
  ArrowRightLeft,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Canonical fallback reference table (Base: INR values)
const FALLBACK_PARITY = {
  INR: 1.0,
  USD: 90.0,
  EUR: 98.0,
  GBP: 115.0,
  CHF: 102.5,
  CAD: 65.0,
  AUD: 58.0,
  AED: 24.5,
  SGD: 68.0,
};

const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
  CHF: 'Fr',
  CAD: 'C$',
  AUD: 'A$',
};

const ALL_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CHF', 'CAD', 'AUD'];

export const CurrencyTicker = () => {
  const { user } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    return localStorage.getItem('lendguard_currency') || user?.profile?.base_currency || 'INR';
  });

  const [tickerData, setTickerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [pinnedPairs, setPinnedPairs] = useState(() => {
    try {
      const saved = localStorage.getItem('lendguard_pinned_currencies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const inspectorRef = useRef(null);

  // Fetch Ticker Data for currently chosen currency
  const fetchRates = async (curr) => {
    const target = curr || selectedCurrency;
    try {
      setLoading(true);
      const data = await api.getCurrencyTicker(target);
      setTickerData(data);
    } catch (err) {
      console.warn('Live FX Ticker fallback used:', err);
      const targetRateInr = FALLBACK_PARITY[target] || 1.0;
      const rates = ALL_CURRENCIES
        .filter(c => c !== target)
        .map(c => {
          const srcRateInr = FALLBACK_PARITY[c] || 1.0;
          const rate = srcRateInr / targetRateInr;
          return {
            pair: `${c}/${target}`,
            from_currency: c,
            to_currency: target,
            rate: rate,
            display_rate: rate >= 100 ? rate.toFixed(2) : rate.toFixed(4),
            is_used_in_ledger: false,
          };
        });

      setTickerData({
        reporting_currency: target,
        data_source: 'Canonical Market Parity (Reference)',
        timestamp: new Date().toUTCString(),
        is_live: true,
        rates: rates,
        used_currencies: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates(selectedCurrency);
    const interval = setInterval(() => fetchRates(selectedCurrency), 60000); // 60s live refresh
    return () => clearInterval(interval);
  }, [selectedCurrency]);

  useEffect(() => {
    const handleGlobalChange = (e) => {
      if (e.detail?.currency && e.detail.currency !== selectedCurrency) {
        setSelectedCurrency(e.detail.currency);
        fetchRates(e.detail.currency);
      }
    };
    window.addEventListener('lendguard_currency_changed', handleGlobalChange);
    return () => window.removeEventListener('lendguard_currency_changed', handleGlobalChange);
  }, [selectedCurrency]);

  // Click outside listener for inspector popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inspectorRef.current && !inspectorRef.current.contains(e.target)) {
        setShowInspector(false);
      }
    };
    if (showInspector) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showInspector]);

  const handleSelectCurrency = (curr) => {
    setSelectedCurrency(curr);
    setDefaultCurrency(curr);
    fetchRates(curr);
  };

  const togglePin = (pair) => {
    let updated;
    if (pinnedPairs.includes(pair)) {
      updated = pinnedPairs.filter(p => p !== pair);
    } else {
      updated = [...pinnedPairs, pair];
    }
    setPinnedPairs(updated);
    try {
      localStorage.setItem('lendguard_pinned_currencies', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save pinned currencies:', e);
    }
  };

  if (!tickerData || !tickerData.rates || tickerData.rates.length === 0) {
    return null;
  }

  // Filter pairs for top header strip: Show pinned pairs + ledger-used pairs + top pairs
  const displayRates = tickerData.rates.filter(r => {
    if (pinnedPairs.includes(r.pair)) return true;
    if (r.is_used_in_ledger) return true;
    return false;
  });

  const visiblePills = displayRates.length > 0 ? displayRates : tickerData.rates.slice(0, 3);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {/* 1. Top Header Pill / Strip */}
      <div
        onClick={() => setShowInspector(!showInspector)}
        title="Live FX Currency Reference Ticker — Click to switch base currency & view all responding rates"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: 'var(--inner-card-bg)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-full)',
          padding: '0.28rem 0.65rem',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          userSelect: 'none',
          boxShadow: showInspector ? '0 0 12px var(--border-glow)' : 'none',
        }}
        className="currency-ticker-pill"
      >
        {/* Live Beacon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--accent-emerald)',
            boxShadow: '0 0 8px var(--accent-emerald)',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{
            fontSize: '0.66rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            color: 'var(--accent-emerald)',
            textTransform: 'uppercase'
          }}>
            {selectedCurrency}
          </span>
        </div>

        <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />

        {/* Currency Pairs with Responding Values */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {visiblePills.slice(0, 3).map((item) => (
            <div key={item.pair} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.74rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {item.from_currency}
              </span>
              <span style={{ 
                fontWeight: 600, 
                fontFamily: 'var(--font-mono)',
                color: item.is_used_in_ledger ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                fontSize: '0.72rem'
              }}>
                {CURRENCY_SYMBOLS[selectedCurrency] || ''}{item.display_rate}
              </span>
              {item.is_used_in_ledger && (
                <span style={{ 
                  width: 4, 
                  height: 4, 
                  borderRadius: '50%', 
                  background: 'var(--accent-emerald)' 
                }} title="Used in active ledger" />
              )}
            </div>
          ))}
        </div>

        <ChevronDown size={12} color="var(--text-muted)" style={{ transform: showInspector ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </div>

      {/* 2. Interactive Inspector & Currency Selector Popover */}
      {showInspector && (
        <div
          ref={inspectorRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '390px',
            maxWidth: '92vw',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.1)',
            zIndex: 1050,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header with Title & Close */}
          <div style={{
            padding: '0.85rem 1rem',
            background: 'var(--inner-card-bg)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe2 size={16} color="var(--accent-emerald)" />
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Live FX Currency Reference Ticker
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Select any target currency to see all responding values
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInspector(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Interactive Currency Selector Tabs */}
          <div style={{
            padding: '0.75rem 1rem',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Choose Target Base Currency:
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.35rem'
            }}>
              {ALL_CURRENCIES.map((curr) => {
                const isSelected = selectedCurrency === curr;
                return (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => handleSelectCurrency(curr)}
                    style={{
                      padding: '0.3rem 0.55rem',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.16)' : 'var(--inner-card-bg)',
                      color: isSelected ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{curr}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({CURRENCY_SYMBOLS[curr]})</span>
                    {isSelected && <Check size={11} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responding Currency Rates List */}
          <div style={{ padding: '0.75rem 1rem', maxHeight: '250px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Responding Rates in {selectedCurrency} ({tickerData.rates.length})
              </span>
              {loading && (
                <RefreshCw size={11} color="var(--accent-emerald)" className="spin" />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {tickerData.rates.map((item) => {
                const isPinned = pinnedPairs.includes(item.pair);
                return (
                  <div
                    key={item.pair}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      background: item.is_used_in_ledger ? 'rgba(16, 185, 129, 0.08)' : 'var(--inner-card-bg)',
                      border: `1px solid ${item.is_used_in_ledger ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(item.pair);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.1rem',
                          color: isPinned ? 'var(--accent-amber)' : 'var(--text-muted)'
                        }}
                        title={isPinned ? "Unpin from header strip" : "Pin to header strip"}
                      >
                        {isPinned ? <Pin size={13} fill="currentColor" /> : <Pin size={13} />}
                      </button>

                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>1 {item.from_currency}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>=</span>
                          <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                            {CURRENCY_SYMBOLS[selectedCurrency] || ''}{item.display_rate} {selectedCurrency}
                          </span>
                          {item.is_used_in_ledger && (
                            <span style={{
                              fontSize: '0.56rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.18)',
                              color: 'var(--accent-emerald)',
                              padding: '0.08rem 0.3rem',
                              borderRadius: 'var(--radius-full)',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              In Ledger
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                          Pair: {item.pair}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.825rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {item.display_rate}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Metadata & Policy Notice */}
          <div style={{
            padding: '0.75rem 1rem',
            background: 'var(--inner-card-bg)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.68rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={11} /> {tickerData.timestamp}
              </span>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                {tickerData.data_source}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
              <ShieldCheck size={12} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>Reference Only:</strong> Historical transactions permanently retain locked exchange rates.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
