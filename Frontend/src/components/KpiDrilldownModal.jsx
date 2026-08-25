import React, { useState } from 'react';
import {
  X,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ArrowDownLeft,
  Search,
  User,
  ExternalLink,
  Plus
} from 'lucide-react';
import { getCurrencySymbol, formatMoney, getDefaultCurrency, convertCurrency } from '../utils/currency';

export const KpiDrilldownModal = ({
  isOpen,
  onClose,
  type = 'lent', // 'lent' | 'repaid' | 'outstanding' | 'overdue'
  loans = [],
  people = [],
  summary,
  onRecordPayment,
  onGenerateStatement,
  onOpenPersonDetails,
  onOpenNewLoan
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const reportingCurrency = summary?.reporting_currency || (loans.length > 0 && loans[0].reporting_currency) || getDefaultCurrency();
  const currSymbol = getCurrencySymbol(reportingCurrency);

  // Extract all repayments across all loans
  const allRepayments = [];
  loans.forEach((l) => {
    if (Array.isArray(l.repayments)) {
      l.repayments.forEach((rep) => {
        allRepayments.push({
          ...rep,
          loan_id: l.id,
          loan_reference: l.loan_reference,
          person_name: l.person_name,
          currency: l.currency || reportingCurrency,
          exchange_rate: l.exchange_rate
        });
      });
    }
  });
  allRepayments.sort((a, b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at));

  // Filter lists based on type and search query
  const searchLower = search.toLowerCase();

  let title = '';
  let subtitle = '';
  let icon = null;
  let accentColor = '';
  let totalAmount = 0;
  let subMetricText = '';

  const activeLoans = loans.filter(l => l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF');
  const openLoans = loans.filter(l => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID') && l.status !== 'CANCELLED');
  const overdueLoans = loans.filter(l => (l.days_overdue > 0 || l.time_status === 'OVERDUE') && l.status !== 'PAID' && l.status !== 'CANCELLED');

  if (type === 'lent') {
    title = 'Total Capital Lent Breakdown';
    subtitle = `Authoritative lending register normalized into ${reportingCurrency} Base Reporting Currency`;
    icon = <ArrowUpRight size={22} color="var(--accent-blue)" />;
    accentColor = 'var(--accent-blue)';
    totalAmount = summary?.total_lent ?? loans.reduce((acc, l) => acc + (l.status !== 'CANCELLED' ? convertCurrency(l.principal_amount, l.currency, reportingCurrency, l.exchange_rate) : 0), 0);
    subMetricText = `${activeLoans.length} total active lending records (${reportingCurrency} Base)`;
  } else if (type === 'repaid') {
    title = 'Total Repayments & Recoveries';
    subtitle = `Itemized transaction audit ledger of all funds collected from borrowers (${reportingCurrency} Base)`;
    icon = <CheckCircle2 size={22} color="var(--accent-emerald)" />;
    accentColor = 'var(--accent-emerald)';
    totalAmount = summary?.total_repaid ?? loans.reduce((acc, l) => acc + convertCurrency(l.balance?.total_repaid || 0, l.currency, reportingCurrency, l.exchange_rate), 0);
    const recoveryRate = summary?.recovery_rate ?? (totalAmount > 0 ? ((totalAmount / (summary?.total_lent || 1)) * 100).toFixed(1) : 0);
    subMetricText = `Portfolio Recovery Rate: ${recoveryRate}% across ${allRepayments.length} transactions`;
  } else if (type === 'outstanding') {
    title = 'Net Outstanding Portfolio';
    subtitle = `Real-time overview of uncollected capital currently owed across active borrowers (${reportingCurrency} Base)`;
    icon = <Clock size={22} color="var(--accent-cyan)" />;
    accentColor = 'var(--accent-cyan)';
    totalAmount = summary?.total_outstanding ?? openLoans.reduce((acc, l) => acc + convertCurrency(l.balance?.outstanding || 0, l.currency, reportingCurrency, l.exchange_rate), 0);
    const debtorCount = people.filter(p => Number(p.outstanding_balance || 0) > 0).length;
    subMetricText = `Owed across ${debtorCount} active borrowers in ${openLoans.length} active loans`;
  } else if (type === 'overdue') {
    title = 'Overdue Loans & Delinquency Report';
    subtitle = `High-priority loans that have passed their agreed maturity due date without full settlement (${reportingCurrency} Base)`;
    icon = <AlertTriangle size={22} color="var(--accent-rose)" />;
    accentColor = 'var(--accent-rose)';
    totalAmount = summary?.total_overdue ?? overdueLoans.reduce((acc, l) => acc + convertCurrency(l.balance?.outstanding || 0, l.currency, reportingCurrency, l.exchange_rate), 0);
    subMetricText = `${overdueLoans.length} ${overdueLoans.length === 1 ? 'loan requires' : 'loans require'} immediate collection action`;
  }

  // Filter datasets
  const filteredLoans = (type === 'overdue' ? overdueLoans : type === 'outstanding' ? openLoans : activeLoans).filter((l) => {
    return (
      (l.person_name && l.person_name.toLowerCase().includes(searchLower)) ||
      (l.loan_reference && l.loan_reference.toLowerCase().includes(searchLower)) ||
      (l.purpose && l.purpose.toLowerCase().includes(searchLower))
    );
  });

  const filteredRepayments = allRepayments.filter((r) => {
    return (
      (r.person_name && r.person_name.toLowerCase().includes(searchLower)) ||
      (r.loan_reference && r.loan_reference.toLowerCase().includes(searchLower)) ||
      (r.reference_number && r.reference_number.toLowerCase().includes(searchLower)) ||
      (r.payment_method && r.payment_method.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          maxWidth: 820,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          border: '1px solid var(--border-subtle)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header */}
        <div style={{
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: `rgba(${type === 'lent' ? '59, 130, 246' : type === 'repaid' ? '16, 185, 129' : type === 'outstanding' ? '6, 182, 212' : '244, 63, 94'}, 0.15)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {title}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.45rem', borderRadius: '50%', border: 'none' }}
            title="Close popup"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. KPI Summary Bar & Search */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'var(--inner-card-bg)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Aggregate Amount
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: accentColor, letterSpacing: '-0.02em', marginTop: '0.1rem' }}>
              {currSymbol}{Number(totalAmount).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {subMetricText}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search borrower or ref..."
                className="form-input"
                style={{ paddingLeft: '2rem', fontSize: '0.8rem', height: 36 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {type === 'lent' && onOpenNewLoan && (
              <button
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                onClick={() => {
                  onClose();
                  onOpenNewLoan();
                }}
              >
                <Plus size={14} />
                <span>Lend Money</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Scrollable List Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {type === 'repaid' ? (
            /* Repayments List */
            filteredRepayments.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No repayment transactions match your query.
              </div>
            ) : (
              filteredRepayments.map((rep, idx) => (
                <div
                  key={rep.id || idx}
                  style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.9rem 1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ArrowDownLeft size={18} color="var(--accent-emerald)" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontSize: '0.925rem' }}>{rep.person_name || 'Borrower'}</strong>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-indigo)' }}>
                          #{rep.loan_reference}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Date: {rep.payment_date || rep.created_at} • Method: <span style={{ textTransform: 'capitalize' }}>{rep.payment_method?.replace('_', ' ')}</span>
                        {rep.reference_number && <span> • Ref: {rep.reference_number}</span>}
                      </div>
                      {rep.notes && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          "{rep.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      +{getCurrencySymbol(rep.currency)}{Number(rep.amount).toLocaleString()}
                    </div>
                    <span className="badge badge-settled" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                      Settled
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Loans List (Lent, Outstanding, Overdue) */
            filteredLoans.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {type === 'overdue' ? 'No loans are currently overdue! All payments are up to date.' : 'No lending records match your query.'}
              </div>
            ) : (
              filteredLoans.map((loan) => {
                const loanOutstanding = Number(loan.balance?.outstanding ?? loan.principal_amount ?? 0);
                const isPaid = loan.status === 'PAID' || loanOutstanding === 0;
                const isOverdue = (loan.days_overdue > 0 || loan.time_status === 'OVERDUE') && !isPaid;
                const loanSymbol = getCurrencySymbol(loan.currency);

                return (
                  <div
                    key={loan.id}
                    style={{
                      background: 'var(--inner-card-bg)',
                      border: `1px solid ${isOverdue ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.85rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                        <span
                          style={{ fontWeight: 700, fontSize: '0.95rem', cursor: onOpenPersonDetails ? 'pointer' : 'default', color: 'var(--text-primary)' }}
                          onClick={() => {
                            if (onOpenPersonDetails) {
                              const foundPerson = people.find(p => p.id === loan.person || p.name?.toLowerCase() === loan.person_name?.toLowerCase());
                              if (foundPerson) {
                                onClose();
                                onOpenPersonDetails(foundPerson);
                              }
                            }
                          }}
                          title="Click to view borrower dossier"
                        >
                          {loan.person_name}
                        </span>

                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-indigo)' }}>
                          #{loan.loan_reference}
                        </span>

                        <span
                          className="badge"
                          style={{
                            fontSize: '0.65rem',
                            background: isPaid ? 'rgba(16, 185, 129, 0.12)' : isOverdue ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                            color: isPaid ? 'var(--accent-emerald)' : isOverdue ? 'var(--accent-rose)' : 'var(--accent-indigo)',
                            borderColor: isPaid ? 'rgba(16, 185, 129, 0.3)' : isOverdue ? 'rgba(244, 63, 94, 0.3)' : 'rgba(99, 102, 241, 0.3)'
                          }}
                        >
                          {isPaid ? 'PAID' : isOverdue ? `OVERDUE (${loan.days_overdue}d)` : loan.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Lent: <strong>{loan.date_given}</strong></span>
                        {loan.due_date ? (
                          <span style={{ color: isOverdue ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                            Due: <strong>{loan.due_date}</strong>
                          </span>
                        ) : (
                          <span>No due date</span>
                        )}
                        {loan.purpose && <span>• {loan.purpose}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: isPaid ? 'var(--accent-emerald)' : isOverdue ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
                          {loanSymbol}{loanOutstanding.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Principal: {loanSymbol}{Number(loan.principal_amount || 0).toLocaleString()}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {!isPaid && onRecordPayment && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', gap: '0.3rem' }}
                            onClick={() => {
                              onClose();
                              onRecordPayment(loan);
                            }}
                            title="Record repayment for this loan"
                          >
                            <ArrowDownLeft size={13} />
                            <span>Collect</span>
                          </button>
                        )}

                        {onGenerateStatement && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              onClose();
                              onGenerateStatement(loan);
                            }}
                            title="Generate Digital Statement"
                          >
                            <FileText size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* 4. Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            LendGuard Drilldown Explorer
          </span>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.825rem', padding: '0.5rem 1.25rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
