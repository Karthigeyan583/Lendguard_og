import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  ChevronRight, 
  UserCheck, 
  ShieldCheck,
  Building,
  Car,
  Home,
  GraduationCap,
  Briefcase
} from 'lucide-react';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Applications' },
  { id: 'draft', label: 'Drafts' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

export const LoanList = ({ loans, loading, onSubmitLoan, onOpenReview, onRefresh }) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);

  const isOfficerOrAdmin = user?.is_staff || user?.profile?.role === 'loan_officer' || user?.profile?.role === 'risk_analyst' || user?.profile?.role === 'admin';

  // Filter and search
  const filteredLoans = loans.filter((loan) => {
    const matchesFilter = activeFilter === 'all' || loan.status === activeFilter;
    const matchesSearch = 
      loan.applicant_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.loan_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(loan.id).includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const getLoanIcon = (type) => {
    switch (type) {
      case 'mortgage': return <Home size={18} color="var(--accent-cyan)" />;
      case 'auto': return <Car size={18} color="var(--accent-amber)" />;
      case 'education': return <GraduationCap size={18} color="var(--accent-indigo)" />;
      case 'business': return <Briefcase size={18} color="var(--accent-emerald)" />;
      default: return <Building size={18} color="var(--accent-blue)" />;
    }
  };

  const getStatusBadge = (status) => {
    const classMap = {
      draft: 'badge-draft',
      submitted: 'badge-submitted',
      under_review: 'badge-under_review',
      approved: 'badge-approved',
      rejected: 'badge-rejected',
      disbursed: 'badge-disbursed',
    };
    return (
      <span className={`badge ${classMap[status] || 'badge-draft'}`}>
        {status?.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      {/* Header & Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Loan Applications Management</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isOfficerOrAdmin 
              ? 'Review, underwriting risk assessment, and decision workflow.' 
              : 'Track and submit your loan application pipeline.'}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: 260 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by ID, applicant, purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              background: activeFilter === f.id ? 'var(--bg-surface)' : 'transparent',
              color: activeFilter === f.id ? 'var(--accent-emerald)' : 'var(--text-secondary)',
              border: activeFilter === f.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loan List / Empty State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          Loading loan applications...
        </div>
      ) : filteredLoans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#0c121d', borderRadius: 'var(--radius-md)' }}>
          <FileCheck size={40} color="var(--text-muted)" style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem' }}>No Loan Applications Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
            No applications match your selected filter. Apply for a new loan or choose a different status filter above.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredLoans.map((loan) => {
            const isSelected = selectedLoan?.id === loan.id;
            return (
              <div
                key={loan.id}
                style={{
                  background: isSelected ? 'var(--bg-card-hover)' : '#0c121d',
                  border: isSelected ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  {/* Left: Type & ID */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: 'var(--bg-surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {getLoanIcon(loan.loan_type)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>
                          ${Number(loan.amount).toLocaleString()} {loan.currency}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          • {loan.loan_type}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem', marginTop: '0.15rem' }}>
                        <span>ID: #{loan.id}</span>
                        <span>Applicant: <strong>{loan.applicant_username || 'Borrower'}</strong></span>
                        <span>Term: {loan.term_months} mo ({loan.interest_rate}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Status Badge */}
                    {getStatusBadge(loan.status)}

                    {/* Submit Action for Borrower on Draft */}
                    {loan.status === 'draft' && (
                      <button
                        className="btn btn-outline-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                        onClick={() => onSubmitLoan(loan.id)}
                      >
                        <Send size={14} />
                        <span>Submit</span>
                      </button>
                    )}

                    {/* Review Action for Officer / Admin */}
                    {isOfficerOrAdmin && (loan.status === 'submitted' || loan.status === 'under_review') && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                        onClick={() => onOpenReview(loan)}
                      >
                        <ShieldCheck size={14} />
                        <span>Underwrite / Review</span>
                      </button>
                    )}

                    {/* Expand Details Button */}
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.6rem' }}
                      onClick={() => setSelectedLoan(isSelected ? null : loan)}
                    >
                      <ChevronRight
                        size={16}
                        style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isSelected && (
                  <div style={{
                    marginTop: '1.25rem',
                    paddingTop: '1.25rem',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    fontSize: '0.825rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Purpose</span>
                      <p style={{ fontWeight: 500 }}>{loan.purpose || 'No stated purpose'}</p>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Estimated Payment</span>
                      <p style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                        ${loan.estimated_monthly_payment ? loan.estimated_monthly_payment.toLocaleString() : 'N/A'} / mo
                      </p>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Annual Income & Employment</span>
                      <p style={{ fontWeight: 500 }}>
                        ${Number(loan.annual_income || 0).toLocaleString()} ({loan.employment_status?.replace('_', ' ')})
                      </p>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>FICO Credit Score</span>
                      <p style={{ fontWeight: 600, color: loan.credit_score >= 700 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                        {loan.credit_score || 'Not reported'}
                      </p>
                    </div>

                    {loan.risk_score && (
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Assessed Risk Score</span>
                        <p style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          {loan.risk_score} / 100
                        </p>
                      </div>
                    )}

                    {loan.review_notes && (
                      <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                          Underwriter Notes (Reviewed by {loan.reviewed_by_username || 'Officer'}):
                        </span>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{loan.review_notes}</p>
                      </div>
                    )}
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
