import React, { useState } from 'react';
import { Bell, Calendar, Plus, Trash2, CheckCircle2, ShieldAlert, Mail } from 'lucide-react';
import { getCurrencySymbol } from '../../utils/currency';

export const ScheduledReportsAlertsView = ({
  reportingCurrency = 'INR',
  isMasked = false
}) => {
  const [schedules, setSchedules] = useState([
    { id: 's_1', report_name: 'Monthly Lending & Borrowing Audit', frequency: 'Monthly (1st of month)', channel: 'Email PDF Attachment', active: true },
    { id: 's_2', report_name: 'Weekly Overdue Delinquency Digest', frequency: 'Weekly (Every Monday)', channel: 'In-App Ready Download', active: true }
  ]);

  const [alerts, setAlerts] = useState([
    { id: 'a_1', name: 'High Overdue Receivables Alert', metric: 'Overdue Receivables', condition: '> 10,000 INR', channel: 'In-App Alert', active: true },
    { id: 'a_2', name: 'Low Monthly Recovery Warning', metric: 'Recovery Rate %', condition: '< 75%', channel: 'In-App Alert', active: true }
  ]);

  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertMetric, setNewAlertMetric] = useState('overdue_receivables');
  const [newAlertThreshold, setNewAlertThreshold] = useState('10000');

  const handleCreateAlert = () => {
    if (!newAlertName.trim()) return;
    setAlerts([
      ...alerts,
      {
        id: `a_${Date.now()}`,
        name: newAlertName.trim(),
        metric: newAlertMetric.replace('_', ' ').toUpperCase(),
        condition: `> ${newAlertThreshold} ${reportingCurrency}`,
        channel: 'In-App Alert',
        active: true
      }
    ]);
    setNewAlertName('');
  };

  const symbol = getCurrencySymbol(reportingCurrency);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Automated Scheduled Reports */}
      <div className="glass-panel" style={{ padding: '1.4rem 1.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Calendar size={18} color="var(--accent-emerald)" />
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Automated Scheduled Reports</h4>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Recurring automated ledger reports generated and delivered automatically
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {schedules.map(s => (
            <div
              key={s.id}
              style={{
                background: 'var(--inner-card-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{s.report_name}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Frequency: {s.frequency} • Delivery: {s.channel}
                </div>
              </div>
              <span className="badge badge-active" style={{ fontSize: '0.72rem' }}>
                Active Schedule
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Threshold Alert Rules */}
      <div className="glass-panel" style={{ padding: '1.4rem 1.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Bell size={18} color="var(--accent-amber)" />
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Custom Threshold Alert Rules</h4>
            </div>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Real-time portfolio alert triggers based on live financial conditions
            </p>
          </div>
        </div>

        {/* Create Rule Form */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Alert rule name..."
            value={newAlertName}
            onChange={(e) => setNewAlertName(e.target.value)}
            style={{ flex: 1.5, minWidth: 160, fontSize: '0.78rem' }}
          />
          <select
            className="form-control"
            value={newAlertMetric}
            onChange={(e) => setNewAlertMetric(e.target.value)}
            style={{ flex: 1, minWidth: 140, fontSize: '0.78rem' }}
          >
            <option value="overdue_receivables">Overdue Receivables</option>
            <option value="outstanding_payables">Outstanding Payables</option>
            <option value="recovery_rate">Recovery Rate %</option>
          </select>
          <input
            type="number"
            className="form-control"
            placeholder="Threshold amount"
            value={newAlertThreshold}
            onChange={(e) => setNewAlertThreshold(e.target.value)}
            style={{ width: 120, fontSize: '0.78rem' }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateAlert}
            style={{ background: 'var(--accent-emerald)', color: '#fff', fontSize: '0.78rem' }}
          >
            Add Alert Rule
          </button>
        </div>

        {/* Existing Alerts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {alerts.map(a => (
            <div
              key={a.id}
              style={{
                background: 'var(--inner-card-bg)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{a.name}</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Condition: <strong style={{ color: 'var(--text-primary)' }}>{a.metric} {a.condition}</strong> • Action: {a.channel}
                </div>
              </div>
              <span className="badge badge-active" style={{ fontSize: '0.72rem' }}>
                Rule Enabled
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
