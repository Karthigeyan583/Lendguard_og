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
  Filter,
  Check
} from 'lucide-react';
import { getCurrencySymbol, getDefaultCurrency, convertCurrency } from '../utils/currency';

export const DashboardView = ({ 
  summary, 
  loans = [], 
  people = [], 
  onRecordPaymentForLoan, 
  onGenerateStatement, 
  onOpenNewLoan,
  onOpenAddPerson,
  onOpenPersonDetails,
  onOpenDrilldown,
  isMasked = false
}) => {
  const [activeCurrencyFilter, setActiveCurrencyFilter] = useState('ALL');
  const [showCurrencySplitDropdown, setShowCurrencySplitDropdown] = useState(false);
  const [dashboardDirection, setDashboardDirection] = useState('overview'); // 'overview', 'lent', 'borrowed'

  // Identify distinct currencies used across loans
  const availableCurrencies = Array.from(new Set(loans.map(l => l.currency || 'INR')));
  const isMulti = availableCurrencies.length > 1;
  const reportingCurrency = summary?.reporting_currency || getDefaultCurrency();
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

  // Separate lending vs borrowing
  const lentLoans = loans.filter(l => l.direction !== 'borrowed');
  const borrowedLoans = loans.filter(l => l.direction === 'borrowed');

  // 1. Consolidated Portfolio Normalized in Reporting Base Currency
  const consolidatedLent = lentLoans.reduce((acc, l) => acc + convertCurrency(l.principal_amount || 0, l.currency, reportingCurrency), 0);
  const consolidatedLentRepaid = lentLoans.reduce((acc, l) => acc + convertCurrency(l.balance?.total_repaid || 0, l.currency, reportingCurrency), 0);
  const consolidatedLentOutstanding = lentLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID').reduce((acc, l) => acc + convertCurrency(l.balance?.outstanding || l.principal_amount || 0, l.currency, reportingCurrency), 0);
  const consolidatedLentOverdue = lentLoans.filter(l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) && l.status !== 'PAID').reduce((acc, l) => acc + convertCurrency(l.balance?.outstanding || l.principal_amount || 0, l.currency, reportingCurrency), 0);
  const consolidatedLentRecovery = consolidatedLent > 0 ? Number(((consolidatedLentRepaid / consolidatedLent) * 100).toFixed(1)) : 0;

  const consolidatedBorrowed = borrowedLoans.reduce((acc, l) => acc + convertCurrency(l.principal_amount || 0, l.currency, reportingCurrency), 0);
  const consolidatedBorrowedRepaid = borrowedLoans.reduce((acc, l) => acc + convertCurrency(l.balance?.total_repaid || 0, l.currency, reportingCurrency), 0);
  const consolidatedBorrowedOutstanding = borrowedLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID').reduce((acc, l) => acc + convertCurrency(l.balance?.outstanding || l.principal_amount || 0, l.currency, reportingCurrency), 0);
  const consolidatedBorrowedOverdue = borrowedLoans.filter(l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) && l.status !== 'PAID').reduce((acc, l) => acc + convertCurrency(l.balance?.outstanding || l.principal_amount || 0, l.currency, reportingCurrency), 0);
  const consolidatedBorrowedRepaymentRate = consolidatedBorrowed > 0 ? Number(((consolidatedBorrowedRepaid / consolidatedBorrowed) * 100).toFixed(1)) : 0;

  const consolidatedNetOutstanding = consolidatedLentOutstanding - consolidatedBorrowedOutstanding;

  // 2. Group raw unmixed totals per currency directly from transaction records
  const totalsByCurrency = {};
  availableCurrencies.forEach((curr) => {
    const currLoans = loans.filter(l => (l.currency || 'INR') === curr && l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF');
    const currLent = currLoans.filter(l => l.direction !== 'borrowed');
    const currBorrowed = currLoans.filter(l => l.direction === 'borrowed');
    const currOverdueLent = currLent.filter(l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) && l.status !== 'PAID');
    const currOverdueBorr = currBorrowed.filter(l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) && l.status !== 'PAID');

    const lent = currLent.reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
    const lentRepaid = currLent.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
    const lentOutstanding = currLent.reduce((acc, l) => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID') ? acc + Number(l.balance?.outstanding || 0) : acc, 0);
    const lentOverdue = currOverdueLent.reduce((acc, l) => acc + Number(l.balance?.outstanding || 0), 0);
    const lentRecovery = lent > 0 ? Number(((lentRepaid / lent) * 100).toFixed(1)) : 0;

    const borrowed = currBorrowed.reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
    const borrowedRepaid = currBorrowed.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
    const borrowedOutstanding = currBorrowed.reduce((acc, l) => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID') ? acc + Number(l.balance?.outstanding || 0) : acc, 0);
    const borrowedOverdue = currOverdueBorr.reduce((acc, l) => acc + Number(l.balance?.outstanding || 0), 0);
    const borrowedRepaymentRate = borrowed > 0 ? Number(((borrowedRepaid / borrowed) * 100).toFixed(1)) : 0;

    const netOutstanding = lentOutstanding - borrowedOutstanding;

    totalsByCurrency[curr] = {
      currency: curr,
      lent,
      lentRepaid,
      lentOutstanding,
      lentOverdue,
      lentRecovery,
      lentCount: currLent.length,
      lentOverdueCount: currOverdueLent.length,

      borrowed,
      borrowedRepaid,
      borrowedOutstanding,
      borrowedOverdue,
      borrowedRepaymentRate,
      borrowedCount: currBorrowed.length,
      borrowedOverdueCount: currOverdueBorr.length,

      netOutstanding,

      // Aliases
      repaid: lentRepaid,
      outstanding: lentOutstanding,
      overdue: lentOverdue,
      recovery: lentRecovery,
      loansCount: currLoans.length,
      overdueCount: currOverdueLent.length + currOverdueBorr.length
    };
  });

  // Selected view data: ALL means Consolidated Portfolio; otherwise single native currency
  const isConsolidated = activeCurrencyFilter === 'ALL';
  const activeDisplayCurrency = isConsolidated ? reportingCurrency : activeCurrencyFilter;
  const activeDisplaySymbol = getCurrencySymbol(activeDisplayCurrency);

  const displayStats = isConsolidated
    ? {
        currency: reportingCurrency,
        lent: consolidatedLent,
        lentRepaid: consolidatedLentRepaid,
        lentOutstanding: consolidatedLentOutstanding,
        lentOverdue: consolidatedLentOverdue,
        lentRecovery: consolidatedLentRecovery,
        lentCount: lentLoans.length,
        lentOverdueCount: lentLoans.filter(l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) && l.status !== 'PAID').length,

        borrowed: consolidatedBorrowed,
        borrowedRepaid: consolidatedBorrowedRepaid,
        borrowedOutstanding: consolidatedBorrowedOutstanding,
        borrowedOverdue: consolidatedBorrowedOverdue,
        borrowedRepaymentRate: consolidatedBorrowedRepaymentRate,
        borrowedCount: borrowedLoans.length,
        borrowedOverdueCount: borrowedLoans.filter(l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) && l.status !== 'PAID').length,

        netOutstanding: consolidatedNetOutstanding,
        repaid: consolidatedLentRepaid,
        outstanding: consolidatedLentOutstanding,
        overdue: consolidatedLentOverdue,
        recovery: consolidatedLentRecovery,
        loansCount: loans.length,
        overdueCount: overdueLoans.length
      }
    : totalsByCurrency[activeCurrencyFilter] || {
        lent: 0, lentRepaid: 0, lentOutstanding: 0, lentOverdue: 0, lentRecovery: 0, lentCount: 0, lentOverdueCount: 0,
        borrowed: 0, borrowedRepaid: 0, borrowedOutstanding: 0, borrowedOverdue: 0, borrowedRepaymentRate: 0, borrowedCount: 0, borrowedOverdueCount: 0,
        netOutstanding: 0, repaid: 0, outstanding: 0, overdue: 0, recovery: 0, loansCount: 0, overdueCount: 0
      };

  const totalLoansCount = isConsolidated ? loans.length : (totalsByCurrency[activeCurrencyFilter]?.loansCount || 0);
  const overdueCount = isConsolidated ? overdueLoans.length : (totalsByCurrency[activeCurrencyFilter]?.overdueCount || 0);
  const dueSoonCount = dueSoonLoans.length;
  const activeDebtorsCount = people.filter(p => Number(p.outstanding_balance || 0) > 0).length;
  const recoveryRate = displayStats.lentRecovery || 0;

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
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Currency Split View:
            </span>
          </div>

          {/* Currency Dropdown Selector */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card)',
                border: '1.5px solid var(--accent-emerald)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.15)'
              }}
              onClick={() => setShowCurrencySplitDropdown(!showCurrencySplitDropdown)}
            >
              <span style={{ color: 'var(--accent-emerald)' }}>●</span>
              <span>
                {activeCurrencyFilter === 'ALL'
                  ? 'All Currencies (Split Breakdown)'
                  : `${activeCurrencyFilter} (${getCurrencySymbol(activeCurrencyFilter)})`}
              </span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </button>

            {showCurrencySplitDropdown && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: '120%',
                minWidth: 220,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                padding: '0.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.3rem 0.55rem', textTransform: 'uppercase' }}>
                  Filter Portfolio Currency
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCurrencyFilter('ALL');
                    setShowCurrencySplitDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: activeCurrencyFilter === 'ALL' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: activeCurrencyFilter === 'ALL' ? 'var(--accent-emerald)' : 'var(--text-primary)',
                    fontWeight: activeCurrencyFilter === 'ALL' ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <span>All Currencies (Split Breakdown)</span>
                  {activeCurrencyFilter === 'ALL' && <Check size={14} color="var(--accent-emerald)" />}
                </button>

                {availableCurrencies.map(curr => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => {
                      setActiveCurrencyFilter(curr);
                      setShowCurrencySplitDropdown(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.45rem 0.65rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: activeCurrencyFilter === curr ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                      color: activeCurrencyFilter === curr ? 'var(--accent-emerald)' : 'var(--text-primary)',
                      fontWeight: activeCurrencyFilter === curr ? 700 : 500,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <span>{curr} ({getCurrencySymbol(curr)})</span>
                    {activeCurrencyFilter === curr && <Check size={14} color="var(--accent-emerald)" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Net Financial Position & Direction Switcher Bar */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'var(--inner-card-bg)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Left: Net Position Summary */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Authoritative Financial Position
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: singleStats.netOutstanding > 0 ? 'var(--accent-emerald)' : singleStats.netOutstanding < 0 ? 'var(--accent-rose)' : 'var(--text-primary)'
            }}>
              {isMasked 
                ? `${getCurrencySymbol(singleCurr)}••••••` 
                : `${singleStats.netOutstanding >= 0 ? '+' : ''}${getCurrencySymbol(singleCurr)}${Number(singleStats.netOutstanding).toLocaleString()}`} <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{singleCurr}</span>
            </span>
            <span className="badge" style={{
              background: singleStats.netOutstanding > 0 ? 'rgba(16, 185, 129, 0.15)' : singleStats.netOutstanding < 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)',
              color: singleStats.netOutstanding > 0 ? 'var(--accent-emerald)' : singleStats.netOutstanding < 0 ? 'var(--accent-rose)' : 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {singleStats.netOutstanding > 0 ? 'Net Receivable (You are owed money)' : singleStats.netOutstanding < 0 ? 'Net Payable (You owe money)' : 'Even / Settled Net Position'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Receivables: <strong>{getCurrencySymbol(singleCurr)}{isMasked ? '••••••' : Number(singleStats.lentOutstanding).toLocaleString()}</strong> • Payables: <strong>{getCurrencySymbol(singleCurr)}{isMasked ? '••••••' : Number(singleStats.borrowedOutstanding).toLocaleString()}</strong>
          </div>
        </div>

        {/* Right: Dashboard View Direction Switcher */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          background: 'var(--bg-surface)',
          padding: '0.3rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => setDashboardDirection('overview')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: dashboardDirection === 'overview' ? 'var(--bg-card)' : 'transparent',
              color: dashboardDirection === 'overview' ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: dashboardDirection === 'overview' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            ⚖️ Net Overview
          </button>
          <button
            type="button"
            onClick={() => setDashboardDirection('lent')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: dashboardDirection === 'lent' ? 'var(--accent-emerald)' : 'transparent',
              color: dashboardDirection === 'lent' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            🤝 Money Lent ({lentLoans.length})
          </button>
          <button
            type="button"
            onClick={() => setDashboardDirection('borrowed')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: dashboardDirection === 'borrowed' ? 'var(--accent-indigo)' : 'transparent',
              color: dashboardDirection === 'borrowed' ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            📥 Money Borrowed ({borrowedLoans.length})
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards for Money Lent (Receivables) */}
      {(dashboardDirection === 'overview' || dashboardDirection === 'lent') && (
        <div>
          {dashboardDirection === 'overview' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>🤝 MONEY LENT (RECEIVABLES / ASSETS)</span>
            </div>
          )}
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
                        {getCurrencySymbol(curr)}{isMasked ? '••••••' : Number(totalsByCurrency[curr].lent).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{curr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  {getCurrencySymbol(singleCurr)}{isMasked ? '••••••' : Number(singleStats.lent).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{singleCurr}</span>
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Across {singleStats.lentCount || lentLoans.length} lending records
              </div>
            </div>

            {/* Total Recovered */}
            <div
              className="glass-panel kpi-card kpi-repaid"
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.18s ease' }}
              onClick={() => onOpenDrilldown && onOpenDrilldown('repaid')}
              title="Click to view total repayments and collection ledger"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL RECOVERED</span>
                <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={19} color="var(--accent-emerald)" />
                </div>
              </div>

              {isSplitView ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  {availableCurrencies.map(curr => (
                    <div key={curr} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: availableCurrencies.length > 2 ? '1.25rem' : '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '-0.02em' }}>
                        {getCurrencySymbol(curr)}{isMasked ? '••••••' : Number(totalsByCurrency[curr].lentRepaid).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {curr} ({totalsByCurrency[curr].lentRecovery}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  {getCurrencySymbol(singleCurr)}{isMasked ? '••••••' : Number(singleStats.lentRepaid).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>{singleCurr}</span>
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {isSplitView ? 'Recovery rate indicated per currency' : `Recovery Rate: ${singleStats.lentRecovery}%`}
              </div>
            </div>

            {/* Outstanding Receivable */}
            <div
              className="glass-panel kpi-card kpi-outstanding"
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.18s ease' }}
              onClick={() => onOpenDrilldown && onOpenDrilldown('outstanding')}
              title="Click to view outstanding receivables"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>OUTSTANDING RECEIVABLE</span>
                <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={19} color="var(--accent-cyan)" />
                </div>
              </div>

              {isSplitView ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  {availableCurrencies.map(curr => (
                    <div key={curr} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: availableCurrencies.length > 2 ? '1.25rem' : '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '-0.02em' }}>
                        {getCurrencySymbol(curr)}{isMasked ? '••••••' : Number(totalsByCurrency[curr].lentOutstanding).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{curr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  {getCurrencySymbol(singleCurr)}{isMasked ? '••••••' : Number(singleStats.lentOutstanding).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>{singleCurr}</span>
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeDebtorsCount > 0 
                  ? `Owed by ${activeDebtorsCount} contacts`
                  : `Zero outstanding balance`}
              </div>
            </div>

            {/* Overdue Receivables */}
            <div
              className="glass-panel kpi-card kpi-overdue"
              style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.18s ease' }}
              onClick={() => onOpenDrilldown && onOpenDrilldown('overdue')}
              title="Click to view overdue lending report"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>OVERDUE RECEIVABLES</span>
                <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={19} color="var(--accent-rose)" />
                </div>
              </div>

              {isSplitView ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  {availableCurrencies.filter(c => totalsByCurrency[c].lentOverdue > 0).length > 0 ? (
                    availableCurrencies.filter(c => totalsByCurrency[c].lentOverdue > 0).map(curr => (
                      <div key={curr} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: availableCurrencies.length > 2 ? '1.25rem' : '1.5rem', fontWeight: 800, color: 'var(--accent-rose)', letterSpacing: '-0.02em' }}>
                          {getCurrencySymbol(curr)}{isMasked ? '••••••' : Number(totalsByCurrency[curr].lentOverdue).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
                          {curr} ({totalsByCurrency[curr].lentOverdueCount} overdue)
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
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: singleStats.lentOverdue > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                  {getCurrencySymbol(singleCurr)}{isMasked ? '••••••' : Number(singleStats.lentOverdue).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{singleCurr}</span>
                </div>
              )}

              {singleStats.lentOverdueCount > 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>
                  {singleStats.lentOverdueCount} {singleStats.lentOverdueCount === 1 ? 'loan requires' : 'loans require'} attention
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
                  ✓ All repayments are up to date
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4 Main KPI Cards for Money Borrowed (Payables) */}
      {(dashboardDirection === 'overview' || dashboardDirection === 'borrowed') && (
        <div style={{ marginTop: dashboardDirection === 'overview' ? '1rem' : '0' }}>
          {dashboardDirection === 'overview' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>📥 MONEY BORROWED (PAYABLES / LIABILITIES)</span>
            </div>
          )}
          <div className="stats-grid">
            {/* Total Borrowed */}
            <div
              className="glass-panel kpi-card"
              style={{ padding: '1.5rem', borderLeft: '3px solid var(--accent-indigo)', cursor: 'pointer', transition: 'all 0.18s ease' }}
              onClick={() => onOpenDrilldown && onOpenDrilldown('borrowed')}
              title="Click to view breakdown of capital borrowed"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL CAPITAL BORROWED</span>
                <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowDownLeft size={19} color="var(--accent-indigo)" />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                {getCurrencySymbol(singleCurr)}{isMasked ? '••••••' : Number(singleStats.borrowed).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{singleCurr}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Across {singleStats.borrowedCount || borrowedLoans.length} borrowing obligations
              </div>
            </div>

            {/* Total Repaid to Lenders */}
            <div
              className="glass-panel kpi-card"
              style={{ padding: '1.5rem', borderLeft: '3px solid var(--accent-emerald)', cursor: 'pointer', transition: 'all 0.18s ease' }}
              onClick={() => onOpenDrilldown && onOpenDrilldown('borrowed_repaid')}
              title="Click to view repayments made to lenders"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL REPAID TO LENDERS</span>
                <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={19} color="var(--accent-emerald)" />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem', color: 'var(--accent-emerald)' }}>
                {getCurrencySymbol(singleCurr)}{isMasked ? '••••••' : Number(singleStats.borrowedRepaid).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>{singleCurr}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Repayment Completion: {singleStats.borrowedRepaymentRate}%
              </div>
            </div>

            {/* Outstanding Payable */}
            <div
              className="glass-panel kpi-card"
              style={{ padding: '1.5rem', borderLeft: '3px solid var(--accent-amber)', cursor: 'pointer', transition: 'all 0.18s ease' }}
              onClick={() => onOpenDrilldown && onOpenDrilldown('borrowed_outstanding')}
              title="Click to view outstanding payable debt liabilities"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>OUTSTANDING PAYABLE (YOU OWE)</span>
                <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={19} color="var(--accent-amber)" />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem', color: singleStats.borrowedOutstanding > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                {getCurrencySymbol(singleCurr)}{isMasked ? '••••••' : Number(singleStats.borrowedOutstanding).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{singleCurr}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {singleStats.borrowedOutstanding > 0 ? `Remaining debt obligation` : `No outstanding borrowing liabilities`}
              </div>
            </div>

            {/* Overdue Payables */}
            <div
              className="glass-panel kpi-card"
              style={{ padding: '1.5rem', borderLeft: '3px solid var(--accent-rose)', cursor: 'pointer', transition: 'all 0.18s ease' }}
              onClick={() => onOpenDrilldown && onOpenDrilldown('borrowed_overdue')}
              title="Click to view overdue debt obligations"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>OVERDUE PAYABLES</span>
                <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={19} color="var(--accent-rose)" />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem', color: singleStats.borrowedOverdue > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                {getCurrencySymbol(singleCurr)}{isMasked ? '••••••' : Number(singleStats.borrowedOverdue).toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{singleCurr}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: singleStats.borrowedOverdue > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                {singleStats.borrowedOverdue > 0 ? `${singleStats.borrowedOverdueCount} overdue payment(s) to settle` : `✓ All your debts are current`}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Two Column Layout: Aligned Grid Rows */}
      <div className="dashboard-layout">
        {/* Row 1 Left: Overdue Follow-ups */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-rose)', boxShadow: '0 0 8px var(--accent-rose)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Overdue Follow-ups</h3>
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

        {/* Row 1 Right: Quick Actions Hub */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-indigo)', boxShadow: '0 0 8px var(--accent-indigo)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'center' }}>
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

        {/* Row 2 Left: Upcoming Due Dates (Next 7 Days) */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-amber)', boxShadow: '0 0 8px var(--accent-amber)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Upcoming Due Dates (Next 7 Days)</h3>
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

        {/* Row 2 Right: Samsung Stack Deck (Direction-Aware Exposure) */}
        {(() => {
          // Calculate filtered contacts for Stack Deck based on active dashboardDirection
          const filteredStackPeople = people.filter((p) => {
            const pLoans = loans.filter((l) => {
              if (l.person === p.id) return true;
              if (typeof l.person === 'object' && l.person?.id === p.id) return true;
              if (l.person_name && p.name && l.person_name.toLowerCase() === p.name.toLowerCase()) return true;
              return false;
            });
            if (dashboardDirection === 'lent') {
              return pLoans.some(l => l.direction !== 'borrowed');
            }
            if (dashboardDirection === 'borrowed') {
              return pLoans.some(l => l.direction === 'borrowed');
            }
            return true;
          });

          const activePeopleList = filteredStackPeople.length > 0 ? filteredStackPeople : people;
          const currentSafeIndex = activeStackIndex % (activePeopleList.length || 1);

          const stackTitle = dashboardDirection === 'borrowed'
            ? 'Lender Liabilities'
            : dashboardDirection === 'lent'
              ? 'Borrower Exposure'
              : 'Contact Net Exposure';

          return (
            <div className="glass-panel samsung-now-bar-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              {/* Header with Live Indicator & Stack Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: dashboardDirection === 'borrowed' ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
                    boxShadow: `0 0 8px ${dashboardDirection === 'borrowed' ? 'var(--accent-indigo)' : 'var(--accent-emerald)'}`
                  }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {stackTitle}
                  </h3>
                  <span className="badge badge-approved" style={{
                    fontSize: '0.65rem',
                    padding: '0.15rem 0.5rem',
                    background: dashboardDirection === 'borrowed' ? 'rgba(99, 102, 241, 0.15)' : undefined,
                    color: dashboardDirection === 'borrowed' ? 'var(--accent-indigo)' : undefined,
                    borderColor: dashboardDirection === 'borrowed' ? 'rgba(99, 102, 241, 0.3)' : undefined
                  }}>
                    {dashboardDirection === 'borrowed' ? 'PAYABLES DECK' : dashboardDirection === 'lent' ? 'RECEIVABLES DECK' : 'STACK DECK'}
                  </span>
                </div>

                {activePeopleList.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                      {currentSafeIndex + 1} of {activePeopleList.length}
                    </span>
                    <button
                      className="now-bar-nav-btn"
                      onClick={() => setActiveStackIndex((prev) => (prev - 1 + activePeopleList.length) % activePeopleList.length)}
                      title="Previous stacked card"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      className="now-bar-nav-btn"
                      onClick={() => setActiveStackIndex((prev) => (prev + 1) % activePeopleList.length)}
                      title="Next stacked card"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Stack Deck Body */}
              {activePeopleList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No contacts found matching the active filter. Click "Add Contact" above to get started!
                </div>
              ) : (
                <div
                  className="samsung-stack-container"
                  onWheel={(e) => {
                    if (Math.abs(e.deltaY) > 20) {
                      if (e.deltaY > 0) {
                        setActiveStackIndex((prev) => (prev + 1) % activePeopleList.length);
                      } else {
                        setActiveStackIndex((prev) => (prev - 1 + activePeopleList.length) % activePeopleList.length);
                      }
                    }
                  }}
                  onTouchStart={handleStackTouchStart}
                  onTouchEnd={(e) => {
                    if (touchStartY.current === null) return;
                    const touchEndY = e.changedTouches[0].clientY;
                    const diff = touchStartY.current - touchEndY;
                    if (diff > 30) {
                      setActiveStackIndex((prev) => (prev + 1) % activePeopleList.length);
                    } else if (diff < -30) {
                      setActiveStackIndex((prev) => (prev - 1 + activePeopleList.length) % activePeopleList.length);
                    }
                    touchStartY.current = null;
                  }}
                >
                  <div className="samsung-stack-wrapper">
                    {activePeopleList.map((p, idx) => {
                      const offset = (idx - currentSafeIndex + activePeopleList.length) % activePeopleList.length;
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
                      const pLentLoans = pLoans.filter(l => l.direction !== 'borrowed' && l.status !== 'CANCELLED');
                      const pBorrowedLoans = pLoans.filter(l => l.direction === 'borrowed' && l.status !== 'CANCELLED');

                      const pLentOut = pLentLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID').reduce((acc, l) => acc + Number(l.balance?.outstanding || 0), 0);
                      const pLentTotal = pLentLoans.reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
                      const pLentRepaid = pLentLoans.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
                      const pLentRecRate = pLentTotal > 0 ? Math.min(100, Math.round((pLentRepaid / pLentTotal) * 100)) : 100;

                      const pBorrowedOut = pBorrowedLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID').reduce((acc, l) => acc + Number(l.balance?.outstanding || 0), 0);
                      const pBorrowedTotal = pBorrowedLoans.reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
                      const pBorrowedRepaid = pBorrowedLoans.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
                      const pBorrowedRepayRate = pBorrowedTotal > 0 ? Math.min(100, Math.round((pBorrowedRepaid / pBorrowedTotal) * 100)) : 100;

                      const netPosition = pLentOut - pBorrowedOut;
                      const isOverdue = pLoans.some(l => (l.days_overdue > 0 || l.time_status === 'OVERDUE') && l.status !== 'PAID');

                      const isBorrowingMode = dashboardDirection === 'borrowed';
                      const isLendingMode = dashboardDirection === 'lent';

                      return (
                        <div
                          key={p.id}
                          className="samsung-stack-card"
                          style={{
                            transform: `translateY(${translateY}px) scale(${scale})`,
                            opacity: opacity,
                            zIndex: zIndex,
                            pointerEvents: isVisible ? 'auto' : 'none',
                            cursor: 'pointer'
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
                                background: isBorrowingMode ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
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
                                  {p.relationship || (isBorrowingMode ? 'Lender' : 'Borrower')}
                                </span>
                              </div>
                            </div>

                            <span
                              className="badge"
                              style={{
                                fontSize: '0.62rem',
                                padding: '0.2rem 0.5rem',
                                background: isOverdue ? 'rgba(244, 63, 94, 0.15)' : isBorrowingMode ? (pBorrowedOut > 0 ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)') : (pLentOut > 0 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)'),
                                color: isOverdue ? 'var(--accent-rose)' : isBorrowingMode ? (pBorrowedOut > 0 ? 'var(--accent-indigo)' : 'var(--accent-emerald)') : (pLentOut > 0 ? 'var(--accent-cyan)' : 'var(--accent-emerald)'),
                                borderColor: isOverdue ? 'rgba(244, 63, 94, 0.3)' : isBorrowingMode ? (pBorrowedOut > 0 ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)') : (pLentOut > 0 ? 'rgba(6, 182, 212, 0.3)' : 'rgba(16, 185, 129, 0.3)')
                              }}
                            >
                              {isOverdue 
                                ? 'OVERDUE' 
                                : isBorrowingMode 
                                  ? (pBorrowedOut > 0 ? 'YOU OWE' : 'CLEARED') 
                                  : isLendingMode 
                                    ? (pLentOut > 0 ? 'OWES YOU' : 'SETTLED')
                                    : (netPosition > 0 ? 'OWES YOU' : netPosition < 0 ? 'YOU OWE' : 'SETTLED')}
                            </span>
                          </div>

                          {/* Middle: Owed / Net Balance in Currency */}
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            padding: '0.75rem 0.9rem',
                            marginBottom: '0.75rem'
                          }}>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                              {isBorrowingMode ? 'Remaining Debt Payable' : isLendingMode ? 'Outstanding Receivable' : 'Net Financial Position'}
                            </span>

                            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem', color: isBorrowingMode ? 'var(--accent-indigo)' : (isLendingMode ? 'var(--accent-cyan)' : (netPosition >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)')) }}>
                              {isMasked ? (
                                `${getCurrencySymbol(pCurrs[0] || 'INR')}••••••`
                              ) : isBorrowingMode ? (
                                `${getCurrencySymbol(pCurrs[0] || 'INR')}${pBorrowedOut.toLocaleString()}`
                              ) : isLendingMode ? (
                                `${getCurrencySymbol(pCurrs[0] || 'INR')}${pLentOut.toLocaleString()}`
                              ) : (
                                `${netPosition >= 0 ? '+' : ''}${getCurrencySymbol(pCurrs[0] || 'INR')}${netPosition.toLocaleString()}`
                              )} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{pCurrs[0] || 'INR'}</span>
                            </div>

                            {!isBorrowingMode && !isLendingMode && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                Receivable: {isMasked ? '••••••' : `${getCurrencySymbol(pCurrs[0] || 'INR')}${pLentOut.toLocaleString()}`} • Payable: {isMasked ? '••••••' : `${getCurrencySymbol(pCurrs[0] || 'INR')}${pBorrowedOut.toLocaleString()}`}
                              </div>
                            )}
                          </div>

                          {/* Progress Mini Bar */}
                          <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>
                                {isBorrowingMode ? 'Repayment to Lender' : 'Recovery Progress'}
                              </span>
                              <strong style={{ color: isBorrowingMode ? 'var(--accent-indigo)' : 'var(--accent-emerald)' }}>
                                {isBorrowingMode ? `${pBorrowedRepayRate}% Repaid` : `${pLentRecRate}% Settled`}
                              </strong>
                            </div>
                            <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{
                                width: `${isBorrowingMode ? pBorrowedRepayRate : pLentRecRate}%`,
                                height: '100%',
                                background: isBorrowingMode ? 'linear-gradient(90deg, #6366f1, #818cf8)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                                transition: 'width 0.4s ease'
                              }} />
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
                            color: isBorrowingMode ? 'var(--accent-indigo)' : 'var(--accent-emerald)'
                          }}>
                            <span>{pLoans.length} {pLoans.length === 1 ? 'Agreement' : 'Agreements'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              {offset === 0 ? 'Open Dossier' : 'Bring to Front'} <ChevronRight size={13} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stack Navigation Dots Indicator */}
                  {activePeopleList.length > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginTop: '1.25rem' }}>
                      {activePeopleList.map((p, idx) => (
                        <div
                          key={p.id}
                          className={`now-bar-dot ${currentSafeIndex === idx ? 'active' : 'inactive'}`}
                          onClick={() => setActiveStackIndex(idx)}
                          title={`Flick to ${p.name}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
