import React, { useState } from 'react';
import { X, Plus, Trash2, Filter, Check, RotateCcw } from 'lucide-react';

const FILTER_FIELDS = [
  { key: 'direction', label: 'Direction', type: 'select', options: [{ value: 'lent', label: 'Money Lent' }, { value: 'borrowed', label: 'Money Borrowed' }] },
  { key: 'currency', label: 'Currency', type: 'select', options: [{ value: 'INR', label: 'INR (₹)' }, { value: 'USD', label: 'USD ($)' }, { value: 'EUR', label: 'EUR (€)' }, { value: 'GBP', label: 'GBP (£)' }, { value: 'CAD', label: 'CAD (C$)' }, { value: 'AUD', label: 'AUD (A$)' }] },
  { key: 'status', label: 'Financial Status', type: 'select', options: [{ value: 'OPEN', label: 'Open' }, { value: 'PARTIALLY_PAID', label: 'Partially Paid' }, { value: 'PAID', label: 'Paid' }, { value: 'WRITTEN_OFF', label: 'Written Off' }] },
  { key: 'principal_amount', label: 'Principal Amount', type: 'number' },
  { key: 'due_date', label: 'Agreed Due Date', type: 'date' },
  { key: 'date_given', label: 'Date Given', type: 'date' },
  { key: 'purpose', label: 'Purpose', type: 'text' },
  { key: 'person_name', label: 'Person Name', type: 'text' },
];

const OPERATORS = [
  { key: 'eq', label: 'Equals (=)' },
  { key: 'neq', label: 'Not Equal (!=)' },
  { key: 'gt', label: 'Greater than (>)' },
  { key: 'gte', label: 'Greater than or Equal (>=)' },
  { key: 'lt', label: 'Less than (<)' },
  { key: 'lte', label: 'Less than or Equal (<=)' },
  { key: 'contains', label: 'Contains (text)' },
];

export const DynamicFilterBuilderModal = ({
  isOpen,
  onClose,
  initialFilters = {},
  onApplyFilters
}) => {
  const [condition, setCondition] = useState(initialFilters.condition || 'AND');
  const [rules, setRules] = useState(
    initialFilters.rules && initialFilters.rules.length > 0
      ? initialFilters.rules
      : [{ field: 'direction', operator: 'eq', value: 'lent' }]
  );

  if (!isOpen) return null;

  const handleAddRule = () => {
    setRules([...rules, { field: 'currency', operator: 'eq', value: 'INR' }]);
  };

  const handleRemoveRule = (index) => {
    const next = rules.filter((_, i) => i !== index);
    setRules(next.length > 0 ? next : [{ field: 'direction', operator: 'eq', value: 'lent' }]);
  };

  const handleUpdateRule = (index, key, val) => {
    const next = [...rules];
    next[index][key] = val;
    setRules(next);
  };

  const handleReset = () => {
    setRules([{ field: 'direction', operator: 'eq', value: 'lent' }]);
    setCondition('AND');
  };

  const handleApply = () => {
    onApplyFilters({ condition, rules });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Filter size={18} color="var(--accent-emerald)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Advanced Dynamic Filter Engine</h3>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>Build complex multi-criteria AST filter rules</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Match Condition (AND / OR) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Match:</span>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--inner-card-bg)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setCondition('AND')}
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: condition === 'AND' ? 'var(--accent-emerald)' : 'transparent',
                  color: condition === 'AND' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                ALL conditions (AND)
              </button>
              <button
                type="button"
                onClick={() => setCondition('OR')}
                style={{
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: condition === 'OR' ? 'var(--accent-emerald)' : 'transparent',
                  color: condition === 'OR' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                ANY condition (OR)
              </button>
            </div>
          </div>

          {/* Rule Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {rules.map((rule, idx) => {
              const selectedFieldDef = FILTER_FIELDS.find(f => f.key === rule.field) || FILTER_FIELDS[0];

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--inner-card-bg)',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap'
                  }}
                >
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', width: 22 }}>
                    #{idx + 1}
                  </span>

                  {/* Field Selector */}
                  <select
                    className="form-control"
                    value={rule.field}
                    onChange={(e) => handleUpdateRule(idx, 'field', e.target.value)}
                    style={{ flex: '1.2', minWidth: 140, fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
                  >
                    {FILTER_FIELDS.map(f => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>

                  {/* Operator Selector */}
                  <select
                    className="form-control"
                    value={rule.operator}
                    onChange={(e) => handleUpdateRule(idx, 'operator', e.target.value)}
                    style={{ flex: '1', minWidth: 130, fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
                  >
                    {OPERATORS.map(op => (
                      <option key={op.key} value={op.key}>{op.label}</option>
                    ))}
                  </select>

                  {/* Value Input */}
                  {selectedFieldDef.type === 'select' ? (
                    <select
                      className="form-control"
                      value={rule.value}
                      onChange={(e) => handleUpdateRule(idx, 'value', e.target.value)}
                      style={{ flex: '1.2', minWidth: 130, fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
                    >
                      {selectedFieldDef.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={selectedFieldDef.type}
                      className="form-control"
                      placeholder="Value..."
                      value={rule.value}
                      onChange={(e) => handleUpdateRule(idx, 'value', e.target.value)}
                      style={{ flex: '1.2', minWidth: 130, fontSize: '0.78rem', padding: '0.4rem 0.6rem' }}
                    />
                  )}

                  {/* Delete Rule */}
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    title="Remove rule"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent-rose)',
                      cursor: 'pointer',
                      padding: '0.3rem',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAddRule}
            style={{ width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', padding: '0.4rem 0.8rem' }}
          >
            <Plus size={14} /> Add Condition Rule
          </button>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--inner-card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem' }}
          >
            <RotateCcw size={14} /> Reset Rules
          </button>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.78rem' }}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApply}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', background: 'var(--accent-emerald)', color: '#fff' }}
            >
              <Check size={14} /> Apply Filter Rules ({rules.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
