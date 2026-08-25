import React from 'react';
import { getCurrencySymbol, maskValue } from '../../../utils/currency';

export const PivotTable = ({
  pivotMatrix,
  currency = 'INR',
  isMasked = false
}) => {
  if (!pivotMatrix || !pivotMatrix.row_keys || !pivotMatrix.col_keys) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Select both a Primary Group (Row Dimension) and a Secondary Dimension (Column Dimension) to calculate 2D Pivot Matrix.
      </div>
    );
  }

  const { row_dimension, col_dimension, row_keys, col_keys, cells, row_totals, col_totals, grand_total } = pivotMatrix;
  const symbol = getCurrencySymbol(currency);

  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ background: 'var(--inner-card-bg)', borderBottom: '2px solid var(--border-subtle)' }}>
            <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '0.72rem' }}>
              {row_dimension} \ {col_dimension}
            </th>
            {col_keys.map(col => (
              <th key={col} style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                {col}
              </th>
            ))}
            <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, background: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-emerald)', fontSize: '0.72rem' }}>
              TOTAL
            </th>
          </tr>
        </thead>
        <tbody>
          {row_keys.map((row, idx) => (
            <tr key={row} style={{ borderBottom: '1px solid var(--border-subtle)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
              <td style={{ padding: '0.65rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {row}
              </td>
              {col_keys.map(col => {
                const val = cells[row]?.[col] || 0.0;
                return (
                  <td key={col} style={{ padding: '0.65rem 1rem', textAlign: 'right', color: val > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {isMasked ? maskValue(val) : val > 0 ? `${symbol}${val.toLocaleString()}` : '-'}
                  </td>
                );
              })}
              <td style={{ padding: '0.65rem 1rem', textAlign: 'right', fontWeight: 700, background: 'rgba(16, 185, 129, 0.05)', color: 'var(--accent-emerald)' }}>
                {isMasked ? maskValue(row_totals[row]) : `${symbol}${Number(row_totals[row] || 0).toLocaleString()}`}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: 'var(--inner-card-bg)', borderTop: '2px solid var(--border-subtle)', fontWeight: 800 }}>
            <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', textTransform: 'uppercase', fontSize: '0.72rem' }}>
              COLUMNS TOTAL
            </td>
            {col_keys.map(col => (
              <td key={col} style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                {isMasked ? maskValue(col_totals[col]) : `${symbol}${Number(col_totals[col] || 0).toLocaleString()}`}
              </td>
            ))}
            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>
              {isMasked ? maskValue(grand_total) : `${symbol}${Number(grand_total || 0).toLocaleString()}`}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
