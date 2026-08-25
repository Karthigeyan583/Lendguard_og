import React from 'react';
import { TrendingUp, Clock, AlertTriangle, ShieldCheck, ArrowDownLeft } from 'lucide-react';
import { KpiCard } from './charts/KpiCard';
import { TrendLineChart } from './charts/TrendLineChart';
import { getCurrencySymbol, maskValue } from '../../utils/currency';

export const BorrowingAnalyticsView = ({
  borrowingData,
  reportingCurrency = 'INR',
  isMasked = false,
  onOpenPersonDetails,
  onRecordPayment
}) => {
  const symbol = getCurrencySymbol(reportingCurrency);
  const summary = borrowingData?.summary || {
    total_borrowed: 0,
    total_repaid: 0,
    total_outstanding_payable: 0,
    total_overdue_payable: 0,
    repayment_completion_rate: 0,
    average_borrowing_size: 0,
    active_obligations_count: 0
  };

  const monthlyTrends = borrowingData?.monthly_trends || [];
  const topLenders = borrowingData?.top_lenders || [];
  const upcomingObligations = borrowingData?.upcoming_obligations || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KpiCard
          title="Total Capital Borrowed"
          value={summary.total_borrowed}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#38bdf8"
          badge="Payables"
        />
        <KpiCard
          title="Repaid to Lenders"
          value={summary.total_repaid}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="var(--accent-emerald)"
          subtitle={`Completion: ${summary.repayment_completion_rate}%`}
        />
        <KpiCard
          title="Outstanding Debt (You Owe)"
          value={summary.total_outstanding_payable}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="var(--accent-rose)"
        />
        <KpiCard
          title="Overdue Payables"
          value={summary.total_overdue_payable}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#fb923c"
        />
        <KpiCard
          title="Average Borrowing"
          value={summary.average_borrowing_size}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#a855f7"
        />
        <KpiCard
          title="Active Obligations"
          value={summary.active_obligations_count}
          isCurrency={false}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#f59e0b"
          subtitle="Open liability files"
        />
      </div>

      {/* 2. Borrowing & Debt Repayment Pace Over Time */}
      <TrendLineChart
        title="Borrowing & Repayment Pace"
        subtitle="Monthly volume of borrowed capital vs repayments made to lenders"
        data={monthlyTrends}
        series={[
          { key: 'borrowed', label: 'Borrowed Capital', color: '#38bdf8' },
          { key: 'repaid', label: 'Repayments to Lenders', color: 'var(--accent-emerald)' },
        ]}
        xAxisKey="month"
        currency={reportingCurrency}
        isMasked={isMasked}
        height={260}
      />

      {/* 3. Upcoming Obligations & Top Lenders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Upcoming Maturing Debts */}
        <div className="glass-panel" style={{ padding: '1.4rem 1.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Upcoming Repayment Obligations</h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Agreed debt obligations due soon to lenders
              </p>
            </div>
            <span className="badge badge-under_review" style={{ fontSize: '0.72rem' }}>
              {upcomingObligations.length} Due Soon
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {upcomingObligations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No borrowing obligations due in the immediate schedule.
              </div>
            ) : (
              upcomingObligations.map((o) => (
                <div
                  key={o.id}
                  style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{o.lender_name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Due: {o.due_date} • <span style={{ color: o.days_remaining <= 3 ? 'var(--accent-rose)' : 'var(--accent-amber)', fontWeight: 600 }}>{o.days_remaining} days left</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--accent-rose)', fontSize: '0.92rem' }}>
                      {isMasked ? maskValue(o.outstanding_payable) : `${getCurrencySymbol(o.currency)}${Number(o.outstanding_payable).toLocaleString()}`}
                    </div>
                    {onRecordPayment && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => onRecordPayment(o)}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem', marginTop: '0.2rem' }}
                      >
                        Repay Debt
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Lenders Ranking */}
        <div className="glass-panel" style={{ padding: '1.4rem 1.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Top Lenders (Liabilities)</h4>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Largest outstanding liabilities by lender
              </p>
            </div>
            <span className="badge badge-under_review" style={{ fontSize: '0.72rem' }}>
              Top {topLenders.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topLenders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No lender records found.
              </div>
            ) : (
              topLenders.map((l, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                      <span style={{ color: 'var(--text-muted)', marginRight: '0.35rem' }}>#{idx + 1}</span>
                      {l.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Total Borrowed: {isMasked ? '••••' : `${symbol}${Number(l.total_borrowed).toLocaleString()}`} • Repaid: {l.completion_rate}%
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--accent-rose)', fontSize: '0.92rem' }}>
                      {isMasked ? maskValue(l.outstanding_payable) : `${symbol}${Number(l.outstanding_payable).toLocaleString()}`}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Unpaid liability</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
