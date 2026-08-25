import React, { useState } from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  FileText,
  Share2,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Activity,
  Layers,
  Filter
} from 'lucide-react';
import { getCurrencySymbol, getDefaultCurrency } from '../utils/currency';

export const DashboardView = ({ 
  summary, 
  loans = [], 
  people = [], 
  onRecordPaymentForLoan, 
  onGenerateStatement, 
  onOpenNewLoan,
  onOpenAddPerson,
  onOpenPersonDetails,
  onOpenDrilldown
}) => {
  const [activeCurrencyFilter, setActiveCurrencyFilter] = useState('ALL');

  // Identify distinct currencies used across loans
  const availableCurrencies = Array.from(new Set(loans.map(l => l.currency || 'INR')));
  const isMulti = availableCurrencies.length > 1;
  const reportingCurrency = summary?.reporting_currency || (loans.length > 0 && loans[0].reporting_currency) || getDefaultCurrency();
  const currSymbol = getCurrencySymbol(reportingCurrency);

  // Filter urgent active loans
  const overdueLoans = loans.filter(
    l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) &&
         l.status !== 'PAID' && l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF'
  );
  const dueSoonLoans = loans.filter(
    l => (l.time_status === 'DUE_SOON' || l.time_status === 'DUE_TODAY') &&
         l.status !== 'PAID' && l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF'
  );

  // Group raw unmixed totals per currency directly from transaction records
  const totalsByCurrency = {};
  availableCurrencies.forEach((curr) => {
    const currLoans = loans.filter(l => (l.currency || 'INR') === curr && l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF');
    const currOverdue = currLoans.filter(l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) && l.status !== 'PAID');
    const lent = currLoans.reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
    const repaid = currLoans.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
    const outstanding = currLoans.reduce((acc, l) => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID') ? acc + Number(l.balance?.outstanding || 0) : acc, 0);
    const overdue = currOverdue.reduce((acc, l) => acc + Number(l.balance?.outstanding || 0), 0);
    const recovery = lent > 0 ? Number(((repaid / lent) * 100).toFixed(1)) : 0;
    totalsByCurrency[curr] = {
      currency: curr,
      lent,
      repaid,
      outstanding,
      overdue,
      recovery,
      loansCount: currLoans.length,
      overdueCount: currOverdue.length
    };
  });

  // Selected view data (either single currency or split)
  const singleCurr = activeCurrencyFilter !== 'ALL' ? activeCurrencyFilter : availableCurrencies[0] || 'INR';
  const singleStats = totalsByCurrency[singleCurr] || { lent: 0, repaid: 0, outstanding: 0, overdue: 0, recovery: 0, loansCount: 0, overdueCount: 0 };
  const isSplitView = activeCurrencyFilter === 'ALL' && isMulti;

  const totalLoansCount = activeCurrencyFilter === 'ALL' ? loans.length : (totalsByCurrency[singleCurr]?.loansCount || 0);
  const overdueCount = activeCurrencyFilter === 'ALL' ? overdueLoans.length : (totalsByCurrency[singleCurr]?.overdueCount || 0);
  const dueSoonCount = dueSoonLoans.length;
  const activeDebtorsCount = people.filter(p => Number(p.outstanding_balance || 0) > 0).length;
  const recoveryRate = singleStats.recovery || 0;

  // Samsung One UI Stacked Card Deck state & gesture handling
  const [activeStackIndex, setActiveStackIndex] = useState(0);
  const touchStartY = React.useRef(null);
  const lastWheelTime = React.useRef(0);

  const nextStack = () => {
    if (people.length <= 1) return;
    setActiveStackIndex(prev => (prev + 1) % people.length);
  };

  const prevStack = () => {
    if (people.length <= 1) return;
    setActiveStackIndex(prev => (prev - 1 + people.length) % people.length);
  };

  const handleStackWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 300) return;
    if (Math.abs(e.deltaY) > 15) {
      lastWheelTime.current = now;
      if (e.deltaY > 0) {
        nextStack();
      } else {
        prevStack();
      }
    }
  };

  const handleStackTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleStackTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    if (diff > 30) {
      nextStack();
    } else if (diff < -30) {
      prevStack();
    }
    touchStartY.current = null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Currency Switcher Strip (when multiple currencies exist) */}
      {isMulti && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          background: 'var(--inner-card-bg)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={16} color="var(--accent-indigo)" />
            <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>
              Currency Split View:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              className={`btn ${activeCurrencyFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-full)' }}
              onClick={() => setActiveCurrencyFilter('ALL')}
            >
              All Currencies (Split Breakdown)
            </button>
            {availableCurrencies.map(curr => (
              <button
                key={curr}
                className={`btn ${activeCurrencyFilter === curr ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', borderRadius: 'var(--radius-full)' }}
                onClick={() => setActiveCurrencyFilter(curr)}
              >
                {curr} ({getCurrencySymbol(curr)})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4 Main KPI Cards (Split by exact currencies) */}
      <div className="stats-grid">
        {/* Total Lent */}
        <div
          className="glass-panel kpi-card kpi-lent"
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.18s ease' }}
          onClick={() => onOpenDrilldown && onOpenDrilldown('lent')}
          title="Click to view full breakdown of capital lent"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL CAPITAL LENT</span>
            <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={19} color="var(--accent-blue)" />
            </div>
          </div>

          {isSplitView ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.35rem' }}>
              {availableCurrencies.map(curr => (
                <div key={curr} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: availableCurrencies.length > 2 ? '1.25rem' : '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    {getCurrencySymbol(curr)}{Number(totalsByCurrency[curr].lent).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{curr}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              {getCurrencySymbol(singleCurr)}{Number(singleStats.lent).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{singleCurr}</span>
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Across {totalLoansCount} lending {totalLoansCount === 1 ? 'record' : 'records'}
          </div>
        </div>

        {/* Total Repaid */}
        <div
          className="glass-panel kpi-card kpi-repaid"
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.18s ease' }}
          onClick={() => onOpenDrilldown && onOpenDrilldown('repaid')}
          title="Click to view total repayments and collection ledger"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL REPAID</span>
            <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={19} color="var(--accent-emerald)" />
            </div>
          </div>

          {isSplitView ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.35rem' }}>
              {availableCurrencies.map(curr => (
                <div key={curr} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: availableCurrencies.length > 2 ? '1.25rem' : '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '-0.02em' }}>
                    {getCurrencySymbol(curr)}{Number(totalsByCurrency[curr].repaid).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {curr} ({totalsByCurrency[curr].recovery}%)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              {getCurrencySymbol(singleCurr)}{Number(singleStats.repaid).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>{singleCurr}</span>
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {isSplitView ? 'Recovery rate indicated per currency' : `Recovery Rate: ${singleStats.recovery}%`}
          </div>
        </div>

        {/* Net Outstanding */}
        <div
          className="glass-panel kpi-card kpi-outstanding"
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.18s ease' }}
          onClick={() => onOpenDrilldown && onOpenDrilldown('outstanding')}
          title="Click to view net outstanding loans and debtors"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>NET OUTSTANDING BALANCE</span>
            <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={19} color="var(--accent-cyan)" />
            </div>
          </div>

          {isSplitView ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.35rem' }}>
              {availableCurrencies.map(curr => (
                <div key={curr} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: availableCurrencies.length > 2 ? '1.25rem' : '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '-0.02em' }}>
                    {getCurrencySymbol(curr)}{Number(totalsByCurrency[curr].outstanding).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{curr}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              {getCurrencySymbol(singleCurr)}{Number(singleStats.outstanding).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>{singleCurr}</span>
            </div>
          )}

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {activeDebtorsCount > 0 
              ? `Owed across ${activeDebtorsCount} active ${activeDebtorsCount === 1 ? 'borrower' : 'borrowers'}`
              : `Zero outstanding balance across contacts`}
          </div>
        </div>

        {/* Total Overdue */}
        <div
          className="glass-panel kpi-card kpi-overdue"
          style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.18s ease' }}
          onClick={() => onOpenDrilldown && onOpenDrilldown('overdue')}
          title="Click to view detailed overdue loans report"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>OVERDUE AMOUNT</span>
            <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={19} color="var(--accent-rose)" />
            </div>
          </div>

          {isSplitView ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.35rem' }}>
              {availableCurrencies.filter(c => totalsByCurrency[c].overdue > 0).length > 0 ? (
                availableCurrencies.filter(c => totalsByCurrency[c].overdue > 0).map(curr => (
                  <div key={curr} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: availableCurrencies.length > 2 ? '1.25rem' : '1.5rem', fontWeight: 800, color: 'var(--accent-rose)', letterSpacing: '-0.02em' }}>
                      {getCurrencySymbol(curr)}{Number(totalsByCurrency[curr].overdue).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
                      {curr} ({totalsByCurrency[curr].overdueCount} {totalsByCurrency[curr].overdueCount === 1 ? 'loan' : 'loans'})
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  0.00 <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>All up to date</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: singleStats.overdue > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              {getCurrencySymbol(singleCurr)}{Number(singleStats.overdue).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{singleCurr}</span>
            </div>
          )}

          {overdueCount > 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>
              {overdueCount} {overdueCount === 1 ? 'loan requires' : 'loans require'} immediate attention
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
              ✓ All loan repayments are up to date
            </div>
          )}
        </div>
      </div>

      {/* Multi-Currency Breakdown Strip (if loans in multiple currencies exist) */}
      {summary?.currency_breakdown && Object.keys(summary.currency_breakdown).length > 1 && (
        <div
          className="glass-panel"
          style={{
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: 'rgba(99, 102, 241, 0.06)',
            borderColor: 'rgba(99, 102, 241, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={17} color="var(--accent-indigo)" />
            <div>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                Multi-Currency Portfolio Breakdown
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 6 }}>
                (Normalized into {reportingCurrency} Base Currency)
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(summary.currency_breakdown).map(([code, stats]) => (
              <span
                key={code}
                className="badge"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.7rem',
                  background: 'var(--inner-card-bg)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <strong>{getCurrencySymbol(code)}{Number(stats.total_lent).toLocaleString()} {code}</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                  ({getCurrencySymbol(code)}{Number(stats.outstanding).toLocaleString()} owed)
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recovery Progress Bar Strip */}
      <div
        className="glass-panel dashboard-item-card"
        style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'all 0.18s ease' }}
        onClick={() => onOpenDrilldown && onOpenDrilldown('repaid')}
        title="Click to view repayment ledger"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Overall Portfolio Recovery Progress</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {isSplitView
              ? availableCurrencies.map(c => `${c}: ${totalsByCurrency[c]?.recovery || 0}%`).join(' • ')
              : `${recoveryRate}% Settled`
            }
          </span>
        </div>
        <div style={{ height: 10, background: 'var(--bg-surface)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${Math.min(100, Math.max(0, recoveryRate))}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Two Column Layout: Urgent Follow-ups + Recent Activity */}
      <div className="dashboard-layout">
        {/* Left: Urgent Attention & Reminders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Overdue Section */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-rose)', boxShadow: '0 0 8px var(--accent-rose)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Overdue Follow-ups</h3>
              </div>
              <span className="badge badge-rejected">{overdueLoans.length} Overdue</span>
            </div>

            {overdueLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ✓ No overdue loans! All repayments are up to date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {overdueLoans.map((l) => (
                  <div key={l.id} className="dashboard-item-card" style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{l.person_name || 'Borrower'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Loan: #{l.loan_reference} • Due: {l.due_date} (<strong style={{ color: 'var(--accent-rose)' }}>{l.days_overdue} days overdue</strong>)
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '0.2rem' }}>
                        {getCurrencySymbol(l.currency)}{Number(l.balance?.outstanding || l.principal_amount).toLocaleString()} Outstanding
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => onRecordPaymentForLoan(l)}
                      >
                        Record Repayment
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => onGenerateStatement(l)}
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Due Soon Section */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-amber)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Due Dates (Next 7 Days)</h3>
              </div>
              <span className="badge badge-under_review">{dueSoonLoans.length} Due Soon</span>
            </div>

            {dueSoonLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No loans due in the next 7 days.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {dueSoonLoans.map((l) => (
                  <div key={l.id} className="dashboard-item-card" style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.9rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{l.person_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Due on: {l.due_date} • Owed: {getCurrencySymbol(l.currency)}{Number(l.balance?.outstanding || l.principal_amount).toLocaleString()}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => onRecordPaymentForLoan(l)}
                    >
                      Collect Repayment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Action Hub & People Exposure Snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions Hub */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                onClick={onOpenNewLoan}
              >
                <Plus size={18} />
                <span>Record New Money Lent</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                onClick={onOpenAddPerson}
              >
                <Users size={18} />
                <span>Add Borrower / Contact</span>
              </button>
            </div>
          </div>

          {/* Samsung Now Bar: 3D Stacked Card Deck */}
          <div className="samsung-now-bar-panel" style={{ padding: '1.25rem' }}>
            {/* Header with Live Now Indicator & Stack Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
                }}>
                  <Sparkles size={14} color="#ffffff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                      Borrower Exposure
                    </h3>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--accent-emerald)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-emerald)', animation: 'pulse-green 1.5s infinite' }} />
                      STACK DECK
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Scroll / swipe vertically to flick cards ({people.length > 0 ? `${activeStackIndex + 1} of ${people.length}` : '0'})
                  </span>
                </div>
              </div>

              {people.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    className="now-bar-nav-btn"
                    onClick={prevStack}
                    title="Previous stacked card"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    className="now-bar-nav-btn"
                    onClick={nextStack}
                    title="Next stacked card"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Stack Deck Body */}
            {people.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No contacts yet. Click "Add Borrower" above to get started!
              </div>
            ) : (
              <div
                className="samsung-stack-container"
                onWheel={handleStackWheel}
                onTouchStart={handleStackTouchStart}
                onTouchEnd={handleStackTouchEnd}
              >
                <div className="samsung-stack-wrapper">
                  {people.map((p, idx) => {
                    const offset = (idx - activeStackIndex + people.length) % people.length;
                    const isVisible = offset < 3;
                    const translateY = offset * 14;
                    const scale = 1 - offset * 0.05;
                    const opacity = offset === 0 ? 1 : offset === 1 ? 0.82 : offset === 2 ? 0.55 : 0;
                    const zIndex = 10 - offset;

                    const pLoans = loans.filter((l) => {
                      if (l.person === p.id) return true;
                      if (typeof l.person === 'object' && l.person?.id === p.id) return true;
                      if (l.person_name && p.name && l.person_name.toLowerCase() === p.name.toLowerCase()) return true;
                      return false;
                    });
                    const pCurrs = Array.from(new Set(pLoans.map(l => l.currency || 'INR')));
                    const pLent = pLoans.reduce((acc, l) => l.status !== 'CANCELLED' ? acc + Number(l.principal_amount || 0) : acc, 0);
                    const pRepaid = pLoans.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
                    const pOut = pLoans.reduce((acc, l) => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID') ? acc + Number(l.balance?.outstanding || 0) : acc, 0);
                    const pRecRate = pLent > 0 ? Math.min(100, Math.round((pRepaid / pLent) * 100)) : 100;
                    const isOverdue = pLoans.some(l => (l.days_overdue > 0 || l.time_status === 'OVERDUE') && l.status !== 'PAID');

                    return (
                      <div
                        key={p.id}
                        className="samsung-stack-card"
                        style={{
                          transform: `translateY(${translateY}px) scale(${scale})`,
                          opacity: opacity,
                          zIndex: zIndex,
                          pointerEvents: isVisible ? 'auto' : 'none',
                          cursor: offset === 0 ? 'pointer' : 'pointer'
                        }}
                        onClick={() => {
                          if (offset === 0) {
                            if (onOpenPersonDetails) onOpenPersonDetails(p);
                          } else {
                            setActiveStackIndex(idx);
                          }
                        }}
                        title={offset === 0 ? `Click to view full dossier for ${p.name}` : `Click to bring ${p.name} to front`}
                      >
                        {/* Top: Avatar, Name & Status */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              color: '#fff',
                              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
                              flexShrink: 0
                            }}>
                              {p.name ? p.name.charAt(0).toUpperCase() : 'B'}
                            </div>
                            <div>
                              <strong style={{ fontSize: '0.95rem', display: 'block', letterSpacing: '-0.01em' }}>
                                {p.name}
                              </strong>
                              <span className="badge-role" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', marginTop: '0.15rem', display: 'inline-block' }}>
                                {p.relationship || 'Contact'}
                              </span>
                            </div>
                          </div>

                          <span
                            className="badge"
                            style={{
                              fontSize: '0.62rem',
                              padding: '0.2rem 0.5rem',
                              background: isOverdue ? 'rgba(244, 63, 94, 0.15)' : pOut === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                              color: isOverdue ? 'var(--accent-rose)' : pOut === 0 ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
                              borderColor: isOverdue ? 'rgba(244, 63, 94, 0.3)' : pOut === 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'
                            }}
                          >
                            {isOverdue ? 'OVERDUE' : pOut === 0 ? 'SETTLED' : 'ACTIVE'}
                          </span>
                        </div>

                        {/* Middle: Owed Balance in Real Currency */}
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          padding: '0.75rem 0.9rem',
                          marginBottom: '0.75rem'
                        }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                            Owed Capital Balance
                          </span>

                          {pCurrs.length > 1 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem' }}>
                              {pCurrs.map(curr => {
                                const cLoans = pLoans.filter(l => (l.currency || 'INR') === curr);
                                const cOut = cLoans.reduce((acc, l) => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID') ? acc + Number(l.balance?.outstanding || 0) : acc, 0);
                                return (
                                  <div key={curr} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: cOut > 0 ? 'var(--accent-cyan)' : 'var(--accent-emerald)' }}>
                                      {getCurrencySymbol(curr)}{cOut.toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{curr}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: pOut > 0 ? 'var(--accent-cyan)' : 'var(--accent-emerald)', marginTop: '0.2rem' }}>
                              {getCurrencySymbol(pCurrs[0] || 'INR')}{pOut.toLocaleString()} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{pCurrs[0] || 'INR'}</span>
                            </div>
                          )}
                        </div>

                        {/* Recovery Rate Mini Bar */}
                        <div style={{ marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Recovery Progress</span>
                            <strong style={{ color: 'var(--accent-emerald)' }}>{pRecRate}% Settled</strong>
                          </div>
                          <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${pRecRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', transition: 'width 0.4s ease' }} />
                          </div>
                        </div>

                        {/* Bottom Action Prompt */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--accent-indigo)'
                        }}>
                          <span>{pLoans.length} {pLoans.length === 1 ? 'Loan Record' : 'Loan Records'}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            {offset === 0 ? 'Open Dossier' : 'Bring to Front'} <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stack Navigation Dots Indicator */}
                {people.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginTop: '1.25rem' }}>
                    {people.map((p, idx) => (
                      <div
                        key={p.id}
                        className={`now-bar-dot ${activeStackIndex === idx ? 'active' : 'inactive'}`}
                        onClick={() => setActiveStackIndex(idx)}
                        title={`Flick to ${p.name}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
