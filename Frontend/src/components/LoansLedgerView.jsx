import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowDownLeft, 
  Share2, 
  ChevronRight, 
  XOctagon, 
  BookOpen,
  Calendar,
  DollarSign
} from 'lucide-react';
import { getCurrencySymbol, formatMoney, convertCurrency, getDefaultCurrency } from '../utils/currency';

const STATUS_TABS = [
  { id: 'all', label: 'All Records' },
  { id: 'active', label: 'Active / Open' },
  { id: 'partially_paid', label: 'Partially Paid' },
  { id: 'due_soon', label: 'Due Soon' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'paid', label: 'Settled / Paid' },
];

export const LoansLedgerView = ({ 
  loans = [], 
  onOpenNewLoan, 
  onRecordPayment, 
  onGenerateStatement, 
  onCancelLoan,
  onWriteOffLoan 
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedLoanId, setExpandedLoanId] = useState(null);

  const filtered = loans.filter((l) => {
    const isBorrowing = (l.direction === 'borrowed');
    if (directionFilter === 'lent' && isBorrowing) return false;
    if (directionFilter === 'borrowed' && !isBorrowing) return false;

    const matchesSearch = 
      l.loan_reference?.toLowerCase().includes(search.toLowerCase()) ||
      l.person_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.purpose?.toLowerCase().includes(search.toLowerCase()) ||
      l.notes?.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'active') return l.status === 'OPEN' || l.status === 'PARTIALLY_PAID';
    if (activeTab === 'partially_paid') return l.status === 'PARTIALLY_PAID';
    if (activeTab === 'due_soon') return l.time_status === 'DUE_SOON' || l.time_status === 'DUE_TODAY';
    if (activeTab === 'overdue') return l.time_status === 'OVERDUE' || l.days_overdue > 0;
    if (activeTab === 'paid') return l.status === 'PAID';
    return true;
  });

  const getStatusBadge = (status, timeStatus) => {
    if (status === 'PAID') {
      return <span className="badge badge-approved">Settled / Paid</span>;
    }
    if (status === 'CANCELLED') {
      return <span className="badge badge-draft">Cancelled</span>;
    }
    if (status === 'WRITTEN_OFF') {
      return <span className="badge badge-rejected">Written Off</span>;
    }
    if (timeStatus === 'OVERDUE') {
      return <span className="badge badge-rejected">Overdue</span>;
    }
    if (timeStatus === 'DUE_TODAY') {
      return <span className="badge badge-under_review">Due Today</span>;
    }
    if (timeStatus === 'DUE_SOON') {
      return <span className="badge badge-under_review">Due Soon</span>;
    }
    if (status === 'PARTIALLY_PAID') {
      return <span className="badge badge-submitted">Partially Paid</span>;
    }
    return <span className="badge badge-submitted">Open</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Filter Controls */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Financial Ledger (Authoritative Records)</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Complete record of all money lent (receivables) and money borrowed (payables), repayment installments, due dates, and settlement status
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Direction Tabs */}
            <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--inner-card-bg)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setDirectionFilter('all')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: directionFilter === 'all' ? 'var(--bg-surface)' : 'transparent',
                  color: directionFilter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setDirectionFilter('lent')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: directionFilter === 'lent' ? 'var(--accent-emerald)' : 'transparent',
                  color: directionFilter === 'lent' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                🤝 Money Lent
              </button>
              <button
                type="button"
                onClick={() => setDirectionFilter('borrowed')}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: directionFilter === 'borrowed' ? 'var(--accent-indigo)' : 'transparent',
                  color: directionFilter === 'borrowed' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                📥 Money Borrowed
              </button>
            </div>

            <div style={{ position: 'relative', minWidth: 260 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search reference, contact, purpose..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
              />
            </div>

            <button className="btn btn-primary" onClick={onOpenNewLoan} style={{ whiteSpace: 'nowrap' }}>
              <Plus size={16} />
              <span>Record Transaction</span>
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', overflowX: 'auto' }}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                background: activeTab === t.id ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === t.id ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                border: activeTab === t.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Cards / Rows */}
      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <BookOpen size={44} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem' }}>No Lending Records Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 1.25rem' }}>
            There are no loans matching your selected filter.
          </p>
          <button className="btn btn-primary" onClick={onOpenNewLoan}>
            <Plus size={16} />
            <span>Record Money Lent</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((loan) => {
            const isExpanded = expandedLoanId === loan.id;
            const principal = Number(loan.principal_amount || 0);
            const repaid = Number(loan.balance?.total_repaid || 0);
            const outstanding = Number(loan.balance?.outstanding || (principal - repaid));
            const progressPercent = principal > 0 ? Math.min(100, Math.round((repaid / principal) * 100)) : 0;

            return (
              <div
                key={loan.id}
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  border: isExpanded ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                  background: isExpanded ? 'var(--bg-card-hover)' : 'var(--bg-card)'
                }}
              >
                {/* Main Card Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  {/* Left: Borrower & Loan Reference */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: loan.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: loan.status === 'PAID' ? 'var(--accent-emerald)' : 'var(--accent-blue)'
                    }}>
                      {loan.person_name ? loan.person_name[0]?.toUpperCase() : 'B'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>{loan.person_name}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          #{loan.loan_reference}
                        </span>
                        {getStatusBadge(loan.status, loan.time_status)}
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.85rem', marginTop: '0.2rem' }}>
                        <span>Lent on: <strong>{loan.date_given}</strong></span>
                        {loan.due_date ? (
                          <span>Due: <strong>{loan.due_date}</strong> {loan.days_overdue > 0 && <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>({loan.days_overdue}d overdue)</span>}</span>
                        ) : (
                          <span>No due date</span>
                        )}
                        {loan.purpose && <span>• {loan.purpose}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Financial Balance & Progress Bar */}
                  <div style={{ minWidth: 230 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Outstanding:</span>
                      <strong style={{ color: outstanding > 0 ? 'var(--accent-cyan)' : 'var(--accent-emerald)', fontSize: '0.95rem' }}>
                        {getCurrencySymbol(loan.currency)}{outstanding.toLocaleString()} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{loan.currency || 'INR'}</span>
                      </strong>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${progressPercent}%`, background: 'var(--accent-emerald)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      <span>Repaid: {getCurrencySymbol(loan.currency)}{repaid.toLocaleString()} ({progressPercent}%)</span>
                      <span>Principal: {getCurrencySymbol(loan.currency)}{principal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {loan.status !== 'PAID' && loan.status !== 'CANCELLED' && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                        onClick={() => onRecordPayment(loan)}
                      >
                        <ArrowDownLeft size={14} />
                        <span>Record Payment</span>
                      </button>
                    )}

                    <button
                      className="btn btn-secondary"
                      title="Generate Digital IOU & Statement"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                      onClick={() => onGenerateStatement(loan)}
                    >
                      <FileText size={14} />
                      <span>Digital IOU</span>
                    </button>

                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.6rem' }}
                      onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                    >
                      <ChevronRight
                        size={16}
                        style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Repayment History & Ledger Drawer */}
                {isExpanded && (
                  <div style={{
                    marginTop: '1.25rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Repayment Transaction History</h4>
                      {loan.status !== 'CANCELLED' && loan.status !== 'PAID' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                            onClick={() => onCancelLoan(loan.id)}
                          >
                            Void / Cancel Loan
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', color: 'var(--accent-rose)' }}
                            onClick={() => onWriteOffLoan(loan.id)}
                          >
                            Write Off (Default)
                          </button>
                        </div>
                      )}
                    </div>

                    {(() => {
                      const paymentsList = loan.repayments || loan.recent_payments || [];
                      if (paymentsList.length === 0) {
                        return (
                          <div style={{ padding: '1rem', background: 'var(--inner-card-bg)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            No repayments recorded yet for this loan.
                          </div>
                        );
                      }
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {paymentsList.map((p) => (
                            <div key={p.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.65rem 1rem',
                              background: 'var(--inner-card-bg)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-subtle)',
                              fontSize: '0.825rem'
                            }}>
                              <div>
                                <strong style={{ color: 'var(--accent-emerald)' }}>+ {getCurrencySymbol(p.currency || loan.currency)}{Number(p.amount).toLocaleString()} {p.currency || loan.currency}</strong>
                                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
                                  via {p.payment_method?.replace('_', ' ')}
                                </span>
                                {p.reference_number && (
                                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                                    Ref: {p.reference_number}
                                  </span>
                                )}
                              </div>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                {p.payment_date}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
