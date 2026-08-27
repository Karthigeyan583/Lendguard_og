import React, { useState, useEffect } from 'react';
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
  Plus,
  Coins
} from 'lucide-react';
import { getCurrencySymbol, formatMoney, getDefaultCurrency } from '../utils/currency';

export const KpiDrilldownModal = ({
  isOpen,
  onClose,
  type = 'lent', // 'lent' | 'repaid' | 'outstanding' | 'overdue' | 'borrowed' | 'borrowed_repaid' | 'borrowed_outstanding' | 'borrowed_overdue'
  currency = null,
  loans = [],
  people = [],
  summary,
  onRecordPayment,
  onGenerateStatement,
  onOpenPersonDetails,
  onOpenNewLoan,
  isMasked = false
}) => {
  const [search, setSearch] = useState('');
  
  // Discover available currencies across user's loans
  const availableCurrencies = Array.from(new Set(loans.map(l => (l.currency || 'INR').toUpperCase())));
  if (availableCurrencies.length === 0) availableCurrencies.push((getDefaultCurrency() || 'INR').toUpperCase());

  const initialCurr = (currency || getDefaultCurrency() || 'INR').toUpperCase();
  const [selectedCurrency, setSelectedCurrency] = useState(initialCurr);

  // Sync selected currency whenever the modal opens or the prop changes
  useEffect(() => {
    if (currency) {
      setSelectedCurrency(currency.toUpperCase());
    } else {
      setSelectedCurrency((getDefaultCurrency() || 'INR').toUpperCase());
    }
  }, [currency, isOpen]);

  if (!isOpen) return null;

  const targetCurrency = selectedCurrency;
  const currSymbol = getCurrencySymbol(targetCurrency);
  const isBorrowingType = type.startsWith('borrowed');

  // STRICT SINGLE-CURRENCY FILTER: Only loans in the active selected currency!
  const currencyLoans = loans.filter(l => (l.currency || 'INR').toUpperCase() === targetCurrency);

  // Extract repayments strictly for loans in this selected currency
  const allRepayments = [];
  currencyLoans.forEach((l) => {
    const list = l.repayments || l.recent_payments || [];
    if (Array.isArray(list)) {
      list.forEach((rep) => {
        allRepayments.push({
          ...rep,
          direction: l.direction,
          loan_id: l.id,
          loan_reference: l.loan_reference,
          person_name: rep.person_name || l.person_name || (l.direction === 'borrowed' ? 'Lender' : 'Borrower'),
          currency: (rep.currency || l.currency || targetCurrency).toUpperCase(),
          exchange_rate: rep.exchange_rate || l.exchange_rate
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
  let subMetricText = '';

  const activeLoans = currencyLoans.filter(l => {
    if (l.status === 'CANCELLED' || l.status === 'WRITTEN_OFF') return false;
    if (isBorrowingType) return l.direction === 'borrowed';
    return l.direction !== 'borrowed';
  });

  const openLoans = activeLoans.filter(l => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID'));
  const overdueLoans = activeLoans.filter(l => (l.days_overdue > 0 || l.time_status === 'OVERDUE') && l.status !== 'PAID');

  const relevantRepayments = allRepayments.filter(r => {
    if (type === 'borrowed_repaid') return r.direction === 'borrowed';
    if (type === 'repaid') return r.direction !== 'borrowed';
    return true;
  });

  // Calculate authoritative aggregate total in native target currency
  let aggregateTotal = 0;
  if (type === 'repaid' || type === 'borrowed_repaid') {
    aggregateTotal = relevantRepayments.reduce((acc, r) => acc + Number(r.amount || 0), 0);
  } else if (type === 'overdue' || type === 'borrowed_overdue') {
    aggregateTotal = overdueLoans.reduce((acc, l) => acc + Number(l.balance?.outstanding ?? l.principal_amount ?? 0), 0);
  } else if (type === 'outstanding' || type === 'borrowed_outstanding') {
    aggregateTotal = openLoans.reduce((acc, l) => acc + Number(l.balance?.outstanding ?? l.principal_amount ?? 0), 0);
  } else {
    aggregateTotal = activeLoans.reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
  }

  if (type === 'lent') {
    title = `Total Capital Lent (${targetCurrency})`;
    subtitle = `Authoritative register of all lending disbursements in ${targetCurrency}`;
    icon = <ArrowUpRight size={22} color="var(--accent-blue)" />;
    accentColor = 'var(--accent-blue)';
    subMetricText = `${activeLoans.length} active lending records in ${targetCurrency}`;
  } else if (type === 'repaid') {
    title = `Total Repayments & Recoveries (${targetCurrency})`;
    subtitle = `Itemized audit ledger of all funds collected from borrowers in ${targetCurrency}`;
    icon = <CheckCircle2 size={22} color="var(--accent-emerald)" />;
    accentColor = 'var(--accent-emerald)';
    subMetricText = `${relevantRepayments.length} total ${relevantRepayments.length === 1 ? 'recovery transaction' : 'recovery transactions'} in ${targetCurrency}`;
  } else if (type === 'outstanding') {
    title = `Net Outstanding Receivables (${targetCurrency})`;
    subtitle = `Real-time overview of uncollected capital currently owed in ${targetCurrency}`;
    icon = <Clock size={22} color="var(--accent-cyan)" />;
    accentColor = 'var(--accent-cyan)';
    const debtorCount = new Set(openLoans.map(l => l.person || l.person_name)).size;
    subMetricText = `Owed across ${debtorCount} active borrowers in ${openLoans.length} active loans (${targetCurrency})`;
  } else if (type === 'overdue') {
    title = `Overdue Receivables (${targetCurrency})`;
    subtitle = `High-priority loans that have passed maturity due date in ${targetCurrency}`;
    icon = <AlertTriangle size={22} color="var(--accent-rose)" />;
    accentColor = 'var(--accent-rose)';
    subMetricText = `${overdueLoans.length} ${overdueLoans.length === 1 ? 'loan requires' : 'loans require'} collection action in ${targetCurrency}`;
  } else if (type === 'borrowed') {
    title = `Total Capital Borrowed (${targetCurrency})`;
    subtitle = `Authoritative register of all funds borrowed in ${targetCurrency}`;
    icon = <ArrowDownLeft size={22} color="var(--accent-indigo)" />;
    accentColor = 'var(--accent-indigo)';
    subMetricText = `${activeLoans.length} active borrowing obligations in ${targetCurrency}`;
  } else if (type === 'borrowed_repaid') {
    title = `Total Repaid to Lenders (${targetCurrency})`;
    subtitle = `Itemized audit ledger of all debt repayments made to lenders in ${targetCurrency}`;
    icon = <CheckCircle2 size={22} color="var(--accent-emerald)" />;
    accentColor = 'var(--accent-emerald)';
    subMetricText = `${relevantRepayments.length} debt repayment transactions in ${targetCurrency}`;
  } else if (type === 'borrowed_outstanding') {
    title = `Outstanding Payable Liabilities (${targetCurrency})`;
    subtitle = `Real-time overview of un-repaid capital owed across lenders in ${targetCurrency}`;
    icon = <Clock size={22} color="var(--accent-amber)" />;
    accentColor = 'var(--accent-amber)';
    subMetricText = `${openLoans.length} active debt obligations requiring repayment in ${targetCurrency}`;
  } else if (type === 'borrowed_overdue') {
    title = `Overdue Payables & Urgent Debts (${targetCurrency})`;
    subtitle = `High-priority debts that have passed maturity date in ${targetCurrency}`;
    icon = <AlertTriangle size={22} color="var(--accent-rose)" />;
    accentColor = 'var(--accent-rose)';
    subMetricText = `${overdueLoans.length} ${overdueLoans.length === 1 ? 'debt requires' : 'debts require'} immediate repayment in ${targetCurrency}`;
  }

  // Search filters
  const filteredLoans = ((type === 'overdue' || type === 'borrowed_overdue') 
    ? overdueLoans 
    : (type === 'outstanding' || type === 'borrowed_outstanding') 
      ? openLoans 
      : activeLoans
  ).filter((l) => {
    return (
      (l.person_name && l.person_name.toLowerCase().includes(searchLower)) ||
      (l.loan_reference && l.loan_reference.toLowerCase().includes(searchLower)) ||
      (l.purpose && l.purpose.toLowerCase().includes(searchLower))
    );
  });

  const filteredRepayments = relevantRepayments.filter((r) => {
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
          maxWidth: 840,
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
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: `rgba(${type.includes('lent') ? '59, 130, 246' : type.includes('repaid') ? '16, 185, 129' : type.includes('overdue') ? '244, 63, 94' : '6, 182, 212'}, 0.15)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {title}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.15rem' }}>
                {subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Currency Switcher Tabs (if multiple currencies exist) */}
            {availableCurrencies.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-surface)', padding: '0.2rem 0.3rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <Coins size={13} color="var(--text-muted)" style={{ marginLeft: 4 }} />
                {availableCurrencies.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCurrency(c)}
                    style={{
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-xs)',
                      border: 'none',
                      cursor: 'pointer',
                      background: selectedCurrency === c ? 'var(--accent-indigo)' : 'transparent',
                      color: selectedCurrency === c ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.45rem', borderRadius: '50%', border: 'none' }}
              title="Close popup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 2. KPI Summary Bar & Search */}
        <div style={{
          padding: '1.15rem 1.75rem',
          background: 'var(--inner-card-bg)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Total Amount in {targetCurrency}
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: accentColor, letterSpacing: '-0.02em', marginTop: '0.1rem' }}>
              {isMasked ? (
                <span>{currSymbol}••••••</span>
              ) : (
                <span>
                  {currSymbol}{Number(aggregateTotal).toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{targetCurrency}</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {subMetricText}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: 250 }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search contact, ref, purpose..."
                className="form-input"
                style={{ paddingLeft: '2rem', fontSize: '0.8rem', height: 36 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {onOpenNewLoan && (
              <button
                className="btn btn-primary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}
                onClick={() => {
                  onClose();
                  onOpenNewLoan();
                }}
              >
                <Plus size={14} />
                <span>{isBorrowingType ? 'Record Borrowing' : 'Lend Money'}</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Scrollable List Body */}
        <div style={{ padding: '1.25rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(type === 'repaid' || type === 'borrowed_repaid') ? (
            /* Repayments List */
            filteredRepayments.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No repayment transactions recorded in {targetCurrency}.
              </div>
            ) : (
              filteredRepayments.map((rep, idx) => (
                <div
                  key={rep.id || idx}
                  style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: rep.direction === 'borrowed' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <ArrowDownLeft size={17} color={rep.direction === 'borrowed' ? 'var(--accent-indigo)' : 'var(--accent-emerald)'} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.925rem' }}>{rep.person_name || 'Contact'}</strong>
                        <span className="badge" style={{
                          fontSize: '0.62rem',
                          background: rep.direction === 'borrowed' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: rep.direction === 'borrowed' ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
                          borderColor: rep.direction === 'borrowed' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                        }}>
                          {rep.direction === 'borrowed' ? '📥 Debt Paid' : '🤝 Recovered'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-indigo)' }}>
                          #{rep.loan_reference}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
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
                      {isMasked ? '••••••' : `+${currSymbol}${Number(rep.amount).toLocaleString()}`} <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{targetCurrency}</span>
                    </div>
                    <span className="badge badge-settled" style={{ fontSize: '0.65rem', marginTop: '0.2rem' }}>
                      Settled
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Loans List (Lent, Borrowed, Outstanding, Overdue) */
            filteredLoans.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {(type === 'overdue' || type === 'borrowed_overdue') ? `No items in ${targetCurrency} are currently overdue!` : `No records found in ${targetCurrency}.`}
              </div>
            ) : (
              filteredLoans.map((loan) => {
                const loanOutstanding = Number(loan.balance?.outstanding ?? loan.principal_amount ?? 0);
                const isPaid = loan.status === 'PAID' || loanOutstanding === 0;
                const isOverdue = (loan.days_overdue > 0 || loan.time_status === 'OVERDUE') && !isPaid;
                const isBorrowing = loan.direction === 'borrowed';
                const loanSymbol = currSymbol;

                return (
                  <div
                    key={loan.id}
                    style={{
                      background: 'var(--inner-card-bg)',
                      border: `1px solid ${isOverdue ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.95rem 1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.85rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
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
                          title="Click to view contact dossier"
                        >
                          {loan.person_name}
                        </span>

                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)' }}>
                          #{loan.loan_reference}
                        </span>

                        <span
                          className="badge"
                          style={{
                            fontSize: '0.62rem',
                            background: isBorrowing ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
                            borderColor: isBorrowing ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          {isBorrowing ? '📥 Borrowed' : '🤝 Lent'}
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
                          {isPaid ? 'SETTLED' : isOverdue ? `OVERDUE (${loan.days_overdue}d)` : loan.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.74rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>{isBorrowing ? 'Borrowed:' : 'Lent:'} <strong>{loan.date_given}</strong></span>
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
                          {isMasked ? `${loanSymbol}••••••` : `${loanSymbol}${loanOutstanding.toLocaleString()}`} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>{targetCurrency}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Principal: {isMasked ? `${loanSymbol}••••••` : `${loanSymbol}${Number(loan.principal_amount || 0).toLocaleString()}`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {!isPaid && onRecordPayment && (
                          <button
                            className="btn btn-primary"
                            style={{
                              padding: '0.35rem 0.7rem',
                              fontSize: '0.75rem',
                              gap: '0.3rem',
                              background: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)',
                              borderColor: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)'
                            }}
                            onClick={() => {
                              onClose();
                              onRecordPayment(loan);
                            }}
                            title={isBorrowing ? "Record repayment to lender" : "Record repayment from borrower"}
                          >
                            <ArrowDownLeft size={13} />
                            <span>{isBorrowing ? 'Pay' : 'Collect'}</span>
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
          padding: '0.9rem 1.75rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Showing records scoped exclusively to <strong>{targetCurrency}</strong>
          </span>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontSize: '0.825rem', padding: '0.45rem 1.25rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
