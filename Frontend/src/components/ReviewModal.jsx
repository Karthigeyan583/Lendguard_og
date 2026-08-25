import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ShieldAlert, FileText, AlertTriangle } from 'lucide-react';

export const ReviewModal = ({ isOpen, onClose, loan, onReviewSubmit }) => {
  const [decision, setDecision] = useState('approved');
  const [riskScore, setRiskScore] = useState(loan?.risk_score || '14.5');
  const [reviewNotes, setReviewNotes] = useState(loan?.review_notes || 'Credit history verified, debt-to-income ratio within acceptable tier.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !loan) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onReviewSubmit(loan.id, {
        status: decision,
        risk_score: parseFloat(riskScore),
        review_notes: reviewNotes
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Underwrite & Review Loan #{loan.id}</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Applicant: {loan.applicant_username} • ${Number(loan.amount).toLocaleString()} {loan.currency}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              marginBottom: '1.25rem'
            }}>
              {error}
            </div>
          )}

          {/* Quick Summary Strip */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            fontSize: '0.8rem'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>FICO Score</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>{loan.credit_score || '720'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Annual Income</span>
              <strong>${Number(loan.annual_income || 0).toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Monthly Payment</span>
              <strong>${loan.estimated_monthly_payment ? loan.estimated_monthly_payment.toLocaleString() : 'N/A'}</strong>
            </div>
          </div>

          {/* Decision Selector */}
          <div className="form-group">
            <label className="form-label">Underwriting Decision</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDecision('approved')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: decision === 'approved' ? '2px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                  background: decision === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                  color: decision === 'approved' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <CheckCircle size={16} />
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('under_review')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: decision === 'under_review' ? '2px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                  background: decision === 'under_review' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface)',
                  color: decision === 'under_review' ? 'var(--accent-amber)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <AlertTriangle size={16} />
                <span>Hold / Review</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('rejected')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: decision === 'rejected' ? '2px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                  background: decision === 'rejected' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-surface)',
                  color: decision === 'rejected' ? 'var(--accent-rose)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <XCircle size={16} />
                <span>Reject</span>
              </button>
            </div>
          </div>

          {/* Risk Score */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Assigned Risk Score (0 - 100, Lower is safer)</label>
              <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{riskScore} / 100</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="0.5"
              value={riskScore}
              onChange={(e) => setRiskScore(e.target.value)}
            />
          </div>

          {/* Review Notes */}
          <div className="form-group">
            <label className="form-label">Underwriter Assessment & Audit Notes</label>
            <textarea
              rows={4}
              required
              className="form-textarea"
              placeholder="State rationale for credit decision, required collateral, or conditions..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting Decision...' : 'Commit Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
