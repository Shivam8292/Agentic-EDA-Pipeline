import React from 'react';
import PropTypes from 'prop-types';

/**
 * Navbar — sticky frosted glass header with logo and GitHub link.
 */
export default function Navbar({ hasDataset, onReset }) {
  return (
    <nav className="navbar">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: '800',
          color: '#fff',
          flexShrink: 0,
        }}>
          D
        </div>
        <span style={{
          fontSize: '18px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #F0F0F5, #A78BFA)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          DataSense
        </span>
        <span style={{
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          padding: '1px 6px',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          beta
        </span>
      </div>

      {/* Right side links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {hasDataset && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '12px',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <span style={{
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'inline-block',
                boxShadow: '0 0 8px var(--success)',
              }} />
              Dataset loaded
            </span>
            {onReset && (
              <button
                id="upload-new-btn"
                className="btn-ghost"
                onClick={onReset}
                style={{ fontSize: '12px', padding: '4px 10px' }}
                title="Upload a new dataset"
              >
                ↑ New Dataset
              </button>
            )}
          </div>
        )}
        <a
          href="https://github.com/Shivam8292/Agentic-EDA-Pipeline"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
          style={{ fontSize: '13px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          GitHub
        </a>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  hasDataset: PropTypes.bool,
  onReset: PropTypes.func,
};

Navbar.defaultProps = {
  hasDataset: false,
};
