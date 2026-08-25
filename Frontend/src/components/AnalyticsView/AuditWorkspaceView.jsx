import React, { useState } from 'react';
import { Shield, Clock, User, Download, FileText, CheckCircle2, Search } from 'lucide-react';

export const AuditWorkspaceView = ({ auditData }) => {
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const events = auditData?.events || [];

  const filteredEvents = events.filter(e => {
    if (moduleFilter !== 'ALL' && e.module !== moduleFilter) return false;
    if (search && !e.target_reference?.toLowerCase().includes(search.toLowerCase()) && !e.details?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const modules = ['ALL', 'LOANS', 'BORROWING', 'PAYMENTS', 'STATEMENTS', 'REPORTS', 'SETTINGS'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header & Controls */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="var(--accent-emerald)" />
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Workspace Audit Ledger & Security Activity</h4>
          </div>
          <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Immutable trace of all financial agreements created, modified, statements generated, and data exports
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {modules.map(mod => (
            <button
              key={mod}
              type="button"
              onClick={() => setModuleFilter(mod)}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: moduleFilter === mod ? 'var(--accent-emerald)' : 'var(--inner-card-bg)',
                color: moduleFilter === mod ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel" style={{ padding: '1.4rem 1.6rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--inner-card-bg)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Timestamp</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Operator</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Module</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Action</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Target Ref</th>
                <th style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev, idx) => (
                  <tr key={ev.id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.65rem 0.8rem', color: 'var(--text-muted)', fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : 'Just now'}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600 }}>
                      {ev.username || 'System Admin'}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <span className="badge badge-under_review" style={{ fontSize: '0.68rem' }}>
                        {ev.module}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {ev.action}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600 }}>
                      {ev.target_reference || '-'}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: 'var(--text-secondary)' }}>
                      {ev.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
