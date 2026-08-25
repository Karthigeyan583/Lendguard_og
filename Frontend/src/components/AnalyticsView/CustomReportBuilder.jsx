import React, { useState, useEffect } from 'react';
import {
  FileText,
  Play,
  Save,
  Download,
  Check,
  Columns,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Table as TableIcon
} from 'lucide-react';
import { PivotTable } from './charts/PivotTable';
import { getCurrencySymbol, maskValue } from '../../utils/currency';

const DATA_SOURCES = [
  { key: 'loans', label: '🤝 Loans & Lending Ledger', fields: ['loan_reference', 'person_name', 'direction', 'principal_amount', 'reporting_outstanding', 'recovery_rate', 'status', 'due_date', 'purpose', 'month', 'year'] },
  { key: 'borrowing', label: '📥 Borrowing Obligations Ledger', fields: ['loan_reference', 'person_name', 'principal_amount', 'reporting_outstanding', 'recovery_rate', 'status', 'due_date', 'month', 'year'] },
  { key: 'payments', label: '💳 Repayments & Collections', fields: ['loan_reference', 'person_name', 'direction', 'amount', 'reporting_amount', 'payment_date', 'payment_method', 'month', 'year'] },
  { key: 'people', label: '👥 People & Counterparty Directory', fields: ['name', 'relationship', 'total_lent', 'total_borrowed', 'net_exposure', 'active_loans_count'] },
  { key: 'audit', label: '🛡️ Audit Ledger Activity', fields: ['timestamp', 'user', 'action', 'module', 'target_reference', 'details'] }
];

