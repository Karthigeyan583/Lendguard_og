import React, { useState, useMemo } from 'react';
import { Calculator, ArrowRight, DollarSign, Calendar, Percent, Check } from 'lucide-react';

export const LoanCalculator = ({ onApplyWithTerms }) => {
  const [amount, setAmount] = useState(25000);
  const [termMonths, setTermMonths] = useState(36);
  const [rate, setRate] = useState(6.5);
  const [loanType, setLoanType] = useState('personal');

  // Calculate monthly amortization
  const calculation = useMemo(() => {
    const p = parseFloat(amount) || 0;
    const n = parseInt(termMonths) || 1;
    const r = (parseFloat(rate) || 0) / 100 / 12;

    if (p <= 0 || n <= 0) {
      return { monthly: 0, totalPayment: 0, totalInterest: 0 };
    }

    if (r === 0) {
      const monthly = p / n;
      return {
        monthly: Math.round(monthly * 100) / 100,
        totalPayment: p,
        totalInterest: 0
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
  }, [amount, termMonths, rate]);

  return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Calculator size={20} color="var(--accent-emerald)" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Loan Amortization & Repayment Calculator</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Simulate borrowing costs and calculate precise monthly obligations</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Controls */}
        <div>
          {/* Loan Type */}
          <div className="form-group">
            <label className="form-label">Loan Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {[
                { id: 'personal', label: 'Personal', defaultRate: 6.5 },
                { id: 'business', label: 'Business', defaultRate: 7.2 },
                { id: 'mortgage', label: 'Mortgage', defaultRate: 4.85 },
                { id: 'auto', label: 'Auto Loan', defaultRate: 5.25 }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setLoanType(t.id);
                    setRate(t.defaultRate);
                  }}
                  style={{
                    flex: '1 1 auto',
                    padding: '0.5rem 0.8rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    background: loanType === t.id ? 'var(--accent-emerald)' : 'var(--bg-surface)',
                    color: loanType === t.id ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Borrowing Amount</label>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                ${Number(amount).toLocaleString()}
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
              <span>$1,000</span>
              <span>$250,000</span>
              <span>$500,000</span>
            </div>
          </div>

          {/* Term Slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Repayment Term</label>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {termMonths} Months ({(termMonths / 12).toFixed(1)} yrs)
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="360"
              step="6"
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              <span>6 mo</span>
              <span>15 yrs</span>
              <span>30 yrs</span>
            </div>
          </div>

          {/* Rate Slider */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Estimated Annual Interest Rate (APR)</label>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                {rate}%
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="0.25"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              <span>1%</span>
              <span>12.5%</span>
              <span>25%</span>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div style={{
          background: '#0c121d',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
              Estimated Monthly Payment
            </span>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'var(--accent-emerald)',
              letterSpacing: '-0.03em',
              margin: '0.5rem 0 1.25rem'
            }}>
              ${calculation.monthly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}> / month</span>
            </div>

            {/* Breakdown Visualizer */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                <span>Principal: {calculation.principalPercent}%</span>
                <span>Interest: {calculation.interestPercent}%</span>
              </div>
              <div style={{ height: '8px', width: '100%', background: 'var(--bg-surface)', borderRadius: '4px', display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: `${calculation.principalPercent}%`, background: 'var(--accent-emerald)' }} />
                <div style={{ width: `${calculation.interestPercent}%`, background: 'var(--accent-amber)' }} />
              </div>
            </div>

            {/* Metrics List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Principal Amount:</span>
                <span style={{ fontWeight: 600 }}>${Number(amount).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Interest Paid:</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-amber)' }}>
                  ${calculation.totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Total Repayment:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  ${calculation.totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.5rem' }}
            onClick={() => onApplyWithTerms({
              amount,
              term_months: termMonths,
              interest_rate: rate,
              loan_type: loanType
            })}
          >
            <span>Proceed to Application</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
