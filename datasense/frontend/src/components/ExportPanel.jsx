import React, { useState } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { exportPDF, exportPPT, exportExcel, triggerDownload } from '../services/api';

/**
 * ExportPanel — Download buttons for PDF, PowerPoint, and Excel.
 */
export default function ExportPanel({ datasetId, hasResults, filename }) {
  const [loading, setLoading] = useState({ pdf: false, ppt: false, excel: false });

  const handleExport = async (type) => {
    if (!datasetId || !hasResults) return;

    setLoading((prev) => ({ ...prev, [type]: true }));
    const toastId = toast.loading(`Generating ${type.toUpperCase()}...`, {
      style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' },
    });

    try {
      let res;
      let ext;
      if (type === 'pdf') { res = await exportPDF(datasetId); ext = 'pdf'; }
      else if (type === 'ppt') { res = await exportPPT(datasetId); ext = 'pptx'; }
      else { res = await exportExcel(datasetId); ext = 'xlsx'; }

      const baseName = filename ? filename.replace(/\.[^.]+$/, '') : 'datasense';
      triggerDownload(res.data, `${baseName}_report.${ext}`);

      toast.success(`${type.toUpperCase()} downloaded!`, {
        id: toastId,
        style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' },
      });
    } catch (err) {
      toast.error(`Failed to generate ${type.toUpperCase()}. Try again.`, {
        id: toastId,
        style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' },
      });
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const exports = [
    {
      type: 'pdf',
      label: 'PDF Report',
      desc: 'All charts + insights',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      type: 'ppt',
      label: 'PowerPoint',
      desc: 'Slide per question',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      ),
    },
    {
      type: 'excel',
      label: 'Cleaned Excel',
      desc: 'Data + column stats',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
          <line x1="8" y1="9" x2="10" y2="9" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{
        fontSize: '11px',
        fontWeight: '700',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        marginBottom: '4px',
      }}>
        Export
      </p>

      {exports.map(({ type, label, desc, icon }) => (
        <button
          key={type}
          id={`export-${type}-btn`}
          className="btn-secondary"
          onClick={() => handleExport(type)}
          disabled={!hasResults || loading[type]}
          style={{
            justifyContent: 'flex-start',
            padding: '10px 14px',
            gap: '10px',
            fontSize: '13px',
          }}
        >
          {loading[type] ? (
            <span style={{
              width: '16px', height: '16px',
              border: '2px solid var(--border)',
              borderTop: '2px solid var(--accent-primary)',
              borderRadius: '50%',
              flexShrink: 0,
              animation: 'spin 1s linear infinite',
            }} />
          ) : (
            <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>{icon}</span>
          )}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: '600' }}>{label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{desc}</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-tertiary)' }}>↓</span>
        </button>
      ))}

      {!hasResults && (
        <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '4px' }}>
          Run analysis first to enable exports
        </p>
      )}
    </div>
  );
}

ExportPanel.propTypes = {
  datasetId: PropTypes.string,
  hasResults: PropTypes.bool,
  filename: PropTypes.string,
};

ExportPanel.defaultProps = {
  hasResults: false,
};