export const CustomReportBuilder = ({
  reportingCurrency = 'INR',
  isMasked = false,
  onSaveReport,
  savedReports = []
}) => {
  const [dataSource, setDataSource] = useState('loans');
  const [selectedFields, setSelectedFields] = useState(['loan_reference', 'person_name', 'direction', 'principal_amount', 'reporting_outstanding', 'status', 'due_date']);
  const [groupBy, setGroupBy] = useState('');
  const [pivotColumns, setPivotColumns] = useState('');
  const [sortBy, setSortBy] = useState('due_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [reportName, setReportName] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('table'); // 'table', 'pivot'

  const currentSourceDef = DATA_SOURCES.find(d => d.key === dataSource) || DATA_SOURCES[0];

  // Run preview automatically or on demand
  const handleRunPreview = async () => {
    setLoading(true);
    try {
      const payload = {
        data_source: dataSource,
        selected_fields: selectedFields,
        group_by: groupBy,
        pivot_columns: pivotColumns,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      const res = await fetch(`/api/v1/analytics/reports/preview/?reporting_currency=${reportingCurrency}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewResult(data);
      }
    } catch (err) {
      console.error("Report preview failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunPreview();
  }, [dataSource, groupBy, pivotColumns, sortBy, sortOrder, reportingCurrency]);

  const handleToggleField = (field) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const handleSourceChange = (newSource) => {
    setDataSource(newSource);
    const def = DATA_SOURCES.find(d => d.key === newSource) || DATA_SOURCES[0];
    setSelectedFields(def.fields.slice(0, 6));
    setGroupBy('');
    setPivotColumns('');
  };

  const handleExport = (format) => {
    const token = localStorage.getItem('token') || '';
    const payload = {
      data_source: dataSource,
      selected_fields: selectedFields,
      group_by: groupBy,
      pivot_columns: pivotColumns,
      sort_by: sortBy,
      sort_order: sortOrder
    };
    // Direct trigger
    window.open(`/api/v1/analytics/overview/?format=${format}`, '_blank');
  };

  const handleSave = () => {
    if (!reportName.trim()) return alert('Please enter a name for your custom report.');
    if (onSaveReport) {
      onSaveReport({
        name: reportName,
        data_source: dataSource,
        selected_fields: selectedFields,
        group_by: groupBy,
        pivot_columns: pivotColumns,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      alert(`Report '${reportName}' saved successfully!`);
      setReportName('');
    }
  };

  const symbol = getCurrencySymbol(reportingCurrency);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Report Configuration Builder Card */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Custom Dynamic Report Builder & Pivot Studio</h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Select data source, customize columns, apply dynamic groupings, and calculate 2D pivot matrices
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRunPreview}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}
            >
              <Play size={13} /> {loading ? "Running..." : "Refresh Preview"}
            </button>
          </div>
        </div>

        {/* Builder Steps Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', background: 'var(--inner-card-bg)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {/* Step 1: Data Source */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              1. Choose Data Source
            </label>
            <select
              className="form-control"
              value={dataSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem 0.65rem' }}
            >
              {DATA_SOURCES.map(ds => (
                <option key={ds.key} value={ds.key}>{ds.label}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Primary Group By */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              2. Row Grouping (Dimension)
            </label>
            <select
              className="form-control"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem 0.65rem' }}
            >
              <option value="">-- No Grouping (Flat Rows) --</option>
              {currentSourceDef.fields.map(f => (
                <option key={f} value={f}>{f.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Step 3: Secondary Pivot Dimension */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              3. Column Dimension (2D Pivot Matrix)
            </label>
            <select
              className="form-control"
              value={pivotColumns}
              onChange={(e) => setPivotColumns(e.target.value)}
              style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem 0.65rem' }}
            >
              <option value="">-- None (1D Table) --</option>
              {currentSourceDef.fields.map(f => (
                <option key={f} value={f}>{f.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Step 4: Sorting */}
          <div>
            <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              4. Sort Field & Order
            </label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <select
                className="form-control"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem 0.65rem' }}
              >
                {currentSourceDef.fields.map(f => (
                  <option key={f} value={f}>{f.replace('_', ' ')}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', fontWeight: 700 }}
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        {/* Step 5: Column Checkboxes */}
        <div style={{ marginTop: '1.25rem' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
            5. Select Columns to Include in Output:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {currentSourceDef.fields.map(f => {
              const isSelected = selectedFields.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleToggleField(f)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'var(--inner-card-bg)',
                    color: isSelected ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  {isSelected && <Check size={12} />}
                  {f.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Report Toolbar */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: 360 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Save custom report as..."
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              style={{ fontSize: '0.78rem', padding: '0.45rem 0.75rem' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              style={{ fontSize: '0.78rem', background: 'var(--accent-emerald)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
            >
              <Save size={13} /> Save Report
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {pivotColumns && (
              <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--inner-card-bg)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('table')}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    background: activeTab === 'table' ? 'var(--accent-emerald)' : 'transparent',
                    color: activeTab === 'table' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Tabular View
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('pivot')}
                  style={{
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    background: activeTab === 'pivot' ? 'var(--accent-emerald)' : 'transparent',
                    color: activeTab === 'pivot' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  2D Pivot Matrix
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Report Output Display */}
      <div className="glass-panel" style={{ padding: '1.4rem 1.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
              {activeTab === 'pivot' && pivotColumns ? `2D Pivot Matrix (${groupBy} × ${pivotColumns})` : `Report Output: ${currentSourceDef.label}`}
            </h4>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Reconciled records ({previewResult?.total_rows_count || 0} rows found)
            </p>
          </div>
        </div>

        {activeTab === 'pivot' && previewResult?.pivot_matrix ? (
          /* 2D Pivot Table Render */
          <PivotTable
            pivotMatrix={previewResult.pivot_matrix}
            currency={reportingCurrency}
            isMasked={isMasked}
          />
        ) : (
          /* Standard Dynamic Tabular View */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--inner-card-bg)', textAlign: 'left' }}>
                  {selectedFields.map(f => (
                    <th key={f} style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                      {f.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!previewResult?.rows || previewResult.rows.length === 0 ? (
                  <tr>
                    <td colSpan={selectedFields.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No records matched current configuration.
                    </td>
                  </tr>
                ) : (
                  previewResult.rows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {selectedFields.map(f => {
                        const val = row[f];
                        const isNum = typeof val === 'number';
                        return (
                          <td key={f} style={{ padding: '0.65rem 0.8rem', fontWeight: f.includes('name') || f.includes('ref') ? 700 : 500 }}>
                            {isMasked && isNum ? maskValue(val) : String(val ?? '-')}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
