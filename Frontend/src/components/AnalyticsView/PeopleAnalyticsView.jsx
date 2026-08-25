import React, { useState } from 'react';
import { Users, Scale, ArrowUpRight, ArrowDownLeft, ChevronRight, Search } from 'lucide-react';
import { getCurrencySymbol, maskValue } from '../../utils/currency';

export const PeopleAnalyticsView = ({
  people = [],
  loans = [],
  reportingCurrency = 'INR',
  isMasked = false,
  onOpenPersonDetails
}) => {
  const [search, setSearch] = useState('');
  const [topCount, setTopCount] = useState(10);
  const symbol = getCurrencySymbol(reportingCurrency);

  // Compute calculated metrics per person
  const peopleProfiles = people.map(p => {
    const pLoans = loans.filter(l => {
      if (l.person === p.id) return true;
      if (typeof l.person === 'object' && l.person?.id === p.id) return true;
      if (l.person_name && p.name && l.person_name.toLowerCase() === p.name.toLowerCase()) return true;
      return false;
    });

    const lentLoans = pLoans.filter(l => l.direction !== 'borrowed');
    const borrowedLoans = pLoans.filter(l => l.direction === 'borrowed');

    const totalLent = lentLoans.reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
    const lentRepaid = lentLoans.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
    const lentOut = lentLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID').reduce((acc, l) => acc + Number(l.balance?.outstanding || l.principal_amount || 0), 0);

    const totalBorrowed = borrowedLoans.reduce((acc, l) => acc + Number(l.principal_amount || 0), 0);
    const borrowedRepaid = borrowedLoans.reduce((acc, l) => acc + Number(l.balance?.total_repaid || 0), 0);
    const borrowedOut = borrowedLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID').reduce((acc, l) => acc + Number(l.balance?.outstanding || l.principal_amount || 0), 0);

    const netExposure = lentOut - borrowedOut;

    return {
      ...p,
      totalLent,
      lentRepaid,
      lentOut,
      totalBorrowed,
      borrowedRepaid,
      borrowedOut,
      netExposure,
      activeAgreements: pLoans.filter(l => l.status === 'OPEN' || l.status === 'PARTIALLY_PAID').length
    };
  });

  const filtered = peopleProfiles
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.relationship && p.relationship.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => Math.abs(b.netExposure) - Math.abs(a.netExposure))
    .slice(0, topCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Search & Top Controls */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Counterparty Exposure & Relationship Analytics</h4>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Net balance and exposure per contact (Receivables minus Payables)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search counterparties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '1.8rem', fontSize: '0.78rem', width: 180 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Show Top:</span>
            {[5, 10, 20, 50].map(cnt => (
              <button
                key={cnt}
                type="button"
                onClick={() => setTopCount(cnt)}
                style={{
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: topCount === cnt ? 'var(--accent-emerald)' : 'var(--inner-card-bg)',
                  color: topCount === cnt ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Counterparties Table */}
      <div className="glass-panel" style={{ padding: '1.4rem 1.6rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--inner-card-bg)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Counterparty</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Relationship</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Lent to Them</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Borrowed from Them</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>Net Exposure</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Active Files</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No matching counterparties found.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const isOwed = p.netExposure > 0;
                  const isDebt = p.netExposure < 0;

                  return (
                    <tr key={p.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>
                        <span style={{ color: 'var(--text-muted)', marginRight: '0.35rem' }}>#{idx + 1}</span>
                        {p.name}
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                        {p.relationship || 'Contact'}
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', color: 'var(--accent-emerald)' }}>
                        {isMasked ? maskValue(p.lentOut) : `${symbol}${Number(p.lentOut).toLocaleString()}`}
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', color: 'var(--accent-rose)' }}>
                        {isMasked ? maskValue(p.borrowedOut) : `${symbol}${Number(p.borrowedOut).toLocaleString()}`}
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right', fontWeight: 800 }}>
                        <span style={{
                          color: isOwed ? 'var(--accent-emerald)' : isDebt ? 'var(--accent-rose)' : 'var(--text-muted)',
                          background: isOwed ? 'rgba(16,185,129,0.1)' : isDebt ? 'rgba(244,63,94,0.1)' : 'transparent',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 'var(--radius-xs)'
                        }}>
                          {isMasked ? '••••••' : `${isOwed ? '+' : ''}${symbol}${Number(p.netExposure).toLocaleString()}`}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center', fontWeight: 600 }}>
                        {p.activeAgreements}
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'center' }}>
                        {onOpenPersonDetails && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => onOpenPersonDetails(p)}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                          >
                            Open Dossier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
