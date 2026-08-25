import React, { useState } from 'react';
import { Table, BarChart3 } from 'lucide-react';

export const TableViewToggle = ({ isTableView, onToggle, label = 'Chart / Table' }) => {
  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={onToggle}
      title={isTableView ? "Switch to Visual Chart view" : "Switch to Accessible Table view"}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.3rem 0.65rem',
        fontSize: '0.72rem',
        fontWeight: 600,
        borderRadius: 'var(--radius-sm)',
        background: isTableView ? 'var(--accent-emerald)' : 'var(--inner-card-bg)',
        color: isTableView ? '#fff' : 'var(--text-secondary)',
        border: '1px solid var(--border-subtle)',
        cursor: 'pointer'
      }}
    >
      {isTableView ? <BarChart3 size={13} /> : <Table size={13} />}
      <span>{isTableView ? "Visual Chart" : "View as Table"}</span>
    </button>
  );
};
