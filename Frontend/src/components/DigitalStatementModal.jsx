import React, { useState } from 'react';
import { X, ShieldCheck, Printer, Copy, Check, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { getCurrencySymbol, formatMoney } from '../utils/currency';

export const DigitalStatementModal = ({ isOpen, onClose, statement, loan }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const data = statement?.canonical_data_snapshot;
  const hash = statement?.sha256_hash || 'SHA-256 Hash Generating...';
  const currencyCode = data?.financial_summary?.currency || data?.loan_details?.currency || loan?.currency || 'INR';
  const currencySymbol = getCurrencySymbol(currencyCode);

  const handleCopyHash = () => {
    if (statement?.sha256_hash) {
      navigator.clipboard.writeText(statement.sha256_hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 680, background: 'var(--bg-card)' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={22} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Digital IOU & Loan Statement</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={handlePrint} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Statement Document */}
        <div style={{ padding: '1.75rem' }} id="printable-statement">
          {/* Document Title Strip */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '1.25rem',
            borderBottom: '2px solid var(--border-subtle)',
            marginBottom: '1.25rem'
          }}>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                LENDGUARD
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Official Personal Lending Ledger & IOU Record
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {statement?.statement_number || `STMT-${loan?.loan_reference}-01`}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Generated: {statement?.generated_at ? new Date(statement.generated_at).toLocaleString() : new Date().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Integrity Seal */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Lock size={16} color="var(--accent-emerald)" />
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cryptographic SHA-256 Integrity Seal
                </span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                  {hash}
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyHash}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem' }}
              title="Copy cryptographic hash"
            >
              {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Parties: Lender & Borrower */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            background: 'var(--inner-card-bg)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                LENDER (CREDITOR)
              </span>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem' }}>
                {data?.lender?.full_name || 'Lender'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {data?.lender?.email || ''}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                BORROWER (DEBTOR)
              </span>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.2rem' }}>
                {data?.borrower?.name || loan?.person_name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {data?.borrower?.mobile || loan?.person_mobile || 'No mobile specified'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-indigo)', textTransform: 'capitalize' }}>
                Relationship: {data?.borrower?.relationship || loan?.person_relationship || 'Contact'}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Principal Lent</span>
              <strong style={{ fontSize: '0.95rem' }}>
                {currencySymbol}{Number(data?.financial_summary?.principal || loan?.principal_amount || 0).toLocaleString()}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Date Given</span>
              <strong style={{ fontSize: '0.85rem' }}>{data?.loan_details?.date_given || loan?.date_given}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Total Repaid</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--accent-emerald)' }}>
                {currencySymbol}{Number(data?.financial_summary?.total_repaid || loan?.balance?.total_repaid || 0).toLocaleString()}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Balance Due</span>
              <strong style={{ fontSize: '1rem', color: 'var(--accent-cyan)' }}>
                {currencySymbol}{Number(data?.financial_summary?.outstanding_balance || loan?.balance?.outstanding || 0).toLocaleString()}
              </strong>
            </div>
          </div>

          {/* Repayment History Ledger */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-secondary)' }}>
              REPAYMENT TRANSACTION LEDGER ({currencyCode})
            </h4>
            {(!data?.repayment_ledger || data.repayment_ledger.length === 0) ? (
              <div style={{ padding: '1rem', background: 'var(--inner-card-bg)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                No repayments recorded yet for this lending record.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>Date</th>
                    <th style={{ padding: '0.5rem' }}>Amount</th>
                    <th style={{ padding: '0.5rem' }}>Method</th>
                    <th style={{ padding: '0.5rem' }}>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {data.repayment_ledger.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.5rem' }}>{p.payment_date}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        {currencySymbol}{Number(p.amount).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>
                        {p.payment_method?.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {p.reference_number || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Legal Notice Footer */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            This document represents a digital ledger statement generated by LendGuard. The cryptographic hash seal verifies that the above financial ledger matches the canonical transaction record.
          </div>
        </div>
      </div>
    </div>
  );
};
