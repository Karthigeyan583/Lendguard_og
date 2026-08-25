import React from 'react';
import { DollarSign, FileText, CheckCircle2, TrendingUp, ShieldAlert } from 'lucide-react';

export const StatsCards = ({ stats, loansCount = 0 }) => {
  const totalAmount = stats?.total_requested_amount ?? 0;
  const totalApps = stats?.total_applications ?? loansCount;
  const avgAmount = stats?.average_loan_amount ?? (totalApps > 0 ? totalAmount / totalApps : 0);

  // Calculate approval rate
  let approvedCount = 0;
  if (stats?.status_breakdown) {
    const approvedObj = stats.status_breakdown.find(s => s.status === 'approved');
    approvedCount = approvedObj ? approvedObj.count : 0;
  }
  const approvalRate = totalApps > 0 ? Math.round((approvedCount / totalApps) * 100) : 0;

  const cards = [
    {
      title: 'Total Pipeline Capital',
      value: `$${Number(totalAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      change: '+14.2% this month',
      icon: DollarSign,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.12)'
    },
    {
      title: 'Active Applications',
      value: totalApps,
      change: `${approvedCount} approved to date`,
      icon: FileText,
      color: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.12)'
    },
    {
      title: 'Approval Rate',
      value: `${approvalRate}%`,
      change: 'Risk threshold: 700+ FICO',
      icon: CheckCircle2,
      color: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.12)'
    },
    {
      title: 'Average Loan Amount',
      value: `$${Number(avgAmount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      change: 'Avg. term 36 months',
      icon: TrendingUp,
      color: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.12)'
    }
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              background: card.bgGlow,
              borderRadius: '50%',
              filter: 'blur(20px)'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{card.title}</span>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: card.bgGlow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={18} color={card.color} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {card.change}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
