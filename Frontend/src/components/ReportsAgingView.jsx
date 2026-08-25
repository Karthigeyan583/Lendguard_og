import React, { useState } from 'react';
import { AlertTriangle, Clock, Calendar, ArrowDownLeft, FileText, CheckCircle2 } from 'lucide-react';
import { getDefaultCurrency, getCurrencySymbol, maskValue } from '../utils/currency';

export const ReportsAgingView = ({ agingData, loans = [], onRecordPayment, onGenerateStatement, isMasked = false }) => {
  const [directionFilter, setDirectionFilter] = useState('all'); // 'all', 'lent', 'borrowed'

  const buckets = agingData?.buckets || {
    tier_0_to_7_days: { count: 0, amount: 0, loans: [] },
    tier_8_to_30_days: { count: 0, amount: 0, loans: [] },
    tier_31_to_60_days: { count: 0, amount: 0, loans: [] },
    tier_60_plus_days: { count: 0, amount: 0, loans: [] }
  };

  const defSymbol = getCurrencySymbol(getDefaultCurrency());

  const overdueLoans = loans.filter(l => {
    if (l.days_overdue <= 0 || l.status === 'PAID' || l.status === 'CANCELLED' || l.status === 'WRITTEN_OFF') return false;
    if (directionFilter === 'lent' && l.direction === 'borrowed') return false;
    if (directionFilter === 'borrowed' && l.direction !== 'borrowed') return false;
    return true;
  });

  const totalOverdue = overdueLoans.reduce((acc, l) => acc + Number(l.balance?.outstanding || l.principal_amount || 0), 0);

  const tiers = [
    { key: 'tier_0_to_7_days', label: '0 – 7 Days Overdue', color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
    { key: 'tier_8_to_30_days', label: '8 – 30 Days Overdue', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.3)' },
    { key: 'tier_31_to_60_days', label: '31 – 60 Days Overdue', color: '#f87171', bg: 'rgba(248, 113, 113, 0.12)', border: 'rgba(248, 113, 113, 0.3)' },
    { key: 'tier_60_plus_days', label: '60+ Days (Severe Overdue)', color: 'var(--accent-rose)', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Overdue Aging Analysis & Recovery Report</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Deterministic breakdown of unpaid loan and debt balances categorized by days past agreed due date
            </p>
          </div>

          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.6rem 1.25rem',
            textAlign: 'right'
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-rose)', fontWeight: 700, textTransform: 'uppercase' }}>
              {directionFilter === 'borrowed' ? 'Overdue Debt (You Owe)' : directionFilter === 'lent' ? 'Overdue Receivables (Owed to You)' : 'Total Overdue Balance'}
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
              {isMasked ? '••••••' : `${defSymbol}${Number(totalOverdue).toLocaleString()}`}
            </div>
          </div>
        </div>

        {/* Direction Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--inner-card-bg)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
          <button
            type="button"
            onClick={() => setDirectionFilter('all')}
            style={{
              padding: '0.35rem 0.8rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: directionFilter === 'all' ? 'var(--bg-surface)' : 'transparent',
              color: directionFilter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            All Overdue
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('lent')}
            style={{
              padding: '0.35rem 0.8rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
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
              padding: '0.35rem 0.8rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: directionFilter === 'borrowed' ? 'var(--accent-indigo)' : 'transparent',
              color: directionFilter === 'borrowed' ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            📥 Overdue Payables
          </button>
        </div>
      </div>

      {/* 4 Aging Tier Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {tiers.map((tier) => {
          const tierData = buckets[tier.key] || { count: 0, amount: 0 };
          return (
            <div
              key={tier.key}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                border: `1px solid ${tier.border}`,
                background: 'var(--bg-card)',
                position: 'relative'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: tier.color, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {tier.label}
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: tier.color, marginBottom: '0.25rem' }}>
                {isMasked ? '••••••' : `${defSymbol}${Number(tierData.amount).toLocaleString()}`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {tierData.count} {tierData.count === 1 ? 'loan' : 'loans'} in this aging tier
              </div>
            </div>
          );
        })}
      </div>

      {/* Overdue Loans List */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Detailed Overdue Items ({overdueLoans.length})
        </h3>
        {overdueLoans.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ marginBottom: '0.75rem' }} />
            <div>All repayments are currently up to date! Zero overdue balances.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {overdueLoans.map((l) => {
              const isBorrowing = (l.direction === 'borrowed');
              return (
                <div
                  key={l.id}
                  style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1rem' }}>{l.person_name}</strong>
                      <span className="badge" style={{
                        background: isBorrowing ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
                        fontSize: '0.68rem',
                        fontWeight: 700
                      }}>
                        {isBorrowing ? '📥 You Owe' : '🤝 Owes You'}
                      </span>
                      <span className="badge badge-rejected">{l.days_overdue} Days Overdue</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      #{l.loan_reference} • Due Date: {l.due_date} • Purpose: {l.purpose || 'Personal'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
                        {isMasked ? `${getCurrencySymbol(l.currency)}••••••` : `${getCurrencySymbol(l.currency)}${Number(l.balance?.outstanding || l.principal_amount).toLocaleString()}`}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Original: {isMasked ? `${getCurrencySymbol(l.currency)}••••••` : `${getCurrencySymbol(l.currency)}${Number(l.principal_amount).toLocaleString()}`}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.78rem',
                          background: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
                          borderColor: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)'
                        }}
                        onClick={() => onRecordPayment(l)}
                      >
                        <ArrowDownLeft size={14} />
                        <span>{isBorrowing ? 'Pay' : 'Collect'}</span>
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem' }}
                        onClick={() => onGenerateStatement(l)}
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
