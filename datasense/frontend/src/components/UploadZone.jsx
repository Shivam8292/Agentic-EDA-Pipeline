import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * UploadZone — Drag-and-drop file upload area.
 * Handles client-side validation before sending to backend.
 */
export default function UploadZone({ onFileAccepted, isUploading, uploadProgress }) {
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File exceeds 50MB limit. Please upload a smaller file.`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Only CSV and Excel (.xlsx, .xls) files are supported.');
      } else {
        setError('Invalid file. Please try again.');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: isUploading,
  });

  return (
    <div style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}>
      <div
        {...getRootProps()}
        className={`upload-zone ${isDragActive ? 'drag-over' : ''}`}
        id="upload-dropzone"
        style={{ cursor: isUploading ? 'wait' : 'pointer' }}
      >
        <input {...getInputProps()} id="upload-file-input" />

        {isUploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px',
              border: '3px solid var(--border)',
              borderTop: '3px solid var(--accent-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Uploading & cleaning dataset...
            </p>
            {uploadProgress > 0 && (
              <div style={{ width: '200px' }}>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', marginTop: '6px' }}>
                  {uploadProgress}%
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {/* Upload icon */}
            <div style={{
              width: '64px', height: '64px',
              background: 'rgba(99, 102, 241, 0.12)',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>

            <div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>
                {isDragActive ? '✦ Drop your file here' : 'Drag & drop your dataset'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                or{' '}
                <span style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>
                  browse to choose a file
                </span>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {['CSV', 'XLSX', 'XLS'].map((ext) => (
                <span key={ext} className="badge badge-numeric" style={{ fontSize: '10px' }}>
                  .{ext}
                </span>
              ))}
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                · Max 50MB
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          color: 'var(--error)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>⚠</span> {error}
        </div>
      )}
    </div>
  );
}

UploadZone.propTypes = {
  onFileAccepted: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  uploadProgress: PropTypes.number,
};

UploadZone.defaultProps = {
  isUploading: false,
  uploadProgress: 0,
};
