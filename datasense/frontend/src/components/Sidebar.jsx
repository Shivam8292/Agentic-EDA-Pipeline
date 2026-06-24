import React from 'react';
import PropTypes from 'prop-types';
import ExportPanel from './ExportPanel';

const DTYPE_BADGE_COLOR = {
  numeric: 'var(--accent-primary)',
  categorical: 'var(--accent-secondary)',
  datetime: 'var(--success)',
  other: 'var(--warning)',
};

/**
 * Sidebar — File info, column explorer, and export panel.
 */
export default function Sidebar({ previewData, datasetId, hasResults }) {
  if (!previewData) return null;

  const { filename, shape, columns } = previewData;

  const formatBytes = (mb) => {
    if (!mb) return '';
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(mb * 1024).toFixed(0)} KB`;
  };

  return (
    <aside className="sidebar">
      {/* File Info */}
      <div>
        <p style={{
          fontSize: '11px',
          fontWeight: '700',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: '12px',
        }}>
          Dataset
        </p>

        <div className="card-elevated" style={{ padding: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'rgba(99, 102, 241, 0.12)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              flexShrink: 0,
            }}>
              {filename?.endsWith('.csv') ? '📄' : '📊'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '13px',
                fontWeight: '600',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {filename}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {shape.rows.toLocaleString()} × {shape.columns}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Rows', value: shape.rows.toLocaleString() },
              { label: 'Columns', value: shape.columns },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'var(--bg-primary)',
                borderRadius: '6px',
                padding: '8px 10px',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {value}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Column Explorer */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <p style={{
          fontSize: '11px',
          fontWeight: '700',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: '10px',
        }}>
          Columns ({columns.length})
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '300px', overflowY: 'auto' }}>
          {columns.map((col) => (
            <div key={col.name} className="column-item">
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {col.name}
                </span>
                {col.null_count > 0 && (
                  <span style={{ fontSize: '10px', color: 'var(--warning)' }}>
                    {col.null_count} nulls ({col.null_pct}%)
                  </span>
                )}
              </div>
              <span style={{
                fontSize: '9px',
                fontWeight: '600',
                padding: '2px 6px',
                borderRadius: '4px',
                color: DTYPE_BADGE_COLOR[col.dtype] || 'var(--text-tertiary)',
                background: `${DTYPE_BADGE_COLOR[col.dtype] || 'var(--text-tertiary)'}18`,
                flexShrink: 0,
                fontFamily: 'JetBrains Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}>
                {col.dtype}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Export Panel */}
      <div style={{ marginTop: 'auto' }}>
        <ExportPanel
          datasetId={datasetId}
          hasResults={hasResults}
          filename={filename}
        />
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  previewData: PropTypes.object,
  datasetId: PropTypes.string,
  hasResults: PropTypes.bool,
};

Sidebar.defaultProps = {
  hasResults: false,
};
