import React from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { formatMoney, getCurrencySymbol, maskValue } from '../../../utils/currency';

export const KpiCard = ({
  title,
  value,
  currency = 'INR',
  isCurrency = true,
  isPercentage = false,
  isMasked = false,
  changePercent = null,
  changeLabel = 'vs prev period',
  subtitle = null,
  accentColor = 'var(--accent-emerald)',
  badge = null,
  badgeColor = null,
  onClick = null,
  sparklineData = []
}) => {
  const symbol = getCurrencySymbol(currency);

  const renderValue = () => {
    if (isMasked) {
      if (isPercentage) return '•••%';
      if (isCurrency) return `${symbol}••••••`;
      return '••••••';
    }
    if (isPercentage) return `${Number(value || 0).toFixed(1)}%`;
    if (isCurrency) return `${symbol}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    return Number(value || 0).toLocaleString();
  };

  const isPositive = changePercent !== null && changePercent > 0;
  const isNegative = changePercent !== null && changePercent < 0;

  return (
    <div
      className={`glass-panel kpi-interactive-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{
        padding: '1.25rem 1.4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        borderLeft: `4px solid ${accentColor}`
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '999px',
              background: badgeColor || 'rgba(16, 185, 129, 0.12)',
              color: badgeColor ? '#fff' : 'var(--accent-emerald)',
              border: `1px solid ${badgeColor || 'rgba(16, 185, 129, 0.25)'}`
            }}>
              {badge}
            </span>
          )}
        </div>

        <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {renderValue()}
        </div>

        {subtitle && (
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {subtitle}
          </div>
        )}
      </div>

      {changePercent !== null && !isMasked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.74rem' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.2rem',
            fontWeight: 700,
            color: isPositive ? 'var(--accent-emerald)' : isNegative ? 'var(--accent-rose)' : 'var(--text-muted)'
          }}>
            {isPositive ? <TrendingUp size={13} /> : isNegative ? <TrendingDown size={13} /> : <Minus size={13} />}
            {isPositive ? `+${changePercent}%` : `${changePercent}%`}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{changeLabel}</span>
        </div>
      )}
    </div>
  );
};
