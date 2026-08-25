import React, { useState } from 'react';
import { TableViewToggle } from './TableViewToggle';
import { getCurrencySymbol, maskValue } from '../../../utils/currency';

export const BarChart = ({
  title,
  subtitle = null,
  data = [], // [{ label: 'Personal', value: 12000, secondaryValue?: 4000, color?: '...' }]
  currency = 'INR',
  isMasked = false,
  orientation = 'horizontal', // 'horizontal' or 'vertical'
  valueKey = 'value',
  labelKey = 'label',
  barColor = 'var(--accent-emerald)',
  height = 240
}) => {
  const [isTableView, setIsTableView] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const symbol = getCurrencySymbol(currency);

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</h4>
        <p style={{ fontSize: '0.82rem' }}>No data available for this category.</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => Number(d[valueKey] || 0)), 1);

  return (
    <div className="glass-panel" style={{ padding: '1.4rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h4>
          {subtitle && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        <TableViewToggle isTableView={isTableView} onToggle={() => setIsTableView(!isTableView)} />
      </div>

      {isTableView ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--inner-card-bg)', textAlign: 'left' }}>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>Category</th>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>Amount</th>
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>Relative Share</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>{d[labelKey]}</td>
                <td style={{ padding: '0.55rem 0.75rem' }}>
                  {isMasked ? maskValue(d[valueKey]) : `${symbol}${Number(d[valueKey] || 0).toLocaleString()}`}
                </td>
                <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700 }}>
                  {((Number(d[valueKey] || 0) / maxVal) * 100).toFixed(0)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.map((d, i) => {
            const val = Number(d[valueKey] || 0);
            const pct = Math.min(100, Math.max(2, (val / maxVal) * 100));
            const color = d.color || barColor;
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  padding: '0.35rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: isHovered ? 'var(--inner-card-bg)' : 'transparent',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d[labelKey]}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isMasked ? maskValue(val) : `${symbol}${val.toLocaleString()}`}
                  </span>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'var(--border-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: color,
                      borderRadius: '999px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
