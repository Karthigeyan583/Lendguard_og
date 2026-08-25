import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Server, ExternalLink, Terminal, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const ApiExplorer = () => {
  const { backendOnline, setBackendOnline } = useAuth();
  const [pingResult, setPingResult] = useState(null);
  const [pinging, setPinging] = useState(false);

  const handlePing = async () => {
    setPinging(true);
    try {
      const data = await api.checkHealth();
      setPingResult({ success: true, data });
      setBackendOnline(true);
    } catch (err) {
      setPingResult({ success: false, error: err.message });
      setBackendOnline(false);
    } finally {
      setPinging(false);
    }
  };

  const endpoints = [
    { method: 'GET', path: '/api/v1/health/', desc: 'System health check and server timestamp', auth: 'None' },
    { method: 'POST', path: '/api/v1/auth/register/', desc: 'User registration with role-based profile', auth: 'None' },
    { method: 'POST', path: '/api/v1/auth/login/', desc: 'User login & auth token acquisition', auth: 'None' },
    { method: 'GET', path: '/api/v1/auth/profile/', desc: 'Current user profile & KYC status', auth: 'Token' },
    { method: 'GET', path: '/api/v1/loans/applications/', desc: 'List loan applications (scoped by user role)', auth: 'Token' },
    { method: 'POST', path: '/api/v1/loans/applications/', desc: 'Create a new loan application draft', auth: 'Token' },
    { method: 'POST', path: '/api/v1/loans/applications/{id}/submit/', desc: 'Submit draft loan application for review', auth: 'Token' },
    { method: 'POST', path: '/api/v1/loans/applications/{id}/review/', desc: 'Officer approval / rejection / risk rating', auth: 'Token (Officer)' },
    { method: 'GET', path: '/api/v1/loans/applications/stats/', desc: 'Portfolio aggregates, totals & breakdown', auth: 'Token' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Live Services Card */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Server size={22} color="var(--accent-blue)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Backend & OpenAPI Documentation</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Django REST Framework 5.2 • Swagger UI • ReDoc</p>
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={handlePing}
            disabled={pinging}
            style={{ fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={pinging ? 'animate-spin' : ''} />
            <span>{pinging ? 'Pinging API...' : 'Ping /health/ Endpoint'}</span>
          </button>
        </div>

        {/* Quick Links Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            {
              title: 'Swagger UI (Interactive Docs)',
              url: 'http://127.0.0.1:8000/api/docs/',
              desc: 'Live interactive API playground & testing',
              badge: 'Swagger'
            },
            {
              title: 'ReDoc API Specification',
              url: 'http://127.0.0.1:8000/api/redoc/',
              desc: 'Formatted OpenAPI reference guide',
              badge: 'ReDoc'
            },
            {
              title: 'Django Admin Portal',
              url: 'http://127.0.0.1:8000/admin/',
              desc: 'Database and user management panel',
              badge: 'Admin'
            },
            {
              title: 'OpenAPI 3.0 Schema (YAML/JSON)',
              url: 'http://127.0.0.1:8000/api/schema/',
              desc: 'Machine-readable API definitions',
              badge: 'Schema'
            }
          ].map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                background: '#0c121d',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                color: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-emerald)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span className="badge-role" style={{ fontSize: '0.65rem' }}>{item.badge}</span>
                  <ExternalLink size={14} color="var(--text-muted)" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                {item.url}
              </div>
            </a>
          ))}
        </div>

        {/* Health Ping Result Alert */}
        {pingResult && (
          <div style={{
            background: pingResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${pingResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {pingResult.success ? (
              <CheckCircle2 size={20} color="var(--accent-emerald)" />
            ) : (
              <AlertCircle size={20} color="var(--accent-rose)" />
            )}
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {pingResult.success ? 'Backend is Healthy and Online!' : 'Could not reach backend at http://127.0.0.1:8000/'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                {pingResult.success ? JSON.stringify(pingResult.data) : pingResult.error}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Endpoints Table */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Registered API Endpoints</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem' }}>Method</th>
                <th style={{ padding: '0.75rem' }}>Endpoint</th>
                <th style={{ padding: '0.75rem' }}>Description</th>
                <th style={{ padding: '0.75rem' }}>Auth Scope</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((ep, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      background: ep.method === 'GET' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: ep.method === 'GET' ? '#60a5fa' : '#34d399'
                    }}>
                      {ep.method}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                    {ep.path}
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                    {ep.desc}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span className="badge-role" style={{ fontSize: '0.65rem' }}>{ep.auth}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
