import React, { useState } from 'react';
import { Users, Search, Plus, Phone, Mail, Tag, ArrowUpRight, Archive, CheckCircle2 } from 'lucide-react';
import { getDefaultCurrency, getCurrencySymbol } from '../utils/currency';

export const PeopleView = ({ people = [], onOpenAddPerson, onLendToPerson, onArchivePerson, onOpenPersonDetails }) => {
  const [search, setSearch] = useState('');
  const [filterRel, setFilterRel] = useState('all');
  const defSymbol = getCurrencySymbol(getDefaultCurrency());

  const filtered = people.filter((p) => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.mobile?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.toLowerCase().includes(search.toLowerCase());
    const matchesRel = filterRel === 'all' || p.relationship === filterRel;
    return matchesSearch && matchesRel;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Controls */}
      <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>People & Borrower Directory</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Manage contacts, borrower relationships, and track total financial exposure per person
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: 260 }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by name, mobile, tag..."
                className="form-input"
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="btn btn-primary" onClick={onOpenAddPerson} style={{ fontSize: '0.825rem' }}>
              <Plus size={16} />
              <span>Add Person</span>
            </button>
          </div>
        </div>

        {/* Relationship Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Contacts' },
            { id: 'friend', label: 'Friends' },
            { id: 'family', label: 'Family' },
            { id: 'colleague', label: 'Colleagues' },
            { id: 'business', label: 'Business / Clients' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterRel(tab.id)}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                background: filterRel === tab.id ? 'var(--bg-surface)' : 'transparent',
                color: filterRel === tab.id ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                border: filterRel === tab.id ? '1px solid var(--border-subtle)' : '1px solid transparent',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* People Grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center' }}>
          <Users size={44} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.35rem' }}>No Contacts Found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 1.25rem' }}>
            Add people you lend money to so you can record lending records, payment history, and auto-reminders.
          </p>
          <button className="btn btn-primary" onClick={onOpenAddPerson}>
            <Plus size={16} />
            <span>Add Your First Contact</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((person) => (
            <div key={person.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Top Row: Name & Role Badge */}
                <div
                  style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', cursor: 'pointer' }}
                  onClick={() => onOpenPersonDetails && onOpenPersonDetails(person)}
                  title={`View full details & loan history for ${person.name}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      color: 'var(--accent-emerald)'
                    }}>
                      {person.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{person.name}</h4>
                      <span className="badge-role" style={{ fontSize: '0.68rem', textTransform: 'capitalize', marginTop: '0.2rem', display: 'inline-block' }}>
                        {person.relationship}
                      </span>
                    </div>
                  </div>

                  {person.is_archived && (
                    <span className="badge badge-draft" style={{ fontSize: '0.65rem' }}>Archived</span>
                  )}
                </div>

                {/* Contact Info */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
                  {person.mobile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={13} color="var(--text-muted)" />
                      <span>{person.mobile}</span>
                    </div>
                  )}
                  {person.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={13} color="var(--text-muted)" />
                      <span>{person.email}</span>
                    </div>
                  )}
                  {person.tags && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                      <Tag size={13} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent-indigo)' }}>{person.tags}</span>
                    </div>
                  )}
                </div>

                {/* Financial Exposure Card */}
                {person.currency_breakdown && Object.keys(person.currency_breakdown).length > 1 ? (
                  <div style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 0.9rem',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Multi-Currency Balance:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {Object.entries(person.currency_breakdown).map(([cCode, cStats]) => (
                        <div key={cCode} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{cCode}:</span>
                          <span style={{ fontWeight: 800, color: cStats.outstanding > 0 ? 'var(--accent-cyan)' : 'var(--accent-emerald)' }}>
                            {getCurrencySymbol(cCode)}{Number(cStats.outstanding).toLocaleString()} owed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: 'var(--inner-card-bg)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '1.25rem',
                    textAlign: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Total Lent</span>
                      <strong style={{ fontSize: '0.85rem' }}>{defSymbol}{Number(person.total_lent || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Repaid</span>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>{defSymbol}{Number(person.total_repaid || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Owed Balance</span>
                      <strong style={{ fontSize: '0.85rem', color: person.outstanding_balance > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                        {defSymbol}{Number(person.outstanding_balance || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
                  onClick={() => onLendToPerson(person)}
                >
                  <ArrowUpRight size={14} />
                  <span>Lend Money</span>
                </button>

                {!person.is_archived && (
                  <button
                    className="btn btn-secondary"
                    title="Archive Person"
                    style={{ padding: '0.45rem 0.65rem' }}
                    onClick={() => onArchivePerson(person.id)}
                  >
                    <Archive size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
