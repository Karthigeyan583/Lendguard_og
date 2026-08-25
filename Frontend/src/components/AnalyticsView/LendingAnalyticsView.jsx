import React from 'react';
import { BookOpen, TrendingUp, Users, Tag, Award, DollarSign } from 'lucide-react';
import { KpiCard } from './charts/KpiCard';
import { TrendLineChart } from './charts/TrendLineChart';
import { BarChart } from './charts/BarChart';
import { getCurrencySymbol, maskValue } from '../../utils/currency';

export const LendingAnalyticsView = ({
  lendingData,
  reportingCurrency = 'INR',
  isMasked = false,
  onOpenPersonDetails
}) => {
  const symbol = getCurrencySymbol(reportingCurrency);
  const summary = lendingData?.summary || {
    total_lent: 0,
    total_repaid: 0,
    total_outstanding: 0,
    total_overdue: 0,
    recovery_rate: 0,
    average_loan_size: 0,
    largest_loan: 0,
    total_agreements_count: 0
  };

  const monthlyTrends = lendingData?.monthly_trends || [];
  const sizeDistribution = (lendingData?.size_distribution || []).map(b => ({
    label: b.label,
    value: b.total_amount,
    count: b.count,
    color: 'var(--accent-emerald)'
  }));

  const purposeList = (lendingData?.purpose_breakdown || []).map(p => ({
    label: p.purpose,
    value: p.total_amount,
    count: p.count,
    color: '#06b6d4'
  }));

  const topBorrowers = lendingData?.top_borrowers || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KpiCard
          title="Total Capital Lent"
          value={summary.total_lent}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="var(--accent-emerald)"
          badge="Receivables"
        />
        <KpiCard
          title="Total Recoveries"
          value={summary.total_repaid}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="var(--accent-emerald)"
          subtitle={`Recovery Rate: ${summary.recovery_rate}%`}
        />
        <KpiCard
          title="Outstanding Receivables"
          value={summary.total_outstanding}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#38bdf8"
        />
        <KpiCard
          title="Overdue Receivables"
          value={summary.total_overdue}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="var(--accent-rose)"
        />
        <KpiCard
          title="Average Loan Size"
          value={summary.average_loan_size}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#a855f7"
          subtitle={`Largest: ${symbol}${Number(summary.largest_loan).toLocaleString()}`}
        />
        <KpiCard
          title="Active Agreements"
          value={summary.total_agreements_count}
          isCurrency={false}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#f59e0b"
          subtitle="Total lending files"
        />
      </div>

      {/* 2. Lending Trends (Monthly Lending vs Recoveries) */}
      <TrendLineChart
        title="Lending vs Recovery Trends Over Time"
        subtitle="Monthly volume of newly disbursed capital vs repayments collected from borrowers"
        data={monthlyTrends}
        series={[
          { key: 'lent', label: 'Disbursed Principal', color: 'var(--accent-emerald)' },
          { key: 'repaid', label: 'Collected Repayments', color: '#06b6d4' },
        ]}
        xAxisKey="month"
        currency={reportingCurrency}
        isMasked={isMasked}
        height={260}
      />

      {/* 3. Distribution Grid (Loan Size Bands + Purpose) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        <BarChart
          title="Loan Size Bands Distribution"
          subtitle="Portfolio capital concentration across loan amount ranges"
          data={sizeDistribution}
          currency={reportingCurrency}
          isMasked={isMasked}
          barColor="var(--accent-emerald)"
        />

        <BarChart
          title="Lending Purpose Breakdown"
          subtitle="Total capital categorized by reported borrowing reason"
          data={purposeList}
          currency={reportingCurrency}
          isMasked={isMasked}
          barColor="#06b6d4"
        />
      </div>

      {/* 4. Top Borrowers Concentration Table */}
      <div className="glass-panel" style={{ padding: '1.4rem 1.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Top Borrowers by Outstanding Balance</h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Highest counterparty credit exposure rankings
            </p>
          </div>
          <span className="badge badge-under_review" style={{ fontSize: '0.72rem' }}>
            Top {topBorrowers.length} Counterparties
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--inner-card-bg)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Rank & Name</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Relationship</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Total Lent</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Total Repaid</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Outstanding</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Recovery %</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {topBorrowers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                    No borrower records found.
                  </td>
                </tr>
              ) : (
                topBorrowers.map((b, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600 }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: '0.4rem' }}>#{idx + 1}</span>
                      {b.name}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {b.relationship}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right' }}>
                      {isMasked ? maskValue(b.total_lent) : `${symbol}${Number(b.total_lent).toLocaleString()}`}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', color: 'var(--accent-emerald)' }}>
                      {isMasked ? maskValue(b.total_repaid) : `${symbol}${Number(b.total_repaid).toLocaleString()}`}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', fontWeight: 700, color: 'var(--accent-amber)' }}>
                      {isMasked ? maskValue(b.outstanding) : `${symbol}${Number(b.outstanding).toLocaleString()}`}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', fontWeight: 700 }}>
                      {b.recovery_rate}%
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                      {onOpenPersonDetails && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => onOpenPersonDetails({ id: b.person_id, name: b.name })}
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                        >
                          Dossier
                        </button>
                      )}
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
