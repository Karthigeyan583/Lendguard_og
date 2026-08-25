import React, { useState } from 'react';
import { TableViewToggle } from './TableViewToggle';
import { getCurrencySymbol, maskValue } from '../../../utils/currency';

export const TrendLineChart = ({
  title,
  subtitle = null,
  data = [],
  series = [{ key: 'lent', label: 'Lending', color: 'var(--accent-emerald)' }],
  xAxisKey = 'month',
  currency = 'INR',
  isMasked = false,
  height = 260
}) => {
  const [isTableView, setIsTableView] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const symbol = getCurrencySymbol(currency);

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</h4>
        <p style={{ fontSize: '0.82rem' }}>No trend data recorded for this time range.</p>
      </div>
    );
  }

  // Calculate scales
  let maxVal = 1;
  data.forEach(d => {
    series.forEach(s => {
      const val = Number(d[s.key] || 0);
      if (val > maxVal) maxVal = val;
    });
  });
  maxVal = maxVal * 1.15; // 15% top headroom

  const chartWidth = 650;
  const chartHeight = height;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (index) => {
    if (data.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    const clamped = Math.max(0, Number(val || 0));
    return paddingTop + innerHeight - (clamped / maxVal) * innerHeight;
  };

  // Generate SVG Path
  const generatePath = (sKey) => {
    if (data.length === 0) return '';
    return data.reduce((acc, d, i) => {
      const x = getX(i);
      const y = getY(d[sKey]);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const generateAreaPath = (sKey) => {
    if (data.length === 0) return '';
    const linePath = generatePath(sKey);
    const startX = getX(0);
    const endX = getX(data.length - 1);
    const bottomY = paddingTop + innerHeight;
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.4rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header with Title and Table Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h4>
          {subtitle && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {series.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem' }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color }} />
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
          <TableViewToggle isTableView={isTableView} onToggle={() => setIsTableView(!isTableView)} />
        </div>
      </div>

      {isTableView ? (
        /* Accessible Table View */
        <div style={{ overflowX: 'auto', maxHeight: height + 30 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--inner-card-bg)', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>Period</th>
                {series.map(s => (
                  <th key={s.key} style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>{row[xAxisKey]}</td>
                  {series.map(s => (
                    <td key={s.key} style={{ padding: '0.55rem 0.75rem' }}>
                      {isMasked ? maskValue(row[s.key]) : `${symbol}${Number(row[s.key] || 0).toLocaleString()}`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Interactive SVG Chart */
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          >
            <defs>
              {series.map(s => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
                </linearGradient>
              ))}
            </defs>

            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingTop + innerHeight * (1 - pct);
              const val = maxVal * pct;
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="var(--border-subtle)"
                    strokeDasharray={pct === 0 ? "0" : "3,3"}
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="9.5"
                    fill="var(--text-muted)"
                  >
                    {isMasked ? '••••' : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : Math.round(val)}
                  </text>
                </g>
              );
            })}

            {/* Area Fills */}
            {series.map(s => (
              <path
                key={`area-${s.key}`}
                d={generateAreaPath(s.key)}
                fill={`url(#grad-${s.key})`}
              />
            ))}

            {/* Series Lines */}
            {series.map(s => (
              <path
                key={`line-${s.key}`}
                d={generatePath(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}

            {/* X-Axis Labels & Hover Interaction Columns */}
            {data.map((d, i) => {
              const x = getX(i);
              const label = String(d[xAxisKey] || '');
              const shortLabel = label.length > 7 ? label.slice(5) : label;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Invisible Hover Area */}
                  <rect
                    x={x - (innerWidth / data.length) / 2}
                    y={paddingTop}
                    width={innerWidth / data.length}
                    height={innerHeight}
                    fill="transparent"
                  />

                  {/* Active Hover Guide Line */}
                  {hoveredIndex === i && (
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + innerHeight}
                      stroke="var(--text-secondary)"
                      strokeDasharray="2,2"
                      strokeWidth="1.2"
                    />
                  )}

                  {/* Series Points */}
                  {series.map(s => {
                    const y = getY(d[s.key]);
                    const isHovered = hoveredIndex === i;
                    return (
                      <circle
                        key={`pt-${s.key}-${i}`}
                        cx={x}
                        cy={y}
                        r={isHovered ? 5.5 : 3.5}
                        fill="var(--bg-surface)"
                        stroke={s.color}
                        strokeWidth={isHovered ? 2.5 : 2}
                        style={{ transition: 'r 0.15s ease' }}
                      />
                    );
                  })}

                  {/* X-axis Label */}
                  <text
                    x={x}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={hoveredIndex === i ? 'var(--text-primary)' : 'var(--text-muted)'}
                    fontWeight={hoveredIndex === i ? '700' : '500'}
                  >
                    {shortLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Floating Tooltip */}
          {hoveredIndex !== null && data[hoveredIndex] && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '15px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.75rem',
              fontSize: '0.75rem',
              pointerEvents: 'none',
              zIndex: 10
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {data[hoveredIndex][xAxisKey]}
              </div>
              {series.map(s => (
                <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', color: s.color }}>
                  <span>{s.label}:</span>
                  <span style={{ fontWeight: 700 }}>
                    {isMasked ? '••••••' : `${symbol}${Number(data[hoveredIndex][s.key] || 0).toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
