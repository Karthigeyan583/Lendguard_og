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

                {/* Financial Exposure Card (Dual Lending & Borrowing with Net Position) */}
                <div style={{
                  background: 'var(--inner-card-bg)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem'
                }}>
                  {/* Top Net Exposure Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                      Net Exposure
                    </span>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: (person.net_exposure || 0) > 0 ? 'var(--accent-emerald)' : (person.net_exposure || 0) < 0 ? 'var(--accent-rose)' : 'var(--text-muted)'
                    }}>
                      {(person.net_exposure || 0) >= 0 ? '+' : ''}{defSymbol}{Number(person.net_exposure || 0).toLocaleString()}
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, marginLeft: 4 }}>
                        ({(person.net_exposure || 0) > 0 ? 'Owes You' : (person.net_exposure || 0) < 0 ? 'You Owe' : 'Even'})
                      </span>
                    </span>
                  </div>

                  {/* Dual Columns: Lent vs Borrowed */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', textAlign: 'center' }}>
                    <div style={{ padding: '0.35rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent-emerald)', display: 'block', fontWeight: 700 }}>🤝 Money Lent</span>
                      <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {defSymbol}{Number(person.lent?.outstanding || person.outstanding_balance || 0).toLocaleString()}
                      </strong>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>owed to you</span>
                    </div>

                    <div style={{ padding: '0.35rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent-indigo)', display: 'block', fontWeight: 700 }}>📥 Money Borrowed</span>
                      <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {defSymbol}{Number(person.borrowed?.outstanding || 0).toLocaleString()}
                      </strong>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>you owe them</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.78rem' }}
                  onClick={() => onLendToPerson(person)}
                >
                  <Plus size={14} />
                  <span>New Transaction</span>
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
                  onClick={() => onOpenPersonDetails && onOpenPersonDetails(person)}
                >
                  History
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
