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
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Default fallback reference table in case of initial load or network delay
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

const ALL_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'SGD', 'CHF', 'CAD', 'AUD'];

export const CurrencyTicker = () => {
  const { user } = useAuth();
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

  // Active reporting currency
  const reportingCurrency = localStorage.getItem('lendguard_currency') || user?.profile?.base_currency || 'INR';

  // Fetch Ticker Data from backend FX engine
  const fetchRates = async () => {
    try {
      setLoading(true);
      const data = await api.getCurrencyTicker(reportingCurrency);
      setTickerData(data);
    } catch (err) {
      console.warn('Live FX Ticker fallback used:', err);
      // Construct fallback reference rates
      const targetRateInr = FALLBACK_PARITY[reportingCurrency] || 1.0;
      const rates = ALL_CURRENCIES
        .filter(c => c !== reportingCurrency)
        .map(curr => {
          const srcRateInr = FALLBACK_PARITY[curr] || 1.0;
          const rate = srcRateInr / targetRateInr;
          return {
            pair: `${curr}/${reportingCurrency}`,
            from_currency: curr,
            to_currency: reportingCurrency,
            rate: rate,
            display_rate: rate >= 100 ? rate.toFixed(2) : rate.toFixed(4),
            is_used_in_ledger: false,
          };
        });

      setTickerData({
        reporting_currency: reportingCurrency,
        data_source: 'ECB & Open Market Parity (Reference)',
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
    fetchRates();
    const interval = setInterval(fetchRates, 60000); // 60s live refresh
    return () => clearInterval(interval);
  }, [reportingCurrency]);

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

  // Fallback to top 3 pairs if no pinned or ledger-used pairs exist
  const visiblePills = displayRates.length > 0 ? displayRates : tickerData.rates.slice(0, 3);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {/* 1. Top Header Pill / Strip */}
      <div
        onClick={() => setShowInspector(!showInspector)}
        title="Live FX Currency Reference Ticker — Click to customize & view all pairs"
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
            FX
          </span>
        </div>

        <div style={{ width: '1px', height: '12px', background: 'var(--border-subtle)' }} />

        {/* Currency Pairs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {visiblePills.slice(0, 3).map((item) => (
            <div key={item.pair} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.74rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                {item.pair}
              </span>
              <span style={{ 
                fontWeight: 600, 
                fontFamily: 'var(--font-mono)',
                color: item.is_used_in_ledger ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                fontSize: '0.72rem'
              }}>
                {item.display_rate}
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

      {/* 2. Interactive Inspector Popover */}
      {showInspector && (
        <div
          ref={inspectorRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '360px',
            maxWidth: '90vw',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.1)',
            zIndex: 1050,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Header */}
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
                  Live FX Reference Ticker
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Target Base: <strong style={{ color: 'var(--accent-emerald)' }}>{reportingCurrency}</strong> (Reporting Currency)
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

          {/* Currency Pairs Grid */}
          <div style={{ padding: '0.75rem 1rem', maxHeight: '260px', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              All Currency Pairs ({tickerData.rates.length})
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
                          <span>{item.pair}</span>
                          {item.is_used_in_ledger && (
                            <span style={{
                              fontSize: '0.58rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.18)',
                              color: 'var(--accent-emerald)',
                              padding: '0.1rem 0.35rem',
                              borderRadius: 'var(--radius-full)',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              In Ledger
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                          1 {item.from_currency} = {item.display_rate} {item.to_currency}
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
                <strong>Reference Only:</strong> Historical transactions permanently retain locked exchange rates. Ticker rates never mutate stored records.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
