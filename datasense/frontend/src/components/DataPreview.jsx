import React, { useState } from 'react';
import PropTypes from 'prop-types';

const DTYPE_BADGE = {
  numeric: 'badge-numeric',
  categorical: 'badge-categorical',
  datetime: 'badge-datetime',
  other: 'badge-other',
};

/**
 * DataPreview — Shows dataset shape, cleaning summary,
 * column explorer, and first 5 rows table.
 */
export default function DataPreview({ previewData }) {
  const [showFullTable, setShowFullTable] = useState(false);

  if (!previewData) return null;

  const { filename, shape, columns, sample_rows, cleaning_report } = previewData;
  const cr = cleaning_report;

  const hasChanges =
    cr.nulls_filled > 0 ||
    cr.duplicates_removed > 0 ||
    cr.type_corrections.length > 0 ||
    cr.outliers_flagged > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fadeInUp">
      {/* File info banner */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0,
            animation: 'scaleIn 0.3s ease',
          }}>
            ✓
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: '600', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {filename}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              <span style={{ color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {shape.rows.toLocaleString()} rows
              </span>
              {' · '}
              <span style={{ color: 'var(--accent-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {shape.columns} columns
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Cleaning summary */}
      {hasChanges && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.07)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '10px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
        }}>
          <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>
            ✓ AUTO-CLEANED
          </span>
          {cr.nulls_filled > 0 && <span>{cr.nulls_filled} nulls filled</span>}
          {cr.duplicates_removed > 0 && <span>· {cr.duplicates_removed} duplicates removed</span>}
          {cr.type_corrections.length > 0 && <span>· {cr.type_corrections.length} type corrections</span>}
          {cr.outliers_flagged > 0 && (
            <span style={{ color: 'var(--warning)' }}>· {cr.outliers_flagged} outliers flagged</span>
          )}
        </div>
      )}

      {/* Column explorer */}
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Columns ({columns.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '280px', overflowY: 'auto' }}>
          {columns.map((col) => (
            <div key={col.name} className="column-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
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
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {col.null_count > 0 && (
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--warning)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {col.null_pct}%
                  </span>
                )}
                <span className={`badge ${DTYPE_BADGE[col.dtype] || 'badge-other'}`}>
                  {col.dtype}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample rows table */}
      {sample_rows && sample_rows.length > 0 && (
        <div className="card" style={{ padding: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Sample Rows
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              First {sample_rows.length} of {shape.rows.toLocaleString()} rows
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              <thead>
                <tr>
                  {columns.slice(0, 8).map((col) => (
                    <th key={col.name} style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border)',
                      whiteSpace: 'nowrap',
                      fontWeight: '600',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}>
                      {col.name}
                    </th>
                  ))}
                  {columns.length > 8 && (
                    <th style={{ padding: '8px 10px', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                      +{columns.length - 8} more
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sample_rows.map((row, rowIdx) => (
                  <tr key={rowIdx} style={{
                    borderBottom: '1px solid rgba(42, 42, 56, 0.5)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {columns.slice(0, 8).map((col) => (
                      <td key={col.name} style={{
                        padding: '8px 10px',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {row[col.name] ?? <span style={{ color: 'var(--text-tertiary)' }}>null</span>}
                      </td>
                    ))}
                    {columns.length > 8 && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

DataPreview.propTypes = {
  previewData: PropTypes.shape({
    filename: PropTypes.string,
    shape: PropTypes.shape({ rows: PropTypes.number, columns: PropTypes.number }),
    columns: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      dtype: PropTypes.string,
      null_count: PropTypes.number,
      null_pct: PropTypes.number,
    })),
    sample_rows: PropTypes.arrayOf(PropTypes.object),
    cleaning_report: PropTypes.shape({
      nulls_filled: PropTypes.number,
      duplicates_removed: PropTypes.number,
      type_corrections: PropTypes.arrayOf(PropTypes.string),
      outliers_flagged: PropTypes.number,
    }),
  }),
};
