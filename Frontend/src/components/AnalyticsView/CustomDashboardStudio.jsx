import React, { useState } from 'react';
import { LayoutGrid, Plus, Trash2, Check, Star, Settings2, BarChart2 } from 'lucide-react';
import { KpiCard } from './charts/KpiCard';
import { TrendLineChart } from './charts/TrendLineChart';
import { DonutChart } from './charts/DonutChart';
import { BarChart } from './charts/BarChart';

const AVAILABLE_WIDGET_TEMPLATES = [
  { id: 'w_total_lent', title: 'Total Capital Lent', type: 'kpi_card', metric_id: 'total_lent', category: 'Lending' },
  { id: 'w_total_borrowed', title: 'Total Capital Borrowed', type: 'kpi_card', metric_id: 'total_borrowed', category: 'Borrowing' },
  { id: 'w_net_position', title: 'Net Financial Position', type: 'kpi_card', metric_id: 'net_financial_position', category: 'Net Position' },
  { id: 'w_overdue_receivables', title: 'Overdue Receivables', type: 'kpi_card', metric_id: 'overdue_receivables', category: 'Risk' },
  { id: 'w_recovery_rate', title: 'Recovery Rate %', type: 'kpi_card', metric_id: 'recovery_rate', category: 'Lending' },
  { id: 'w_lending_trend', title: 'Monthly Lending vs Recoveries', type: 'line_chart', metric_id: 'lending_trends', category: 'Trends' },
  { id: 'w_currency_share', title: 'Currency Portfolio Share', type: 'donut_chart', metric_id: 'currency_exposure', category: 'Currency' },
  { id: 'w_loan_sizes', title: 'Loan Size Bands Distribution', type: 'bar_chart', metric_id: 'size_distribution', category: 'Lending' },
];

