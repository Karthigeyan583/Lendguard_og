import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  BookOpen,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Users,
  Globe,
  Shield,
  FileSpreadsheet,
  LayoutGrid,
  Bell,
  Filter,
  Download,
  Calendar,
  RotateCw,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';

import { AnalyticsOverview } from './AnalyticsOverview';
import { LendingAnalyticsView } from './LendingAnalyticsView';
import { BorrowingAnalyticsView } from './BorrowingAnalyticsView';
import { RepaymentsCashflowView } from './RepaymentsCashflowView';
import { OverdueRiskView } from './OverdueRiskView';
import { PeopleAnalyticsView } from './PeopleAnalyticsView';
import { CurrencyInterestView } from './CurrencyInterestView';
import { AuditWorkspaceView } from './AuditWorkspaceView';
import { CustomReportBuilder } from './CustomReportBuilder';
import { CustomDashboardStudio } from './CustomDashboardStudio';
import { ScheduledReportsAlertsView } from './ScheduledReportsAlertsView';
import { DynamicFilterBuilderModal } from './DynamicFilterBuilderModal';
import { getDefaultCurrency, CURRENCY_MAP } from '../../utils/currency';

const SUB_TABS = [
  { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
  { id: 'lending', label: 'Lending Portfolio', icon: BookOpen },
  { id: 'borrowing', label: 'Borrowing Obligations', icon: TrendingUp },
  { id: 'payments', label: 'Payments & Cash Flow', icon: CreditCard },
  { id: 'overdue', label: 'Overdue & Risk', icon: AlertTriangle },
  { id: 'people', label: 'Counterparty Matrix', icon: Users },
  { id: 'currency', label: 'Currency & Interest', icon: Globe },
  { id: 'audit', label: 'Audit Trail', icon: Shield },
  { id: 'builder', label: 'Report & Pivot Studio', icon: FileSpreadsheet, badge: 'PRO' },
  { id: 'studio', label: 'Custom Dashboards', icon: LayoutGrid },
  { id: 'schedules', label: 'Schedules & Alerts', icon: Bell },
];

export const AnalyticsView = ({
  loans = [],
  people = [],
  summary = null,
  isMasked = false,
  onOpenPersonDetails,
  onRecordPayment,
  onGenerateStatement,
  initialSubTab = 'overview'
}) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab);
  const [reportingCurrency, setReportingCurrency] = useState(getDefaultCurrency());
  const [dateRange, setDateRange] = useState('all_time');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [customAstFilters, setCustomAstFilters] = useState({ condition: 'AND', rules: [] });
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [savedReportsList, setSavedReportsList] = useState([]);

  // Live Fetched Analytics State
  const [overviewData, setOverviewData] = useState(null);
  const [lendingData, setLendingData] = useState(null);
  const [borrowingData, setBorrowingData] = useState(null);
  const [paymentsData, setPaymentsData] = useState(null);
  const [cashflowData, setCashflowData] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState('Just now');

  const fetchAnalytics = async () => {
    setLoading(true);
    const token = localStorage.getItem('token') || '';
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    };

    const queryParams = new URLSearchParams({
      reporting_currency: reportingCurrency,
      date_range: dateRange,
      comparison_mode: comparisonMode ? 'previous_period' : 'none'
    });

    try {
      const [overviewRes, lendingRes, borrowingRes, paymentsRes, cashflowRes, auditRes] = await Promise.all([
        fetch(`/api/v1/analytics/overview/?${queryParams}`, { headers }),
        fetch(`/api/v1/analytics/lending/?${queryParams}`, { headers }),
        fetch(`/api/v1/analytics/borrowing/?${queryParams}`, { headers }),
        fetch(`/api/v1/analytics/payments/?${queryParams}`, { headers }),
        fetch(`/api/v1/analytics/cashflow/?${queryParams}`, { headers }),
        fetch(`/api/v1/analytics/audit/`, { headers })
      ]);

      if (overviewRes.ok) setOverviewData(await overviewRes.json());
      if (lendingRes.ok) setLendingData(await lendingRes.json());
      if (borrowingRes.ok) setBorrowingData(await borrowingRes.json());
      if (paymentsRes.ok) setPaymentsData(await paymentsRes.json());
      if (cashflowRes.ok) setCashflowData(await cashflowRes.json());
      if (auditRes.ok) setAuditData(await auditRes.json());

      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [reportingCurrency, dateRange, comparisonMode]);

  const handleExport = (fmt) => {
    setIsExportMenuOpen(false);
    // Direct browser download
    const url = `/api/v1/analytics/overview/?reporting_currency=${reportingCurrency}&date_range=${dateRange}&format=${fmt}`;
    window.open(url, '_blank');
  };

  const handleSaveReport = (newReport) => {
    setSavedReportsList([...savedReportsList, newReport]);
  };

  const activeRulesCount = customAstFilters.rules?.length || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* 1. Global Analytics Studio Top Control Header */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}>
                <BarChart3 size={18} color="#fff" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Analytics & Reporting Studio
              </h2>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                color: '#fff',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}>
                Enterprise v2.0
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Authoritative financial intelligence across Lending, Borrowing, Cash Flow, Risk, and Custom Reports
            </p>
          </div>

          {/* Controls Cluster: Date Preset + Currency + Filter + Export + Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {/* Date Preset Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.5rem' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              >
                <option value="all_time">All Time Horizon</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
                <option value="this_year">This Year</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="last_12_months">Last 12 Months</option>
              </select>
            </div>

            {/* Comparison Mode Toggle */}
            <button
              type="button"
              onClick={() => setComparisonMode(!comparisonMode)}
              style={{
                padding: '0.38rem 0.75rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: comparisonMode ? 'rgba(16, 185, 129, 0.15)' : 'var(--inner-card-bg)',
                color: comparisonMode ? 'var(--accent-emerald)' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title="Compare current window against previous period"
            >
              {comparisonMode ? "✓ vs Prev Period" : "+ Compare Period"}
            </button>

            {/* Reporting Currency Base */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--inner-card-bg)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.5rem' }}>
              <Globe size={14} color="var(--accent-emerald)" />
              <select
                value={reportingCurrency}
                onChange={(e) => setReportingCurrency(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
              >
                {Object.keys(CURRENCY_MAP).map(code => (
                  <option key={code} value={code}>{code} ({CURRENCY_MAP[code].symbol})</option>
                ))}
              </select>
            </div>

            {/* Advanced Filter Trigger */}
            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.38rem 0.75rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: activeRulesCount > 0 ? 'var(--accent-emerald)' : 'var(--inner-card-bg)',
                color: activeRulesCount > 0 ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <Filter size={13} />
              <span>Filters {activeRulesCount > 0 ? `(${activeRulesCount})` : ''}</span>
            </button>

            {/* Universal Export Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', padding: '0.38rem 0.75rem' }}
              >
                <Download size={13} /> Export <ChevronDown size={11} />
              </button>

              {isExportMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '0.3rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                  zIndex: 999,
                  minWidth: 150,
                  overflow: 'hidden'
                }}>
                  <div onClick={() => handleExport('csv')} style={{ padding: '0.55rem 0.85rem', fontSize: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }} className="dropdown-item-hover">
                    Export as CSV
                  </div>
                  <div onClick={() => handleExport('json')} style={{ padding: '0.55rem 0.85rem', fontSize: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }} className="dropdown-item-hover">
                    Export as JSON
                  </div>
                  <div onClick={() => handleExport('pdf')} style={{ padding: '0.55rem 0.85rem', fontSize: '0.75rem', cursor: 'pointer' }} className="dropdown-item-hover">
                    Printable PDF Document
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Trigger */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchAnalytics}
              disabled={loading}
              title={`Updated at ${lastRefreshed}`}
              style={{ padding: '0.38rem 0.55rem', display: 'flex', alignItems: 'center' }}
            >
              <RotateCw size={13} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        {/* 2. Sub-Navigation Horizontal Tabs Bar */}
        <div style={{
          display: 'flex',
          gap: '0.35rem',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          overflowX: 'auto',
          scrollbarWidth: 'none'
        }}>
          {SUB_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.95rem',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 800 : 600,
                  borderRadius: 'var(--radius-md)',
                  border: isActive ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                  background: isActive ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.08) 100%)' : 'transparent',
                  color: isActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} color={isActive ? 'var(--accent-emerald)' : 'currentColor'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'var(--accent-emerald)', color: '#fff' }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Active Sub-View Display */}
      {activeSubTab === 'overview' && (
        <AnalyticsOverview
          overviewData={overviewData}
          cashflowData={cashflowData}
          reportingCurrency={reportingCurrency}
          isMasked={isMasked}
          onNavigateTab={setActiveSubTab}
        />
      )}

      {activeSubTab === 'lending' && (
        <LendingAnalyticsView
          lendingData={lendingData}
          reportingCurrency={reportingCurrency}
          isMasked={isMasked}
          onOpenPersonDetails={onOpenPersonDetails}
        />
      )}

      {activeSubTab === 'borrowing' && (
        <BorrowingAnalyticsView
          borrowingData={borrowingData}
          reportingCurrency={reportingCurrency}
          isMasked={isMasked}
          onOpenPersonDetails={onOpenPersonDetails}
          onRecordPayment={onRecordPayment}
        />
      )}

      {activeSubTab === 'payments' && (
        <RepaymentsCashflowView
          paymentsData={paymentsData}
          cashflowData={cashflowData}
          reportingCurrency={reportingCurrency}
          isMasked={isMasked}
        />
      )}

      {activeSubTab === 'overdue' && (
        <OverdueRiskView
          agingData={overviewData}
          loans={loans}
          reportingCurrency={reportingCurrency}
          isMasked={isMasked}
          onRecordPayment={onRecordPayment}
          onGenerateStatement={onGenerateStatement}
        />
      )}

      {activeSubTab === 'people' && (
        <PeopleAnalyticsView
          people={people}
          loans={loans}
          reportingCurrency={reportingCurrency}
          isMasked={isMasked}
          onOpenPersonDetails={onOpenPersonDetails}
        />
      )}

      {activeSubTab === 'currency' && (
        <CurrencyInterestView
          overviewData={overviewData}
          loans={loans}
          reportingCurrency={reportingCurrency}
          isMasked={isMasked}
        />
      )}

      {activeSubTab === 'audit' && (
        <AuditWorkspaceView
          auditData={auditData}
        />
      )}

      {activeSubTab === 'builder' && (
        <CustomReportBuilder
          reportingCurrency={reportingCurrency}
          isMasked={isMasked}
          onSaveReport={handleSaveReport}
          savedReports={savedReportsList}
        />
      )}

      {activeSubTab === 'studio' && (
        <CustomDashboardStudio
          overviewData={overviewData}
          lendingData={lendingData}
          reportingCurrency={reportingCurrency}
          isMasked={isMasked}
        />
      )}

      {activeSubTab === 'schedules' && (
        <ScheduledReportsAlertsView
          reportingCurrency={reportingCurrency}
          isMasked={isMasked}
        />
      )}

      {/* Advanced Filter Modal */}
      <DynamicFilterBuilderModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        initialFilters={customAstFilters}
        onApplyFilters={(filters) => {
          setCustomAstFilters(filters);
          fetchAnalytics();
        }}
      />
    </div>
  );
};
