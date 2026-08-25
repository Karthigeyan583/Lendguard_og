import React from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Tag,
  Calendar,
  DollarSign,
  TrendingUp,
  Plus,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CreditCard,
  ChevronRight,
  Layers
} from 'lucide-react';
import { getCurrencySymbol, formatMoney, convertCurrency, getDefaultCurrency } from '../utils/currency';

export const PersonDetailsModal = ({
  isOpen,
  onClose,
  person,
  loans = [],
  onOpenNewLoanForPerson,
  onRecordPaymentForLoan,
  onGenerateStatementForLoan
}) => {
  if (!isOpen || !person) return null;

  // Active reporting currency
  const reportingCurrency = person.reporting_currency || (loans.length > 0 && loans[0].reporting_currency) || getDefaultCurrency();
  const reportingSymbol = getCurrencySymbol(reportingCurrency);

  // Filter loans belonging to this person
  const personLoans = loans.filter((l) => {
    if (l.person === person.id) return true;
    if (typeof l.person === 'object' && l.person?.id === person.id) return true;
    if (l.person_name && person.name && l.person_name.toLowerCase() === person.name.toLowerCase()) return true;
    return false;
  });

  // Calculate normalized reporting currency aggregations (never direct sum of different currencies)
  const totalLent = person.total_lent !== undefined
    ? Number(person.total_lent)
    : personLoans.reduce((acc, l) => l.status !== 'CANCELLED' ? acc + convertCurrency(l.principal_amount, l.currency, reportingCurrency, l.exchange_rate) : acc, 0);

  const totalRepaid = person.total_repaid !== undefined
    ? Number(person.total_repaid)
    : personLoans.reduce((acc, l) => acc + convertCurrency(l.balance?.total_repaid || 0, l.currency, reportingCurrency, l.exchange_rate), 0);

  const outstanding = person.outstanding_balance !== undefined
    ? Number(person.outstanding_balance)
    : personLoans.reduce((acc, l) => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID') ? acc + convertCurrency(l.balance?.outstanding || 0, l.currency, reportingCurrency, l.exchange_rate) : acc, 0);

  const recoveryRate = totalLent > 0 ? Math.min(100, Math.round((totalRepaid / totalLent) * 100)) : 100;
  const activeLoans = personLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID');
  const overdueLoans = activeLoans.filter(l => l.days_overdue > 0 || l.time_status === 'OVERDUE');

  // Calculate unmixed totals per currency directly from transaction records
  const personTotalsByCurrency = {};
  distinctCurrencies.forEach((curr) => {
    const currLoans = personLoans.filter(l => (l.currency || 'INR') === curr && l.status !== 'CANCELLED');
    const currOverdue = currLoans.filter(l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) && l.status !== 'PAID');
    const lent = currLoans.reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
    const repaid = currLoans.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
    const out = currLoans.reduce((acc, l) => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID') ? acc + Number(l.balance?.outstanding || 0) : acc, 0);
    const overdue = currOverdue.reduce((acc, l) => acc + Number(l.balance?.outstanding || 0), 0);
    const rec = lent > 0 ? Number(((repaid / lent) * 100).toFixed(1)) : 0;
    personTotalsByCurrency[curr] = {
      lent,
      repaid,
      outstanding: out,
      overdue,
      recovery: rec,
      loansCount: currLoans.length,
      overdueCount: currOverdue.length
    };
  });

  const singleBorrowerCurr = distinctCurrencies[0] || 'INR';
  const singleBorrowerStats = personTotalsByCurrency[singleBorrowerCurr] || { lent: 0, repaid: 0, outstanding: 0, overdue: 0, recovery: 0 };
  const hasMultipleCurrencies = distinctCurrencies.length > 1;

  // Collect all repayments across this person's loans
  const allRepayments = [];
  personLoans.forEach(loan => {
    if (Array.isArray(loan.repayments)) {
      loan.repayments.forEach(rep => {
        allRepayments.push({
          ...rep,
          loan_reference: loan.loan_reference,
          currency: loan.currency || 'INR'
        });
      });
    }
  });
  allRepayments.sort((a, b) => new Date(b.payment_date || b.created_at) - new Date(a.payment_date || a.created_at));

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
          maxWidth: 760,
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
        {/* 1. Modal Header */}
        <div style={{
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              flexShrink: 0
            }}>
              {person.name ? person.name.charAt(0).toUpperCase() : 'B'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  {person.name}
                </h2>
                <span className="badge-role" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                  {person.relationship || 'Contact'}
                </span>
                {person.tags && (
                  <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                    <Tag size={11} style={{ marginRight: 3 }} />
                    {person.tags}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                {person.mobile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Phone size={13} color="var(--accent-emerald)" />
                    <span>{person.mobile}</span>
                  </div>
                )}
                {person.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Mail size={13} color="var(--accent-cyan)" />
                    <span>{person.email}</span>
                  </div>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ID: #{person.id}
                </span>
              </div>
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

          {/* Financial Exposure KPI Bar (Split by actual loan currencies) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.85rem'
          }}>
            {/* Total Lent */}
            <div style={{
              background: 'var(--inner-card-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Lent
              </span>

              {hasMultipleCurrencies ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.35rem' }}>
                  {distinctCurrencies.map(curr => (
                    <div key={curr} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                        {getCurrencySymbol(curr)}{Number(personTotalsByCurrency[curr].lent).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{curr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {getCurrencySymbol(singleBorrowerCurr)}{Number(singleBorrowerStats.lent).toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{singleBorrowerCurr}</span>
                </div>
              )}

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Across {personLoans.length} total {personLoans.length === 1 ? 'loan' : 'loans'}
              </div>
            </div>

            {/* Total Repaid */}
            <div style={{
              background: 'var(--inner-card-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Repaid
              </span>

              {hasMultipleCurrencies ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.35rem' }}>
                  {distinctCurrencies.map(curr => (
                    <div key={curr} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                        {getCurrencySymbol(curr)}{Number(personTotalsByCurrency[curr].repaid).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {curr} ({personTotalsByCurrency[curr].recovery}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
                  {getCurrencySymbol(singleBorrowerCurr)}{Number(singleBorrowerStats.repaid).toLocaleString()} <span style={{ fontSize: '0.75rem' }}>{singleBorrowerCurr}</span>
                </div>
              )}

              <div style={{ fontSize: '0.7rem', color: 'var(--accent-emerald)', marginTop: '0.3rem' }}>
                {hasMultipleCurrencies ? 'Recovery % shown per currency' : `${singleBorrowerStats.recovery}% recovered`}
              </div>
            </div>

            {/* Outstanding */}
            <div style={{
              background: 'var(--inner-card-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Outstanding
              </span>

              {hasMultipleCurrencies ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.35rem' }}>
                  {distinctCurrencies.map(curr => (
                    <div key={curr} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                        {getCurrencySymbol(curr)}{Number(personTotalsByCurrency[curr].outstanding).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{curr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: singleBorrowerStats.outstanding > 0 ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
                  marginTop: '0.25rem'
                }}>
                  {getCurrencySymbol(singleBorrowerCurr)}{Number(singleBorrowerStats.outstanding).toLocaleString()} <span style={{ fontSize: '0.75rem' }}>{singleBorrowerCurr}</span>
                </div>
              )}

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                {activeLoans.length} active {activeLoans.length === 1 ? 'record' : 'records'}
              </div>
            </div>

            {/* Status */}
            <div style={{
              background: 'var(--inner-card-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Status
              </span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.35rem' }}>
                {overdueLoans.length > 0 ? (
                  <div>
                    <span style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertTriangle size={15} />
                      {overdueLoans.length} Overdue
                    </span>
                    {distinctCurrencies.filter(c => personTotalsByCurrency[c].overdue > 0).map(curr => (
                      <span key={curr} style={{ fontSize: '0.72rem', color: 'var(--accent-rose)', display: 'block', marginTop: '0.15rem' }}>
                        {getCurrencySymbol(curr)}{Number(personTotalsByCurrency[curr].overdue).toLocaleString()} ({curr})
                      </span>
                    ))}
                  </div>
                ) : outstanding === 0 ? (
                  <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={15} />
                    Settled
                  </span>
                ) : (
                  <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={15} />
                    Up to date
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {person.is_archived ? 'Archived Contact' : 'Active Borrower'}
              </div>
            </div>
          </div>

          {/* Multi-Currency Portfolio Breakdown Strip (if distinct currencies exist) */}
          {isMultiCurrency && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.65rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Layers size={16} color="var(--accent-indigo)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                  Multi-Currency Portfolio Breakdown
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {distinctCurrencies.map((curr) => {
                  const currLoans = personLoans.filter(l => (l.currency || 'INR') === curr);
                  const currLent = currLoans.reduce((acc, l) => l.status !== 'CANCELLED' ? acc + Number(l.principal_amount || 0) : acc, 0);
                  const currOut = currLoans.reduce((acc, l) => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID') ? acc + Number(l.balance?.outstanding || 0) : acc, 0);
                  return (
                    <span
                      key={curr}
                      className="badge"
                      style={{
                        fontSize: '0.72rem',
                        background: 'var(--inner-card-bg)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-subtle)',
                        padding: '0.25rem 0.6rem'
                      }}
                    >
                      {getCurrencySymbol(curr)}{currLent.toLocaleString()} {curr} ({getCurrencySymbol(curr)}{currOut.toLocaleString()} owed)
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recovery Progress Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>PORTFOLIO RECOVERY RATE</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{recoveryRate}%</strong>
            </div>
            <div style={{
              height: 7,
              background: 'var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${recoveryRate}%`,
                background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Notes Section (if present) */}
          {person.notes && (
            <div style={{
              background: 'var(--inner-card-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem 1rem',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>Contact Notes:</strong>
              {person.notes}
            </div>
          )}

          {/* 3. Lending Records Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                Lending Records ({personLoans.length})
              </h3>
              <button
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem' }}
                onClick={() => {
                  onClose();
                  if (onOpenNewLoanForPerson) onOpenNewLoanForPerson(person);
                }}
              >
                <Plus size={14} />
                <span>Lend Money</span>
              </button>
            </div>

            {personLoans.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                background: 'var(--inner-card-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.825rem'
              }}>
                No loan records found for {person.name}. Click "Lend Money" above to record a loan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {personLoans.map((loan) => {
                  const loanOutstanding = Number(loan.balance?.outstanding ?? loan.principal_amount ?? 0);
                  const isPaid = loan.status === 'PAID' || loanOutstanding === 0;
                  const isOverdue = (loan.days_overdue > 0 || loan.time_status === 'OVERDUE') && !isPaid;

                  return (
                    <div
                      key={loan.id}
                      style={{
                        background: 'var(--inner-card-bg)',
                        border: `1px solid ${isOverdue ? 'rgba(244, 63, 94, 0.35)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.9rem 1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-indigo)' }}>
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
                          <span>Given: {loan.date_given}</span>
                          {loan.due_date && (
                            <span style={{ color: isOverdue ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                              Due: {loan.due_date}
                            </span>
                          )}
                          {loan.purpose && <span>• {loan.purpose}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isPaid ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
                            {getCurrencySymbol(loan.currency)}{Number(loan.principal_amount || 0).toLocaleString()} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{loan.currency || 'INR'}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {isPaid ? 'Fully settled' : `${getCurrencySymbol(loan.currency)}${loanOutstanding.toLocaleString()} remaining`}
                            {(!isPaid && (loan.currency || 'INR') !== reportingCurrency) && (
                              <span style={{ color: 'var(--accent-indigo)', marginLeft: 4 }}>
                                (≈ {reportingSymbol}{convertCurrency(loanOutstanding, loan.currency, reportingCurrency, loan.exchange_rate).toLocaleString()})
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {!isPaid && onRecordPaymentForLoan && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem', color: 'var(--accent-emerald)' }}
                              onClick={() => {
                                onClose();
                                onRecordPaymentForLoan(loan);
                              }}
                              title="Record repayment for this loan"
                            >
                              <ArrowDownLeft size={13} />
                              <span>Repay</span>
                            </button>
                          )}

                          {onGenerateStatementForLoan && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                              onClick={() => {
                                onClose();
                                onGenerateStatementForLoan(loan);
                              }}
                              title="Generate Digital Statement & IOU"
                            >
                              <FileText size={13} />
                              <span>Statement</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Repayment Ledger History (if repayments exist) */}
          {allRepayments.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Repayment History ({allRepayments.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {allRepayments.slice(0, 5).map((rep, idx) => (
                  <div
                    key={rep.id || idx}
                    style={{
                      background: 'var(--inner-card-bg)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.65rem 0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ArrowDownLeft size={14} color="var(--accent-emerald)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          Repayment on #{rep.loan_reference}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {rep.payment_date || rep.created_at} • {rep.payment_method || 'UPI/Transfer'}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>
                      +{getCurrencySymbol(rep.currency)}{Number(rep.amount || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            LendGuard Canonical Borrower Dossier
          </span>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              style={{ fontSize: '0.825rem', padding: '0.5rem 1rem' }}
            >
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                if (onOpenNewLoanForPerson) onOpenNewLoanForPerson(person);
              }}
              style={{ fontSize: '0.825rem', padding: '0.5rem 1.1rem', gap: '0.4rem' }}
            >
              <Plus size={15} />
              <span>Lend Money to {person.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
