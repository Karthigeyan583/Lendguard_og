import React, { useState, useMemo } from 'react';
import { Calculator, ArrowRight, DollarSign, Calendar, Percent } from 'lucide-react';

export const LoanCalculatorView = ({ onLendWithTerms }) => {
  const [amount, setAmount] = useState(50000);
  const [termMonths, setTermMonths] = useState(12);
  const [rate, setRate] = useState(0); // Default no interest for personal lending
  const [interestType, setInterestType] = useState('none');

  const calculation = useMemo(() => {
    const p = parseFloat(amount) || 0;
    const n = parseInt(termMonths) || 1;
    const r = (parseFloat(rate) || 0) / 100 / 12;

    if (p <= 0 || n <= 0) {
      return { monthly: 0, totalPayment: 0, totalInterest: 0 };
    }

    if (r === 0 || interestType === 'none') {
      const monthly = p / n;
      return {
        monthly: Math.round(monthly * 100) / 100,
        totalPayment: p,
        totalInterest: 0,
        principalPercent: 100,
        interestPercent: 0
      };
    }

    const monthly = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = monthly * n;
    const totalInterest = totalPayment - p;

    return {
      monthly: Math.round(monthly * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      principalPercent: Math.round((p / totalPayment) * 100),
      interestPercent: Math.round((totalInterest / totalPayment) * 100)
    };
  }, [amount, termMonths, rate, interestType]);

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Calculator size={22} color="var(--accent-emerald)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Loan EMI & Repayment Calculator Tool (Screen P22)</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calculate monthly repayment plans and simulate lending terms before recording</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Controls */}
        <div>
          {/* Interest Model Selector */}
          <div className="form-group">
            <label className="form-label">Lending Terms Mode</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => { setInterestType('none'); setRate(0); }}
                style={{
                  flex: 1,
                  fontSize: '0.8rem',
                  background: interestType === 'none' ? 'var(--accent-emerald)' : 'var(--bg-surface)',
                  color: interestType === 'none' ? '#fff' : 'var(--text-secondary)'
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
                  background: interestType === 'interest' ? 'var(--accent-emerald)' : 'var(--bg-surface)',
                  color: interestType === 'interest' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                With Interest (APR)
              </button>
            </div>
          </div>

          {/* Amount Slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Lending Principal</label>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                ₹{Number(amount).toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              <span>₹1,000</span>
              <span>₹2,50,000</span>
              <span>₹5,00,000</span>
            </div>
          </div>

          {/* Term Slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Repayment Period</label>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {termMonths} Months ({Math.round((termMonths / 12) * 10) / 10} yrs)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              step="1"
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              <span>1 mo</span>
              <span>2.5 yrs</span>
              <span>5 yrs</span>
            </div>
          </div>

          {/* Rate Slider if interest enabled */}
          {interestType === 'interest' && (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Annual Interest Rate (APR)</label>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                  {rate}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              />
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
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
              Monthly Repayment Target
            </span>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'var(--accent-emerald)',
              letterSpacing: '-0.03em',
              margin: '0.5rem 0 1.25rem'
            }}>
              ₹{calculation.monthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}> / month</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Principal Lent:</span>
                <span style={{ fontWeight: 600 }}>₹{Number(amount).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Interest Accrued:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>
                  ₹{calculation.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Expected Repayment:</span>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                  ₹{calculation.totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem' }}
            onClick={() => onLendWithTerms({
              principal_amount: amount,
              interest_model: interestType === 'none' ? 'none' : 'simple_annual',
              interest_rate: rate
            })}
          >
            <span>Record Loan with These Terms</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
