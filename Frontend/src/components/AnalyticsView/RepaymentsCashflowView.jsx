import React from 'react';
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { KpiCard } from './charts/KpiCard';
import { TrendLineChart } from './charts/TrendLineChart';
import { DonutChart } from './charts/DonutChart';
import { getCurrencySymbol, maskValue } from '../../utils/currency';

export const RepaymentsCashflowView = ({
  paymentsData,
  cashflowData,
  reportingCurrency = 'INR',
  isMasked = false
}) => {
  const symbol = getCurrencySymbol(reportingCurrency);

  const summary = paymentsData?.summary || {
    total_payments_count: 0,
    total_payments_value: 0,
    average_payment: 0,
    median_payment: 0,
    largest_payment: 0
  };

  const behavior = paymentsData?.behavior || {
    on_time_payments: 0,
    late_payments: 0,
    early_payments: 0,
    average_days_late: 0,
    on_time_percentage: 100
  };

  const methodSlices = (paymentsData?.payment_methods || []).map((m, i) => ({
    label: m.method,
    value: m.total_amount,
    count: m.count
  }));

  const forecastSeries = cashflowData?.forward_projection_series || [];
  const forecastWindows = cashflowData?.forecast_windows || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KpiCard
          title="Total Repayments Value"
          value={summary.total_payments_value}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="var(--accent-emerald)"
          badge={`${summary.total_payments_count} Transactions`}
        />
        <KpiCard
          title="Average Payment"
          value={summary.average_payment}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#06b6d4"
        />
        <KpiCard
          title="Median Payment"
          value={summary.median_payment}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#a855f7"
        />
        <KpiCard
          title="Largest Payment"
          value={summary.largest_payment}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#f59e0b"
        />
        <KpiCard
          title="On-Time Repayment Rate"
          value={behavior.on_time_percentage}
          isPercentage={true}
          isCurrency={false}
          isMasked={isMasked}
          accentColor="var(--accent-emerald)"
          subtitle={`${behavior.on_time_payments} on-time vs ${behavior.late_payments} late`}
        />
        <KpiCard
          title="Avg Days Late"
          value={behavior.average_days_late}
          isCurrency={false}
          isMasked={isMasked}
          accentColor="var(--accent-rose)"
          subtitle="On overdue settlements"
        />
      </div>

      {/* 2. 12-Month Forward Cash-Flow Forecasting */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>12-Month Forward Cash-Flow Forecast</h4>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                PROJECTED / ESTIMATED
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Projected monthly inflows from scheduled loan maturities vs debt outflows to creditors
            </p>
          </div>
        </div>

        {/* Forecast Horizon Windows */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {forecastWindows.map((w) => (
            <div
              key={w.key}
              style={{
                background: 'var(--inner-card-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 0.9rem'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{w.label}</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: w.projected_net_position >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', margin: '0.2rem 0' }}>
                {isMasked ? '••••••' : `${w.projected_net_position >= 0 ? '+' : ''}${symbol}${Number(w.projected_net_position).toLocaleString()}`}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                In: {isMasked ? '••••••' : `${symbol}${Number(w.expected_inflows).toLocaleString()}`} • Out: {isMasked ? '••••••' : `${symbol}${Number(w.expected_outflows).toLocaleString()}`}
              </div>
            </div>
          ))}
        </div>

        <TrendLineChart
          title="Projected Monthly Inflows vs Outflows"
          subtitle="Forward timeline projection curve (12 months forward)"
          data={forecastSeries}
          series={[
            { key: 'inflow', label: 'Expected Inflows (Receivables Due)', color: 'var(--accent-emerald)' },
            { key: 'outflow', label: 'Expected Outflows (Payables Due)', color: 'var(--accent-rose)' },
            { key: 'net', label: 'Projected Net Cashflow', color: '#38bdf8' },
          ]}
          xAxisKey="month"
          currency={reportingCurrency}
          isMasked={isMasked}
          height={240}
        />
      </div>

      {/* 3. Payment Methods Distribution */}
      <DonutChart
        title="Payment Methods Distribution"
        subtitle="Repayments volume share by transfer channel (UPI, Cash, Bank Transfer, Cheque)"
        data={methodSlices}
        currency={reportingCurrency}
        isMasked={isMasked}
        centerLabel="Total Settled"
        size={210}
      />
    </div>
  );
};
