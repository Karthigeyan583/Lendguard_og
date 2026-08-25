import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  AlertTriangle,
  Layers,
  DollarSign,
  Users
} from 'lucide-react';
import { KpiCard } from './charts/KpiCard';
import { TrendLineChart } from './charts/TrendLineChart';
import { DonutChart } from './charts/DonutChart';
import { BarChart } from './charts/BarChart';
import { getCurrencySymbol, maskValue } from '../../utils/currency';

export const AnalyticsOverview = ({
  overviewData,
  cashflowData,
  reportingCurrency = 'INR',
  isMasked = false,
  onNavigateTab
}) => {
  const symbol = getCurrencySymbol(reportingCurrency);

  const lending = overviewData?.lending || {
    total_lent: 0,
    total_repaid: 0,
    total_outstanding: 0,
    total_overdue: 0,
    recovery_rate: 0
  };

  const borrowing = overviewData?.borrowing || {
    total_borrowed: 0,
    total_repaid: 0,
    total_outstanding: 0,
    total_overdue: 0,
    repayment_completion_rate: 0
  };

  const netPosition = overviewData?.net_position || 0;
  const isNetReceivable = netPosition > 0;
  const isNetPayable = netPosition < 0;

  // Comparison Growth
  const comp = overviewData?.comparison;

  // Currency Exposure for Donut
  const currencySlices = (overviewData?.currency_exposure || []).map((c, i) => ({
    label: c.currency,
    value: c.reporting_amount,
    count: c.loan_count
  }));

  // Cashflow timeline for Trend Line Chart
  const cashflowTimeline = cashflowData?.realized_series || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Net Position Hero Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem 2rem',
          background: isNetReceivable
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.06) 100%)'
            : isNetPayable
              ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.12) 0%, rgba(251, 146, 60, 0.06) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: `1px solid ${isNetReceivable ? 'rgba(16, 185, 129, 0.3)' : isNetPayable ? 'rgba(244, 63, 94, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Scale size={18} color={isNetReceivable ? 'var(--accent-emerald)' : isNetPayable ? 'var(--accent-rose)' : 'var(--accent-indigo)'} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Executive Net Financial Position
            </span>
          </div>

          <div style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {isMasked ? '••••••' : `${netPosition >= 0 ? '+' : ''}${symbol}${Number(Math.abs(netPosition)).toLocaleString()}`}
          </div>

          <div style={{ fontSize: '0.82rem', color: isNetReceivable ? 'var(--accent-emerald)' : isNetPayable ? 'var(--accent-rose)' : 'var(--text-muted)', fontWeight: 700, marginTop: '0.35rem' }}>
            {overviewData?.net_position_label || 'Calculated Net Position'}
          </div>
        </div>

        {/* Dual Exposure Pillars */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            minWidth: 155
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Receivables (Owed to you)
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>
              {isMasked ? '••••••' : `${symbol}${Number(lending.total_outstanding).toLocaleString()}`}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Recovery: {lending.recovery_rate}%
            </div>
          </div>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            minWidth: 155
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Payables (You owe)
            </span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '0.2rem' }}>
              {isMasked ? '••••••' : `${symbol}${Number(borrowing.total_outstanding).toLocaleString()}`}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Repaid: {borrowing.repayment_completion_rate}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KpiCard
          title="Total Capital Lent"
          value={lending.total_lent}
          currency={reportingCurrency}
          isMasked={isMasked}
          changePercent={comp?.lending_growth_percent}
          changeLabel="vs prev window"
          accentColor="var(--accent-emerald)"
          badge="Receivables"
          onClick={() => onNavigateTab && onNavigateTab('lending')}
        />
        <KpiCard
          title="Total Capital Borrowed"
          value={borrowing.total_borrowed}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#38bdf8"
          badge="Payables"
          onClick={() => onNavigateTab && onNavigateTab('borrowing')}
        />
        <KpiCard
          title="Total Recovered (Lent)"
          value={lending.total_repaid}
          currency={reportingCurrency}
          isMasked={isMasked}
          changePercent={comp?.recovery_growth_percent}
          accentColor="var(--accent-emerald)"
          subtitle={`Rate: ${lending.recovery_rate}%`}
          onClick={() => onNavigateTab && onNavigateTab('payments')}
        />
        <KpiCard
          title="Repaid to Lenders"
          value={borrowing.total_repaid}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#a855f7"
          subtitle={`Completion: ${borrowing.repayment_completion_rate}%`}
          onClick={() => onNavigateTab && onNavigateTab('payments')}
        />
        <KpiCard
          title="Overdue Receivables"
          value={lending.total_overdue}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="var(--accent-rose)"
          badge={lending.overdue_count > 0 ? `${lending.overdue_count} Overdue` : 'Clear'}
          badgeColor="rgba(244,63,94,0.2)"
          onClick={() => onNavigateTab && onNavigateTab('overdue')}
        />
        <KpiCard
          title="Overdue Payables"
          value={borrowing.total_overdue}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#fb923c"
          badge={borrowing.overdue_count > 0 ? `${borrowing.overdue_count} Overdue` : 'Clear'}
          badgeColor="rgba(251,146,60,0.2)"
          onClick={() => onNavigateTab && onNavigateTab('overdue')}
        />
      </div>

      {/* 3. Visual Charts Grid (Cash-Flow Realized Trend + Currency Exposure Donut) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        <TrendLineChart
          title="Realized Cash Flow Timeline"
          subtitle="Monthly inflows (recoveries collected) vs outflows (debt repayments made)"
          data={cashflowTimeline}
          series={[
            { key: 'inflow', label: 'Inflows (Lending Recoveries)', color: 'var(--accent-emerald)' },
            { key: 'outflow', label: 'Outflows (Borrowing Repayments)', color: 'var(--accent-rose)' },
          ]}
          xAxisKey="month"
          currency={reportingCurrency}
          isMasked={isMasked}
          height={260}
        />

        <DonutChart
          title="Multi-Currency Portfolio Share"
          subtitle="Normalized currency exposure breakdown in reporting currency"
          data={currencySlices}
          currency={reportingCurrency}
          isMasked={isMasked}
          centerLabel="Portfolio Value"
          size={210}
        />
      </div>
    </div>
  );
};
