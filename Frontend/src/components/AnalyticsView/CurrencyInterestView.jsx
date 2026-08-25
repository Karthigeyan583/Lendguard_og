import React from 'react';
import { DollarSign, Percent, Globe, ArrowRightLeft } from 'lucide-react';
import { KpiCard } from './charts/KpiCard';
import { DonutChart } from './charts/DonutChart';
import { getCurrencySymbol, maskValue, CURRENCY_MAP } from '../../utils/currency';

export const CurrencyInterestView = ({
  overviewData,
  loans = [],
  reportingCurrency = 'INR',
  isMasked = false
}) => {
  const symbol = getCurrencySymbol(reportingCurrency);
  const currencyExposure = overviewData?.currency_exposure || [];

  // Compute interest metrics
  let totalInterestEarned = 0;
  let totalInterestPayable = 0;
  let withInterestCount = 0;

  loans.forEach(l => {
    const rate = Number(l.interest_rate || 0);
    const fee = Number(l.fixed_fee_amount || 0);
    if (rate > 0 || fee > 0) withInterestCount++;

    const pAmt = Number(l.reporting_principal_amount || l.principal_amount || 0);
    const estInterest = rate > 0 ? (pAmt * (rate / 100)) : fee;
    if (l.direction === 'borrowed') {
      totalInterestPayable += estInterest;
    } else {
      totalInterestEarned += estInterest;
    }
  });

  const donutSlices = currencyExposure.map(c => ({
    label: c.currency,
    value: c.reporting_amount,
    count: c.loan_count
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <KpiCard
          title="Active Currencies"
          value={currencyExposure.length}
          isCurrency={false}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#38bdf8"
          subtitle={`Reporting Base: ${reportingCurrency}`}
        />
        <KpiCard
          title="Est. Interest Receivable (Lent)"
          value={totalInterestEarned}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="var(--accent-emerald)"
          badge="Lending Interest"
        />
        <KpiCard
          title="Est. Interest Payable (Debt)"
          value={totalInterestPayable}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="var(--accent-rose)"
          badge="Borrowing Cost"
        />
        <KpiCard
          title="Interest-Bearing Agreements"
          value={withInterestCount}
          isCurrency={false}
          currency={reportingCurrency}
          isMasked={isMasked}
          accentColor="#f59e0b"
          subtitle={`Out of ${loans.length} agreements`}
        />
      </div>

      {/* 2. Visual Currency Exposure Share */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        <DonutChart
          title="Multi-Currency Exposure Share"
          subtitle="Proportion of total gross portfolio by transaction currency"
          data={donutSlices}
          currency={reportingCurrency}
          isMasked={isMasked}
          centerLabel="Gross Value"
          size={210}
        />

        {/* Multi-Currency Reconciled Table */}
        <div className="glass-panel" style={{ padding: '1.4rem 1.6rem' }}>
          <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: 700 }}>Currency Parity & Exposure Table</h4>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Original principal amounts reconciled into {reportingCurrency} reporting base
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--inner-card-bg)', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>Currency</th>
                  <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>Original Lent</th>
                  <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>Original Borrowed</th>
                  <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>Total in {reportingCurrency}</th>
                  <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>Share %</th>
                </tr>
              </thead>
              <tbody>
                {currencyExposure.map((c, idx) => {
                  const cSymbol = getCurrencySymbol(c.currency);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>
                        {c.currency} ({cSymbol})
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--accent-emerald)' }}>
                        {isMasked ? maskValue(c.original_lent) : `${cSymbol}${Number(c.original_lent).toLocaleString()}`}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', color: 'var(--accent-rose)' }}>
                        {isMasked ? maskValue(c.original_borrowed) : `${cSymbol}${Number(c.original_borrowed).toLocaleString()}`}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>
                        {isMasked ? maskValue(c.reporting_amount) : `${symbol}${Number(c.reporting_amount).toLocaleString()}`}
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {c.portfolio_percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
