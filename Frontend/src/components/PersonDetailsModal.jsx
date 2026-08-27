import React, { useState } from 'react';
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
  Layers,
  Building,
  Copy,
  Check
} from 'lucide-react';
import { getCurrencySymbol, formatMoney, convertCurrency, getDefaultCurrency } from '../utils/currency';
import { COUNTRY_BANK_MANDATES } from '../utils/bankValidation';

export const PersonDetailsModal = ({
  isOpen,
  onClose,
  person,
  loans = [],
  onOpenNewLoanForPerson,
  onRecordPaymentForLoan,
  onGenerateStatementForLoan,
  isMasked = false
}) => {
  const [personTabFilter, setPersonTabFilter] = React.useState('all');
  const [copiedBankId, setCopiedBankId] = React.useState(null);

  const handleCopyBankDetails = (acc) => {
    const details = [
      `Beneficiary: ${acc.account_holder_name}`,
      `Bank: ${acc.bank_name}`,
      `Account No: ${acc.account_number}`,
      acc.ifsc_code ? `IFSC: ${acc.ifsc_code}` : null,
      acc.upi_id ? `UPI: ${acc.upi_id}` : null,
      acc.sort_code ? `Sort Code: ${acc.sort_code}` : null,
      acc.routing_number ? `Routing: ${acc.routing_number}` : null,
      acc.iban ? `IBAN: ${acc.iban}` : null,
      acc.swift_bic ? `SWIFT/BIC: ${acc.swift_bic}` : null,
      acc.bsb_number ? `BSB: ${acc.bsb_number}` : null,
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(details);
    setCopiedBankId(acc.id || acc.account_number);
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  const getFontSizeForAmount = (valStr) => {
    const len = String(valStr || '').length;
    if (len >= 16) return '0.78rem';
    if (len >= 13) return '0.84rem';
    if (len >= 10) return '0.92rem';
    if (len >= 8) return '1.02rem';
    return '1.15rem';
  };

  if (!isOpen || !person) return null;

  // Filter loans belonging to this person
  const personLoans = loans.filter((l) => {
    if (l.person === person.id) return true;
    if (typeof l.person === 'object' && l.person?.id === person.id) return true;
    if (l.person_name && person.name && l.person_name.toLowerCase() === person.name.toLowerCase()) return true;
    return false;
  });

  // Identify distinct currencies used by this contact
  const distinctCurrencies = Array.from(new Set(personLoans.map(l => l.currency || 'INR')));
  const hasMultipleCurrencies = distinctCurrencies.length > 1;
  const isMultiCurrency = hasMultipleCurrencies;
  const primaryCurrency = distinctCurrencies[0] || (personLoans[0]?.currency) || 'INR';
  const primarySymbol = getCurrencySymbol(primaryCurrency);

  const lentLoans = personLoans.filter(l => l.direction !== 'borrowed' && l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF');
  const borrowedLoans = personLoans.filter(l => l.direction === 'borrowed' && l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF');

  // Exact unmixed native amounts
  const lentOutstanding = lentLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID').reduce((acc, l) => acc + Number(l.balance?.outstanding ?? l.principal_amount ?? 0), 0);
  const borrowedOutstanding = borrowedLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID').reduce((acc, l) => acc + Number(l.balance?.outstanding ?? l.principal_amount ?? 0), 0);
  const netExposure = lentOutstanding - borrowedOutstanding;

  const totalLent = lentLoans.reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
  const totalRepaid = personLoans.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
  const outstanding = lentOutstanding;
  const recoveryRate = totalLent > 0 ? Math.min(100, Math.round((totalRepaid / totalLent) * 100)) : 100;
  const activeLoans = personLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID');
  const overdueLoans = activeLoans.filter(l => l.days_overdue > 0 || l.time_status === 'OVERDUE');

  // Calculate unmixed totals per currency directly from transaction records
  const personTotalsByCurrency = {};
  distinctCurrencies.forEach((curr) => {
    const currLoans = personLoans.filter(l => (l.currency || 'INR') === curr && l.status !== 'CANCELLED' && l.status !== 'WRITTEN_OFF');
    const currOverdue = currLoans.filter(l => (l.time_status === 'OVERDUE' || l.days_overdue > 0) && l.status !== 'PAID');
    const lent = currLoans.filter(l => l.direction !== 'borrowed').reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
    const repaid = currLoans.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
    const out = currLoans.filter(l => l.direction !== 'borrowed').reduce((acc, l) => (l.status === 'OPEN' || l.status === 'PARTIALLY_PAID') ? acc + Number(l.balance?.outstanding ?? l.principal_amount ?? 0) : acc, 0);
    const overdue = currOverdue.reduce((acc, l) => acc + Number(l.balance?.outstanding ?? l.principal_amount ?? 0), 0);
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

  const singleBorrowerCurr = primaryCurrency;
  const singleBorrowerStats = personTotalsByCurrency[singleBorrowerCurr] || {
    lent: totalLent,
    repaid: totalRepaid,
    outstanding: lentOutstanding,
    overdue: overdueLoans.reduce((acc, l) => acc + Number(l.balance?.outstanding || 0), 0),
    recovery: recoveryRate
  };

  // Filtered loans list based on selected tab
  const displayedLoans = personLoans.filter(l => {
    if (personTabFilter === 'lent') return l.direction !== 'borrowed';
    if (personTabFilter === 'borrowed') return l.direction === 'borrowed';
    return true;
  });

  // Extract all repayments for this person
  const allRepayments = [];
  personLoans.forEach((l) => {
    const reps = l.repayments || l.recent_payments || [];
    if (Array.isArray(reps)) {
      reps.forEach((r) => {
        allRepayments.push({
          ...r,
          loan_reference: l.loan_reference,
          currency: r.currency || l.currency || primaryCurrency,
          direction: l.direction
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  {person.name}
                </h2>
                <span className="badge-role" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', textTransform: 'capitalize' }}>
                  {person.relationship || 'Contact'}
                </span>
                {person.is_archived && (
                  <span className="badge badge-draft" style={{ fontSize: '0.65rem' }}>Archived</span>
                )}
              </div>

              {/* Contact meta pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {person.mobile && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Phone size={12} />
                    {person.mobile}
                  </span>
                )}
                {person.email && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Mail size={12} />
                    {person.email}
                  </span>
                )}
                {person.tags && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-indigo)' }}>
                    <Tag size={12} />
                    {person.tags}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.45rem', borderRadius: '50%', border: 'none' }}
            title="Close dossier"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* NET POSITION HERO CARD */}
          <div style={{
            background: 'var(--inner-card-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Net Position with {person.name}
              </span>
              {hasMultipleCurrencies ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}>
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {distinctCurrencies.map(curr => {
                      const s = personTotalsByCurrency[curr];
                      const sym = getCurrencySymbol(curr);
                      const net = s.outstanding;
                      return (
                        <div key={curr} style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.35rem 0.7rem',
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '0.35rem'
                        }}>
                          <span style={{
                            fontSize: '1.25rem',
                            fontWeight: 900,
                            color: net > 0 ? 'var(--accent-emerald)' : 'var(--text-primary)'
                          }}>
                            {isMasked ? `${sym}••••••` : `${net >= 0 ? '+' : ''}${sym}${Number(net).toLocaleString()}`}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>{curr}</span>
                        </div>
                      );
                    })}
                    <span className="badge" style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--accent-emerald)',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {person.name} Owes You (Multi-Currency)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    {distinctCurrencies.map(curr => {
                      const s = personTotalsByCurrency[curr];
                      const sym = getCurrencySymbol(curr);
                      return `${curr}: Receivables ${sym}${Number(s.outstanding).toLocaleString()} • Payables ${sym}0`;
                    }).join(' | ')}
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.2rem' }}>
                    <span style={{
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      color: netExposure > 0 ? 'var(--accent-emerald)' : netExposure < 0 ? 'var(--accent-rose)' : 'var(--text-primary)'
                    }}>
                      {isMasked ? `${primarySymbol}••••••` : `${netExposure >= 0 ? '+' : ''}${primarySymbol}${Number(netExposure).toLocaleString()}`} <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{primaryCurrency}</span>
                    </span>
                    <span className="badge" style={{
                      background: netExposure > 0 ? 'rgba(16, 185, 129, 0.15)' : netExposure < 0 ? 'rgba(244, 63, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                      color: netExposure > 0 ? 'var(--accent-emerald)' : netExposure < 0 ? 'var(--accent-rose)' : 'var(--text-muted)',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {netExposure > 0 ? `${person.name} Owes You` : netExposure < 0 ? `You Owe ${person.name}` : 'Settled Net Position'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Receivables: <strong>{primarySymbol}{isMasked ? '••••••' : Number(lentOutstanding).toLocaleString()}</strong> • Payables: <strong>{primarySymbol}{isMasked ? '••••••' : Number(borrowedOutstanding).toLocaleString()}</strong>
                  </div>
                </>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
              onClick={() => {
                onClose();
                if (onOpenNewLoanForPerson) onOpenNewLoanForPerson(person);
              }}
            >
              <Plus size={14} />
              <span>New Transaction</span>
            </button>
          </div>

          {/* Financial Exposure KPI Bar */}
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
                        {getCurrencySymbol(curr)}{isMasked ? '••••••' : Number(personTotalsByCurrency[curr].lent).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{curr}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  {getCurrencySymbol(singleBorrowerCurr)}{isMasked ? '••••••' : Number(singleBorrowerStats.lent).toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{singleBorrowerCurr}</span>
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
                        {getCurrencySymbol(curr)}{isMasked ? '••••••' : Number(personTotalsByCurrency[curr].repaid).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {curr} ({personTotalsByCurrency[curr].recovery}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.25rem' }}>
                  {getCurrencySymbol(singleBorrowerCurr)}{isMasked ? '••••••' : Number(singleBorrowerStats.repaid).toLocaleString()} <span style={{ fontSize: '0.75rem' }}>{singleBorrowerCurr}</span>
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
                        {getCurrencySymbol(curr)}{isMasked ? '••••••' : Number(personTotalsByCurrency[curr].outstanding).toLocaleString()}
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
                  {getCurrencySymbol(singleBorrowerCurr)}{isMasked ? '••••••' : Number(singleBorrowerStats.outstanding).toLocaleString()} <span style={{ fontSize: '0.75rem' }}>{singleBorrowerCurr}</span>
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
                      {getCurrencySymbol(curr)}{isMasked ? '••••••' : currLent.toLocaleString()} {curr} ({getCurrencySymbol(curr)}{isMasked ? '••••••' : currOut.toLocaleString()} owed)
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

          {/* Verified Bank Accounts Section */}
          {person.bank_accounts && person.bank_accounts.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Building size={16} color="var(--accent-indigo)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Verified Settlement Bank Accounts ({person.bank_accounts.length})
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {person.bank_accounts.map((acc, idx) => {
                  const mandate = COUNTRY_BANK_MANDATES.find(m => m.code === acc.country) || COUNTRY_BANK_MANDATES[0];
                  const isCopied = copiedBankId === (acc.id || acc.account_number);

                  return (
                    <div
                      key={acc.id || idx}
                      style={{
                        background: 'var(--inner-card-bg)',
                        border: acc.is_primary ? '1.5px solid var(--accent-indigo)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.9rem 1.1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.6rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ fontSize: '1rem' }}>{mandate.flag}</span>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{acc.bank_name}</strong>
                          </div>

                          {acc.is_primary ? (
                            <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                              Primary Account
                            </span>
                          ) : (
                            <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                              Secondary Account
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div>Holder: <strong style={{ color: 'var(--text-primary)' }}>{acc.account_holder_name}</strong></div>
                          <div>
                            A/C: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                              {isMasked ? '••••••••' : acc.account_number}
                            </strong>
                          </div>

                          {acc.ifsc_code && (
                            <div>IFSC: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-indigo)', fontWeight: 700 }}>{acc.ifsc_code}</span></div>
                          )}
                          {acc.upi_id && (
                            <div>UPI: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>{acc.upi_id}</span></div>
                          )}
                          {acc.sort_code && (
                            <div>Sort Code: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{acc.sort_code}</span></div>
                          )}
                          {acc.routing_number && (
                            <div>ABA Routing: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{acc.routing_number}</span></div>
                          )}
                          {acc.iban && (
                            <div>IBAN: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{isMasked ? '••••••••' : acc.iban}</span></div>
                          )}
                          {acc.bsb_number && (
                            <div>BSB: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{acc.bsb_number}</span></div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.45rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', gap: '0.3rem' }}
                          onClick={() => handleCopyBankDetails(acc)}
                        >
                          {isCopied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                          <span>{isCopied ? 'Copied Details' : 'Copy Bank Details'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Transaction Agreements Section with Filter Tabs */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.3rem', background: 'var(--bg-surface)', padding: '0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => setPersonTabFilter('all')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: personTabFilter === 'all' ? 'var(--bg-card)' : 'transparent',
                    color: personTabFilter === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  All ({personLoans.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPersonTabFilter('lent')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: personTabFilter === 'lent' ? 'var(--accent-emerald)' : 'transparent',
                    color: personTabFilter === 'lent' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  🤝 Lent ({lentLoans.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPersonTabFilter('borrowed')}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: personTabFilter === 'borrowed' ? 'var(--accent-indigo)' : 'transparent',
                    color: personTabFilter === 'borrowed' ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  📥 Borrowed ({borrowedLoans.length})
                </button>
              </div>

              <button
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem' }}
                onClick={() => {
                  onClose();
                  if (onOpenNewLoanForPerson) onOpenNewLoanForPerson(person);
                }}
              >
                <Plus size={14} />
                <span>New Transaction</span>
              </button>
            </div>

            {displayedLoans.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                background: 'var(--inner-card-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.825rem'
              }}>
                No transaction records found matching the filter.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {displayedLoans.map((loan) => {
                  const loanOutstanding = Number(loan.balance?.outstanding ?? loan.principal_amount ?? 0);
                  const isPaid = loan.status === 'PAID' || loanOutstanding === 0;
                  const isOverdue = (loan.days_overdue > 0 || loan.time_status === 'OVERDUE') && !isPaid;
                  const isBorrowing = (loan.direction === 'borrowed');

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)' }}>
                            #{loan.loan_reference}
                          </span>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.65rem',
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span>{isBorrowing ? 'Borrowed:' : 'Given:'} {loan.date_given}</span>
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
                            {getCurrencySymbol(loan.currency)}{isMasked ? '••••••' : Number(loan.principal_amount || 0).toLocaleString()} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{loan.currency || 'INR'}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {isPaid ? 'Fully settled' : `${getCurrencySymbol(loan.currency)}${isMasked ? '••••••' : loanOutstanding.toLocaleString()} ${isBorrowing ? 'payable' : 'receivable'}`}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {!isPaid && onRecordPaymentForLoan && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem', color: isBorrowing ? 'var(--accent-indigo)' : 'var(--accent-emerald)' }}
                              onClick={() => {
                                onClose();
                                onRecordPaymentForLoan(loan);
                              }}
                              title={isBorrowing ? "Record repayment made to lender" : "Record repayment received from borrower"}
                            >
                              <ArrowDownLeft size={13} />
                              <span>{isBorrowing ? 'Pay' : 'Repay'}</span>
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
                              title="Generate Official Digital Statement"
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
              <span>Lend Money to {(person.name || 'Contact').split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
