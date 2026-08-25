import React, { useState } from 'react';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { KpiCard } from './charts/KpiCard';
import { BarChart } from './charts/BarChart';
import { getCurrencySymbol, maskValue } from '../../utils/currency';

export const OverdueRiskView = ({
  agingData,
  loans = [],
  reportingCurrency = 'INR',
  isMasked = false,
  onRecordPayment,
  onGenerateStatement
}) => {
  const [directionFilter, setDirectionFilter] = useState('all');
  const symbol = getCurrencySymbol(reportingCurrency);

  const overdueLoans = loans.filter(l => {
    if (l.days_overdue <= 0 || l.status === 'PAID' || l.status === 'CANCELLED' || l.status === 'WRITTEN_OFF') return false;
    if (directionFilter === 'lent' && l.direction === 'borrowed') return false;
    if (directionFilter === 'borrowed' && l.direction !== 'borrowed') return false;
    return true;
  });

  const totalOverdue = overdueLoans.reduce((acc, l) => acc + Number(l.balance?.outstanding || l.principal_amount || 0), 0);

  const tiers = [
    { key: 'tier_0_to_7_days', label: '0 – 7 Days Overdue', min: 1, max: 7, color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.12)' },
    { key: 'tier_8_to_30_days', label: '8 – 30 Days Overdue', min: 8, max: 30, color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)' },
    { key: 'tier_31_to_60_days', label: '31 – 60 Days Overdue', min: 31, max: 60, color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)' },
    { key: 'tier_60_plus_days', label: '60+ Days (Severe Default Risk)', min: 61, max: 99999, color: 'var(--accent-rose)', bg: 'rgba(244, 63, 94, 0.12)' },
  ];

  const tieredSummary = tiers.map(t => {
    const matching = overdueLoans.filter(l => l.days_overdue >= t.min && l.days_overdue <= t.max);
    const amount = matching.reduce((acc, l) => acc + Number(l.balance?.outstanding || l.principal_amount || 0), 0);
    return {
      ...t,
      count: matching.length,
      amount,
      percentage: totalOverdue > 0 ? (amount / totalOverdue) * 100 : 0,
      loans: matching
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Top Overdue Header Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', borderLeft: '4px solid var(--accent-rose)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <ShieldAlert size={20} color="var(--accent-rose)" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Overdue & Credit Risk Analytics</h3>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Deterministic aging distribution of delinquent balances past agreed maturity dates
            </p>
          </div>

          {/* Direction Filter Pill Switcher */}
          <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--inner-card-bg)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setDirectionFilter('all')}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: directionFilter === 'all' ? 'var(--bg-surface)' : 'transparent',
                color: directionFilter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              All Overdue ({overdueLoans.length})
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('lent')}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: directionFilter === 'lent' ? 'var(--accent-emerald)' : 'transparent',
                color: directionFilter === 'lent' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              🤝 Overdue Receivables
            </button>
            <button
              type="button"
              onClick={() => setDirectionFilter('borrowed')}
              style={{
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: directionFilter === 'borrowed' ? 'var(--accent-rose)' : 'transparent',
                color: directionFilter === 'borrowed' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              📥 Overdue Payables
            </button>
          </div>
        </div>
      </div>

      {/* 2. Aging Tier Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {tieredSummary.map(tier => (
          <div
            key={tier.key}
            className="glass-panel"
            style={{
              padding: '1.25rem 1.4rem',
              borderTop: `3px solid ${tier.color}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{tier.label}</span>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: tier.color, background: tier.bg, padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                  {tier.count} Accounts
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {isMasked ? '••••••' : `${symbol}${Number(tier.amount).toLocaleString()}`}
              </div>
            </div>

            <div style={{ marginTop: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                <span>Share of Delinquency</span>
                <span style={{ fontWeight: 700, color: tier.color }}>{tier.percentage.toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${tier.percentage}%`, height: '100%', background: tier.color, borderRadius: '999px' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Detailed Overdue Accounts Table */}
      <div className="glass-panel" style={{ padding: '1.4rem 1.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Itemized Delinquent Ledger</h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Detailed list of accounts past due date with direct recovery actions
            </p>
          </div>
          <span className="badge badge-under_review" style={{ fontSize: '0.72rem' }}>
            {overdueLoans.length} Total Overdue Records
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--inner-card-bg)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Ref / Direction</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Counterparty</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Due Date</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Days Overdue</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Outstanding</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {overdueLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    🎉 No overdue records found! All active loans and borrowings are current and on-time.
                  </td>
                </tr>
              ) : (
                overdueLoans.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div style={{ fontWeight: 700 }}>{l.loan_reference}</div>
                      <span style={{ fontSize: '0.68rem', color: l.direction === 'borrowed' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                        {l.direction === 'borrowed' ? '📥 Money Borrowed' : '🤝 Money Lent'}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600 }}>
                      {l.person_name || l.person?.name}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>
                      {l.due_date}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: l.days_overdue > 60 ? 'rgba(244,63,94,0.2)' : l.days_overdue > 30 ? 'rgba(248,113,113,0.2)' : 'rgba(245,158,11,0.2)',
                        color: l.days_overdue > 60 ? 'var(--accent-rose)' : l.days_overdue > 30 ? '#f87171' : 'var(--accent-amber)'
                      }}>
                        {l.days_overdue} days
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', fontWeight: 800, color: 'var(--accent-rose)' }}>
                      {isMasked ? maskValue(l.balance?.outstanding || l.principal_amount) : `${getCurrencySymbol(l.currency)}${Number(l.balance?.outstanding || l.principal_amount).toLocaleString()}`}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                        {onRecordPayment && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => onRecordPayment(l)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                          >
                            {l.direction === 'borrowed' ? 'Repay' : 'Collect'}
                          </button>
                        )}
                        {onGenerateStatement && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => onGenerateStatement(l)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                          >
                            Statement
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
