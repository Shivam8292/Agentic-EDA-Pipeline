import React from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary — Catches unexpected React errors and shows
 * a graceful error UI instead of crashing the whole app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[DataSense Error Boundary]', error, errorInfo);
    // Sentry captures this automatically via @sentry/react
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary)',
          padding: '24px',
        }}>
          <div className="card" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '40px 32px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠</div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>
              Something went wrong
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              An unexpected error occurred. Please refresh the page to try again.
            </p>
            <button
              className="btn-primary"
              onClick={() => window.location.reload()}
              style={{ width: '100%' }}
            >
              Refresh Page
            </button>
            {import.meta.env.DEV && this.state.error && (
              <pre style={{
                marginTop: '20px',
                textAlign: 'left',
                fontSize: '11px',
                color: 'var(--error)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                padding: '12px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
              }}>
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};
