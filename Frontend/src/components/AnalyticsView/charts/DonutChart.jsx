import React, { useState } from 'react';
import { TableViewToggle } from './TableViewToggle';
import { getCurrencySymbol, maskValue } from '../../../utils/currency';

export const DonutChart = ({
  title,
  subtitle = null,
  data = [], // [{ label: 'EUR', value: 10000, color: '#...', count: 5 }]
  currency = 'INR',
  isMasked = false,
  centerLabel = 'Total Share',
  size = 220
}) => {
  const [isTableView, setIsTableView] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const symbol = getCurrencySymbol(currency);

  const totalValue = data.reduce((acc, d) => acc + Number(d.value || 0), 0);

  if (!data || data.length === 0 || totalValue === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</h4>
        <p style={{ fontSize: '0.82rem' }}>No distribution data available.</p>
      </div>
    );
  }

  const defaultPalette = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#64748b'];
  const formattedData = data.map((d, i) => ({
    ...d,
    color: d.color || defaultPalette[i % defaultPalette.length],
    percentage: totalValue > 0 ? (Number(d.value || 0) / totalValue) * 100 : 0
  }));

  // Build SVG Arcs
  const radius = 78;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

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
              <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>Share %</th>
            </tr>
          </thead>
          <tbody>
            {formattedData.map((d, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  {d.label}
                </td>
                <td style={{ padding: '0.55rem 0.75rem' }}>
                  {isMasked ? maskValue(d.value) : `${symbol}${Number(d.value || 0).toLocaleString()}`}
                </td>
                <td style={{ padding: '0.55rem 0.75rem', fontWeight: 700 }}>
                  {d.percentage.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.25rem' }}>
          {/* Donut Circle */}
          <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              {formattedData.map((slice, i) => {
                const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedOffset;
                accumulatedOffset += (slice.percentage / 100) * circumference;
                const isHovered = hoveredIndex === i;

                return (
                  <circle
                    key={i}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      cursor: 'pointer',
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1
                    }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Center Label */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              textAlign: 'center',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                {hoveredIndex !== null ? formattedData[hoveredIndex].label : centerLabel}
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
                {isMasked
                  ? '••••••'
                  : hoveredIndex !== null
                    ? `${symbol}${Number(formattedData[hoveredIndex].value).toLocaleString()}`
                    : `${symbol}${Number(totalValue).toLocaleString()}`
                }
              </span>
              {hoveredIndex !== null && !isMasked && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: formattedData[hoveredIndex].color }}>
                  {formattedData[hoveredIndex].percentage.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Interactive Legend List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1, minWidth: 150 }}>
            {formattedData.map((d, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.35rem 0.55rem',
                  borderRadius: 'var(--radius-sm)',
                  background: hoveredIndex === i ? 'var(--inner-card-bg)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: d.color }} />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {isMasked ? '••••' : `${symbol}${Number(d.value).toLocaleString()}`}
                  </span>
                  <span style={{ fontWeight: 700, color: d.color, minWidth: 36, textAlign: 'right' }}>
                    {d.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