export const CustomDashboardStudio = ({
  overviewData,
  lendingData,
  reportingCurrency = 'INR',
  isMasked = false
}) => {
  const [dashboards, setDashboards] = useState([
    {
      id: 'd_1',
      title: 'Executive Financial Cockpit',
      isDefault: true,
      widgets: ['w_net_position', 'w_total_lent', 'w_total_borrowed', 'w_overdue_receivables', 'w_lending_trend', 'w_currency_share']
    },
    {
      id: 'd_2',
      title: 'Risk & Delinquency Monitor',
      isDefault: false,
      widgets: ['w_overdue_receivables', 'w_recovery_rate', 'w_loan_sizes']
    }
  ]);

  const [activeDashId, setActiveDashId] = useState('d_1');
  const [newDashName, setNewDashName] = useState('');
  const [showGallery, setShowGallery] = useState(false);

  const currentDashboard = dashboards.find(d => d.id === activeDashId) || dashboards[0];

  const handleCreateDashboard = () => {
    if (!newDashName.trim()) return;
    const newDash = {
      id: `d_${Date.now()}`,
      title: newDashName.trim(),
      isDefault: false,
      widgets: ['w_net_position', 'w_total_lent', 'w_total_borrowed']
    };
    setDashboards([...dashboards, newDash]);
    setActiveDashId(newDash.id);
    setNewDashName('');
  };

  const handleAddWidget = (templateId) => {
    if (currentDashboard.widgets.includes(templateId)) return;
    const updated = dashboards.map(d => {
      if (d.id === activeDashId) {
        return { ...d, widgets: [...d.widgets, templateId] };
      }
      return d;
    });
    setDashboards(updated);
    setShowGallery(false);
  };

  const handleRemoveWidget = (templateId) => {
    const updated = dashboards.map(d => {
      if (d.id === activeDashId) {
        return { ...d, widgets: d.widgets.filter(w => w !== templateId) };
      }
      return d;
    });
    setDashboards(updated);
  };

  const handleSetDefault = (dashId) => {
    const updated = dashboards.map(d => ({
      ...d,
      isDefault: d.id === dashId
    }));
    setDashboards(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Dashboard Selector & Manager Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <LayoutGrid size={18} color="var(--accent-emerald)" />
          {dashboards.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDashId(d.id)}
              style={{
                padding: '0.35rem 0.8rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-subtle)',
                background: d.id === activeDashId ? 'var(--accent-emerald)' : 'var(--inner-card-bg)',
                color: d.id === activeDashId ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {d.isDefault && <Star size={12} fill="currentColor" />}
              {d.title}
            </button>
          ))}
        </div>

        {/* Dashboard Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleSetDefault(activeDashId)}
            style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}
          >
            Set as Default
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowGallery(!showGallery)}
            style={{ fontSize: '0.72rem', background: 'var(--accent-emerald)', color: '#fff', padding: '0.35rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Plus size={13} /> Add Widget
          </button>
        </div>
      </div>

      {/* Widget Gallery Drawer */}
      {showGallery && (
        <div className="glass-panel" style={{ padding: '1.4rem 1.6rem', border: '1px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Widget Template Gallery</h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Click to append to '{currentDashboard.title}'</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {AVAILABLE_WIDGET_TEMPLATES.map(tmpl => {
              const isAlreadyAdded = currentDashboard.widgets.includes(tmpl.id);
              return (
                <div
                  key={tmpl.id}
                  onClick={() => !isAlreadyAdded && handleAddWidget(tmpl.id)}
                  style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    cursor: isAlreadyAdded ? 'default' : 'pointer',
                    opacity: isAlreadyAdded ? 0.5 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{tmpl.category}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0.3rem 0' }}>{tmpl.title}</div>
                  <span style={{ fontSize: '0.68rem', color: isAlreadyAdded ? 'var(--text-muted)' : 'var(--accent-emerald)', fontWeight: 600 }}>
                    {isAlreadyAdded ? "✓ Added" : "+ Add Widget"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Dashboard Render Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {currentDashboard.widgets.map(wId => {
          const tmpl = AVAILABLE_WIDGET_TEMPLATES.find(t => t.id === wId);
          if (!tmpl) return null;

          return (
            <div key={wId} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => handleRemoveWidget(wId)}
                title="Remove widget"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'var(--inner-card-bg)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '50%',
                  width: 22,
                  height: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  zIndex: 5
                }}
              >
                <Trash2 size={11} />
              </button>

              {tmpl.id === 'w_net_position' && (
                <KpiCard title="Net Position" value={overviewData?.net_position} currency={reportingCurrency} isMasked={isMasked} accentColor="var(--accent-emerald)" />
              )}
              {tmpl.id === 'w_total_lent' && (
                <KpiCard title="Total Lent" value={overviewData?.lending?.total_lent} currency={reportingCurrency} isMasked={isMasked} accentColor="var(--accent-emerald)" />
              )}
              {tmpl.id === 'w_total_borrowed' && (
                <KpiCard title="Total Borrowed" value={overviewData?.borrowing?.total_borrowed} currency={reportingCurrency} isMasked={isMasked} accentColor="#38bdf8" />
              )}
              {tmpl.id === 'w_overdue_receivables' && (
                <KpiCard title="Overdue Receivables" value={overviewData?.lending?.total_overdue} currency={reportingCurrency} isMasked={isMasked} accentColor="var(--accent-rose)" />
              )}
              {tmpl.id === 'w_recovery_rate' && (
                <KpiCard title="Recovery Rate" value={overviewData?.lending?.recovery_rate} isPercentage={true} isCurrency={false} isMasked={isMasked} accentColor="var(--accent-emerald)" />
              )}
              {tmpl.id === 'w_lending_trend' && (
                <TrendLineChart title="Monthly Lending Trends" data={lendingData?.monthly_trends || []} series={[{ key: 'lent', label: 'Lent', color: 'var(--accent-emerald)' }]} currency={reportingCurrency} isMasked={isMasked} height={200} />
              )}
              {tmpl.id === 'w_currency_share' && (
                <DonutChart title="Currency Share" data={(overviewData?.currency_exposure || []).map(c => ({ label: c.currency, value: c.reporting_amount }))} currency={reportingCurrency} isMasked={isMasked} size={180} />
              )}
              {tmpl.id === 'w_loan_sizes' && (
                <BarChart title="Loan Size Bands" data={(lendingData?.size_distribution || []).map(b => ({ label: b.label, value: b.total_amount }))} currency={reportingCurrency} isMasked={isMasked} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
