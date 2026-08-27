import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, ArrowRight, DollarSign, Calendar, Percent, Globe, ChevronDown, Table, CheckCircle2 } from 'lucide-react';
import { getDefaultCurrency, getCurrencySymbol } from '../utils/currency';

export const CALCULATOR_COUNTRIES = [
  { country: 'India', code: 'IN', currency: 'INR', symbol: '₹', flag: '🇮🇳', defaultAmount: 100000, min: 1000, max: 2500000, step: 5000 },
  { country: 'United States', code: 'US', currency: 'USD', symbol: '$', flag: '🇺🇸', defaultAmount: 5000, min: 100, max: 150000, step: 500 },
  { country: 'United Kingdom', code: 'GB', currency: 'GBP', symbol: '£', flag: '🇬🇧', defaultAmount: 5000, min: 100, max: 150000, step: 500 },
  { country: 'European Union (SEPA)', code: 'EU', currency: 'EUR', symbol: '€', flag: '🇪🇺', defaultAmount: 5000, min: 100, max: 150000, step: 500 },
  { country: 'United Arab Emirates', code: 'AE', currency: 'AED', symbol: 'AED ', flag: '🇦🇪', defaultAmount: 20000, min: 500, max: 500000, step: 1000 },
  { country: 'Canada', code: 'CA', currency: 'CAD', symbol: 'CA$', flag: '🇨🇦', defaultAmount: 5000, min: 100, max: 150000, step: 500 },
  { country: 'Australia', code: 'AU', currency: 'AUD', symbol: 'AU$', flag: '🇦🇺', defaultAmount: 5000, min: 100, max: 150000, step: 500 },
  { country: 'Singapore', code: 'SG', currency: 'SGD', symbol: 'S$', flag: '🇸🇬', defaultAmount: 5000, min: 100, max: 150000, step: 500 },
  { country: 'Switzerland', code: 'CH', currency: 'CHF', symbol: 'Fr ', flag: '🇨🇭', defaultAmount: 5000, min: 100, max: 150000, step: 500 },
  { country: 'Saudi Arabia', code: 'SA', currency: 'SAR', symbol: 'SAR ', flag: '🇸🇦', defaultAmount: 20000, min: 500, max: 500000, step: 1000 },
  { country: 'Qatar', code: 'QA', currency: 'QAR', symbol: 'QAR ', flag: '🇶🇦', defaultAmount: 20000, min: 500, max: 500000, step: 1000 },
  { country: 'Kuwait', code: 'KW', currency: 'KWD', symbol: 'KWD ', flag: '🇰🇼', defaultAmount: 2000, min: 50, max: 50000, step: 100 },
  { country: 'Japan', code: 'JP', currency: 'JPY', symbol: '¥', flag: '🇯🇵', defaultAmount: 500000, min: 10000, max: 15000000, step: 50000 },
  { country: 'New Zealand', code: 'NZ', currency: 'NZD', symbol: 'NZ$', flag: '🇳🇿', defaultAmount: 5000, min: 100, max: 150000, step: 500 },
  { country: 'South Africa', code: 'ZA', currency: 'ZAR', symbol: 'R ', flag: '🇿🇦', defaultAmount: 50000, min: 1000, max: 1000000, step: 5000 },
  { country: 'Malaysia', code: 'MY', currency: 'MYR', symbol: 'RM ', flag: '🇲🇾', defaultAmount: 10000, min: 200, max: 250000, step: 1000 },
  { country: 'Philippines', code: 'PH', currency: 'PHP', symbol: '₱', flag: '🇵🇭', defaultAmount: 100000, min: 2000, max: 2500000, step: 5000 },
  { country: 'Thailand', code: 'TH', currency: 'THB', symbol: '฿', flag: '🇹🇭', defaultAmount: 100000, min: 2000, max: 2500000, step: 5000 },
  { country: 'Indonesia', code: 'ID', currency: 'IDR', symbol: 'Rp ', flag: '🇮🇩', defaultAmount: 50000000, min: 1000000, max: 1000000000, step: 5000000 },
  { country: 'Brazil', code: 'BR', currency: 'BRL', symbol: 'R$', flag: '🇧🇷', defaultAmount: 20000, min: 500, max: 500000, step: 1000 },
  { country: 'Mexico', code: 'MX', currency: 'MXN', symbol: 'Mex$', flag: '🇲🇽', defaultAmount: 50000, min: 1000, max: 1000000, step: 5000 },
  { country: 'Norway', code: 'NO', currency: 'NOK', symbol: 'kr ', flag: '🇳🇴', defaultAmount: 50000, min: 1000, max: 1000000, step: 5000 },
  { country: 'Sweden', code: 'SE', currency: 'SEK', symbol: 'kr ', flag: '🇸🇪', defaultAmount: 50000, min: 1000, max: 1000000, step: 5000 },
  { country: 'Denmark', code: 'DK', currency: 'DKK', symbol: 'kr ', flag: '🇩🇰', defaultAmount: 50000, min: 1000, max: 1000000, step: 5000 }
];

