import React from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[LendGuard ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          minHeight: this.props.inline ? '240px' : '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          width: '100%'
        }}>
          <div
            className="glass-panel"
            style={{
              maxWidth: 580,
              width: '100%',
              padding: '2.25rem',
              textAlign: 'center',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              background: 'linear-gradient(180deg, rgba(30, 15, 25, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5)',
              borderRadius: 'var(--radius-lg)'
            }}
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <ShieldAlert size={28} color="var(--accent-rose)" />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {this.props.title || 'Component Recovered Gracefully'}
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              LendGuard intercepted a rendering anomaly and kept the platform stable. You can refresh the view below.
            </p>

            {this.state.error && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.75rem 1rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-rose)',
                textAlign: 'left',
                marginBottom: '1.5rem',
                overflowX: 'auto',
                maxHeight: '120px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={this.handleReset}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                <RefreshCw size={15} />
                <span>Retry View</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={this.handleReload}
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
              >
                <Home size={15} />
                <span>Reload Platform</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
