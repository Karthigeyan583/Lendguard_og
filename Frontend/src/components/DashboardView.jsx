import React from 'react';
import { 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  FileText,
  Share2,
  ChevronRight
} from 'lucide-react';

export const DashboardView = ({ 
  summary, 
  loans = [], 
  people = [], 
  onRecordPaymentForLoan, 
  onGenerateStatement, 
  onOpenNewLoan,
  onOpenAddPerson,
  onOpenPersonDetails
}) => {
  // Filter urgent active loans
  const overdueLoans = loans.filter(
    l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) &&
         l.status !== 'PAID' && l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF'
  );
  const dueSoonLoans = loans.filter(
    l => (l.time_status === 'DUE_SOON' || l.time_status === 'DUE_TODAY') &&
         l.status !== 'PAID' && l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF'
  );

  const totalLent = summary?.total_lent ?? loans.reduce((acc, l) => acc + (l.status !== 'CANCELLED' ? Number(l.principal_amount || 0) : 0), 0);
  const totalRepaid = summary?.total_repaid ?? loans.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
  const totalOutstanding = summary?.total_outstanding ?? loans.reduce((acc, l) => acc + (l.status !== 'CANCELLED' && l.status !== 'PAID' ? Number(l.balance?.outstanding || 0) : 0), 0);
  const totalOverdue = summary?.total_overdue ?? overdueLoans.reduce((acc, l) => acc + Number(l.balance?.outstanding || 0), 0);
  const recoveryRate = summary?.recovery_rate ?? (totalLent > 0 ? Number(((totalRepaid / totalLent) * 100).toFixed(1)) : 0);
  const overdueCount = summary?.overdue_count ?? overdueLoans.length;
  const dueSoonCount = summary?.due_soon_count ?? dueSoonLoans.length;
  const activeDebtorsCount = people.filter(p => Number(p.outstanding_balance || 0) > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 4 Main KPI Cards */}
      <div className="stats-grid">
        {/* Total Lent */}
        <div className="glass-panel kpi-card kpi-lent" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL CAPITAL LENT</span>
            <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpRight size={19} color="var(--accent-blue)" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            ₹{Number(totalLent).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Across {loans.length} total lending {loans.length === 1 ? 'record' : 'records'}
          </div>
        </div>

        {/* Total Repaid */}
        <div className="glass-panel kpi-card kpi-repaid" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL REPAID</span>
            <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={19} color="var(--accent-emerald)" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-emerald)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            ₹{Number(totalRepaid).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Recovery Rate: <strong>{recoveryRate}%</strong>
          </div>
        </div>

        {/* Net Outstanding */}
        <div className="glass-panel kpi-card kpi-outstanding" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>NET OUTSTANDING BALANCE</span>
            <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={19} color="var(--accent-cyan)" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            ₹{Number(totalOutstanding).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {activeDebtorsCount > 0 
              ? `Owed across ${activeDebtorsCount} active ${activeDebtorsCount === 1 ? 'borrower' : 'borrowers'}`
              : `Zero outstanding balance across contacts`}
          </div>
        </div>

        {/* Total Overdue */}
        <div className="glass-panel kpi-card kpi-overdue" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>OVERDUE AMOUNT</span>
            <div className="kpi-icon" style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={19} color="var(--accent-rose)" />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: overdueCount > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            ₹{Number(totalOverdue).toLocaleString()}
          </div>
          {overdueCount > 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-rose)' }}>
              {overdueCount} {overdueCount === 1 ? 'loan requires' : 'loans require'} immediate attention
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
              ✓ All loan repayments are up to date
            </div>
          )}
        </div>
      </div>

      {/* Recovery Progress Bar Strip */}
      <div className="glass-panel dashboard-item-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Overall Portfolio Recovery Progress</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{recoveryRate}% Settled</span>
        </div>
        <div style={{ height: 10, background: 'var(--bg-surface)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${Math.min(100, Math.max(0, recoveryRate))}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Two Column Layout: Urgent Follow-ups + Recent Activity */}
      <div className="dashboard-layout">
        {/* Left: Urgent Attention & Reminders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Overdue Section */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-rose)', boxShadow: '0 0 8px var(--accent-rose)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Overdue Follow-ups</h3>
              </div>
              <span className="badge badge-rejected">{overdueLoans.length} Overdue</span>
            </div>

            {overdueLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ✓ No overdue loans! All repayments are up to date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {overdueLoans.map((l) => (
                  <div key={l.id} className="dashboard-item-card" style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{l.person_name || 'Borrower'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Loan: #{l.loan_reference} • Due: {l.due_date} (<strong style={{ color: 'var(--accent-rose)' }}>{l.days_overdue} days overdue</strong>)
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-rose)', marginTop: '0.2rem' }}>
                        ₹{Number(l.balance?.outstanding || l.principal_amount).toLocaleString()} Outstanding
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => onRecordPaymentForLoan(l)}
                      >
                        Record Repayment
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => onGenerateStatement(l)}
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Due Soon Section */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-amber)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Due Dates (Next 7 Days)</h3>
              </div>
              <span className="badge badge-under_review">{dueSoonLoans.length} Due Soon</span>
            </div>

            {dueSoonLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No loans due in the next 7 days.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {dueSoonLoans.map((l) => (
                  <div key={l.id} className="dashboard-item-card" style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.9rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{l.person_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Due on: {l.due_date} • Owed: ₹{Number(l.balance?.outstanding || l.principal_amount).toLocaleString()}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      onClick={() => onRecordPaymentForLoan(l)}
                    >
                      Collect Repayment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Action Hub & People Exposure Snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions Hub */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                onClick={onOpenNewLoan}
              >
                <Plus size={18} />
                <span>Record New Money Lent</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
                onClick={onOpenAddPerson}
              >
                <Users size={18} />
                <span>Add Borrower / Contact</span>
              </button>
            </div>
          </div>

          {/* Top Borrower Exposure */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Borrower Exposure Snapshot</h3>
            {people.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No contacts yet. Add your first contact above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[...people]
                  .sort((a, b) => Number(b.outstanding_balance || 0) - Number(a.outstanding_balance || 0))
                  .slice(0, 5)
                  .map((p) => (
                  <div
                    key={p.id}
                    className="dashboard-row-item"
                    onClick={() => onOpenPersonDetails && onOpenPersonDetails(p)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.95rem',
                      background: 'var(--inner-card-bg)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.825rem',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                    title={`Click to view full dossier & loan records for ${p.name}`}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>{p.name}</span>
                        <ChevronRight size={13} color="var(--text-muted)" style={{ opacity: 0.6 }} />
                      </div>
                      <span className="badge-role" style={{ fontSize: '0.65rem', textTransform: 'capitalize', marginTop: '0.2rem', display: 'inline-block' }}>
                        {p.relationship}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: Number(p.outstanding_balance || 0) > 0 ? 'var(--accent-cyan)' : 'var(--accent-emerald)' }}>
                        ₹{Number(p.outstanding_balance || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Owed balance
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