export const LoanCalculatorView = ({ onLendWithTerms }) => {
  // Find initial country matching the active default currency
  const defCurr = (getDefaultCurrency() || 'INR').toUpperCase();
  const initialCountry = CALCULATOR_COUNTRIES.find(c => c.currency === defCurr) || CALCULATOR_COUNTRIES[0];

  const [selectedCountryCode, setSelectedCountryCode] = useState(initialCountry.code);
  const currentCountry = useMemo(() => {
    return CALCULATOR_COUNTRIES.find(c => c.code === selectedCountryCode) || CALCULATOR_COUNTRIES[0];
  }, [selectedCountryCode]);

  const [amount, setAmount] = useState(currentCountry.defaultAmount);
  const [termMonths, setTermMonths] = useState(12);
  const [rate, setRate] = useState(0); // Default no interest
  const [interestType, setInterestType] = useState('none');
  const [showAmortization, setShowAmortization] = useState(false);

  // When country changes, adapt default amount and currency settings
  const handleCountryChange = (newCode) => {
    setSelectedCountryCode(newCode);
    const country = CALCULATOR_COUNTRIES.find(c => c.code === newCode) || CALCULATOR_COUNTRIES[0];
    setAmount(country.defaultAmount);
  };

  // Sync if app default currency changes
  useEffect(() => {
    const handleCurrencyChange = (e) => {
      const curr = e.detail?.currency || getDefaultCurrency();
      const match = CALCULATOR_COUNTRIES.find(c => c.currency === curr.toUpperCase());
      if (match) {
        setSelectedCountryCode(match.code);
        setAmount(match.defaultAmount);
      }
    };
    window.addEventListener('lendguard_currency_changed', handleCurrencyChange);
    return () => window.removeEventListener('lendguard_currency_changed', handleCurrencyChange);
  }, []);

  const calculation = useMemo(() => {
    const p = parseFloat(amount) || 0;
    const n = parseInt(termMonths) || 1;
    const r = (parseFloat(rate) || 0) / 100 / 12;

    if (p <= 0 || n <= 0) {
      return { monthly: 0, totalPayment: 0, totalInterest: 0, schedule: [] };
    }

    if (r === 0 || interestType === 'none') {
      const monthly = p / n;
      const schedule = [];
      let balance = p;
      for (let i = 1; i <= n; i++) {
        const principalPaid = monthly;
        balance -= principalPaid;
        schedule.push({
          month: i,
          payment: Math.round(monthly * 100) / 100,
          principal: Math.round(principalPaid * 100) / 100,
          interest: 0,
          remainingBalance: Math.max(0, Math.round(balance * 100) / 100)
        });
      }

      return {
        monthly: Math.round(monthly * 100) / 100,
        totalPayment: p,
        totalInterest: 0,
        principalPercent: 100,
        interestPercent: 0,
        schedule
      };
    }

    // Standard Amortization Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const monthly = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthly * n;
    const totalInterest = totalPayment - p;

    const schedule = [];
    let balance = p;
    for (let i = 1; i <= n; i++) {
      const interestForMonth = balance * r;
      const principalForMonth = monthly - interestForMonth;
      balance -= principalForMonth;
      schedule.push({
        month: i,
        payment: Math.round(monthly * 100) / 100,
        principal: Math.round(principalForMonth * 100) / 100,
        interest: Math.round(interestForMonth * 100) / 100,
        remainingBalance: Math.max(0, Math.round(balance * 100) / 100)
      });
    }

    return {
      monthly: Math.round(monthly * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      principalPercent: Math.round((p / totalPayment) * 100),
      interestPercent: Math.round((totalInterest / totalPayment) * 100),
      schedule
    };
  }, [amount, termMonths, rate, interestType]);

  const sym = currentCountry.symbol;
  const currCode = currentCountry.currency;

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calculator size={22} color="var(--accent-emerald)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
              Universal Loan EMI & Repayment Calculator
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.15rem' }}>
              Simulate monthly repayment plans, interest accruals, and amortization across global countries
            </p>
          </div>
        </div>

        {/* Country & Currency Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--inner-card-bg)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <Globe size={16} color="var(--accent-indigo)" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Jurisdiction & Currency
            </span>
            <select
              className="form-select"
              value={selectedCountryCode}
              onChange={(e) => handleCountryChange(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '0.15rem 1.25rem 0.15rem 0',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              {CALCULATOR_COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.country} — {c.currency} ({c.symbol.trim()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Lending Terms Mode */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem' }}>Lending Terms Mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => { setInterestType('none'); setRate(0); }}
                style={{
                  flex: 1,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: interestType === 'none' ? 'var(--accent-emerald)' : 'var(--bg-surface)',
                  color: interestType === 'none' ? '#fff' : 'var(--text-secondary)',
                  border: interestType === 'none' ? 'none' : '1px solid var(--border-subtle)'
                }}
              >
                No Interest (0% APR)
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => { setInterestType('interest'); setRate(10); }}
                style={{
                  flex: 1,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: interestType === 'interest' ? 'var(--accent-emerald)' : 'var(--bg-surface)',
                  color: interestType === 'interest' ? '#fff' : 'var(--text-secondary)',
                  border: interestType === 'interest' ? 'none' : '1px solid var(--border-subtle)'
                }}
              >
                With Interest (APR)
              </button>
            </div>
          </div>

          {/* Principal Amount Controls: Number Box + Slider */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '0.78rem' }}>
                Lending Principal ({currentCountry.flag} {currCode})
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{sym}</span>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  style={{ width: '130px', height: 32, fontSize: '0.88rem', fontWeight: 800, textAlign: 'right', paddingRight: '0.5rem' }}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>

            <input
              type="range"
              min={currentCountry.min}
              max={Math.max(currentCountry.max, amount)}
              step={currentCountry.step}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ accentColor: 'var(--accent-emerald)', width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              <span>{sym}{currentCountry.min.toLocaleString()}</span>
              <span>{sym}{Math.round((currentCountry.min + currentCountry.max) / 2).toLocaleString()}</span>
              <span>{sym}{currentCountry.max.toLocaleString()}</span>
            </div>
          </div>

          {/* Repayment Period Slider */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '0.78rem' }}>Repayment Period</label>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {termMonths} {termMonths === 1 ? 'Month' : 'Months'} ({(termMonths / 12).toFixed(1)} yrs)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value))}
              style={{ accentColor: 'var(--accent-cyan)', width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              <span>1 mo</span>
              <span>2.5 yrs</span>
              <span>5 yrs</span>
            </div>
          </div>

          {/* Rate Slider if interest enabled */}
          {interestType === 'interest' && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '0.78rem' }}>Annual Interest Rate (APR)</label>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  {rate}% per annum
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="36"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                style={{ accentColor: 'var(--accent-amber)', width: '100%', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                <span>0.5%</span>
                <span>18%</span>
                <span>36%</span>
              </div>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div style={{
          background: 'var(--inner-card-bg)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
                Monthly Repayment Target ({currCode})
              </span>
              <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                {currentCountry.flag} {currCode}
              </span>
            </div>

            <div style={{
              fontSize: '2.4rem',
              fontWeight: 900,
              color: 'var(--accent-emerald)',
              letterSpacing: '-0.03em',
              margin: '0.5rem 0 1.25rem'
            }}>
              {sym}{calculation.monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}> / month</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Principal Lent:</span>
                <span style={{ fontWeight: 700 }}>{sym}{Number(amount).toLocaleString()} {currCode}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Interest Accrued:</span>
                <span style={{ fontWeight: 700, color: calculation.totalInterest > 0 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                  {sym}{calculation.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Total Expected Repayment:</span>
                <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>
                  {sym}{calculation.totalPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currCode}</span>
                </span>
              </div>
            </div>

            {/* Schedule View Toggle */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '1.1rem', fontSize: '0.75rem', padding: '0.4rem', justifyContent: 'center', gap: '0.35rem' }}
              onClick={() => setShowAmortization(prev => !prev)}
            >
              <Table size={13} />
              <span>{showAmortization ? 'Hide Repayment Schedule' : `View ${termMonths}-Month Schedule`}</span>
            </button>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem', padding: '0.65rem', justifyContent: 'center', gap: '0.45rem' }}
            onClick={() => onLendWithTerms({
              currency: currentCountry.currency,
              principal_amount: amount,
              interest_model: interestType === 'none' ? 'none' : 'simple_annual',
              interest_rate: rate
            })}
          >
            <span>Record Loan in {currentCountry.currency} with These Terms</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Amortization Schedule Table (Optional Dropdown) */}
      {showAmortization && (
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>
              {currentCountry.flag} Monthly Amortization Schedule ({termMonths} Installments in {currCode})
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Monthly EMI: {sym}{calculation.monthly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: 'var(--inner-card-bg)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left', fontWeight: 700 }}>Month</th>
                  <th style={{ padding: '0.6rem 0.85rem', fontWeight: 700 }}>Installment</th>
                  <th style={{ padding: '0.6rem 0.85rem', fontWeight: 700 }}>Principal</th>
                  <th style={{ padding: '0.6rem 0.85rem', fontWeight: 700 }}>Interest</th>
                  <th style={{ padding: '0.6rem 0.85rem', fontWeight: 700 }}>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {calculation.schedule.map(row => (
                  <tr key={row.month} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.55rem 0.85rem', textAlign: 'left', fontWeight: 600 }}>Month {row.month}</td>
                    <td style={{ padding: '0.55rem 0.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{sym}{row.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '0.55rem 0.85rem' }}>{sym}{row.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '0.55rem 0.85rem', color: row.interest > 0 ? 'var(--accent-amber)' : 'var(--text-muted)' }}>{sym}{row.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ padding: '0.55rem 0.85rem', fontWeight: 700 }}>{sym}{row.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
