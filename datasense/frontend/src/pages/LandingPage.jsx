import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import HeroSection from '../components/HeroSection';
import UploadZone from '../components/UploadZone';

/**
 * LandingPage — Hero + upload zone shown before a dataset is loaded.
 */
export default function LandingPage({ onFileAccepted, isUploading, uploadProgress }) {
  const uploadRef = useRef(null);

  const scrollToUpload = () => {
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div>
      <HeroSection onUploadClick={scrollToUpload} />

      {/* Upload section */}
      <section
        id="upload-section"
        style={{
          padding: '80px 24px',
          background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '800',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #F0F0F5, #8B8B9E)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Start with Your Dataset
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '15px',
            marginBottom: '40px',
            lineHeight: '1.7',
          }}>
            Upload a CSV or Excel file to begin. Your data is processed locally and never stored permanently.
          </p>

          <div ref={uploadRef}>
            <UploadZone
              onFileAccepted={onFileAccepted}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '24px',
            justifyContent: 'center',
            marginTop: '32px',
            flexWrap: 'wrap',
          }}>
            {[
              { icon: '🔒', text: 'Data stays on your server' },
              { icon: '⚡', text: 'Results in under 60 seconds' },
              { icon: '🆓', text: 'Free to use' },
            ].map(({ icon, text }) => (
              <div key={text} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                <span>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

LandingPage.propTypes = {
  onFileAccepted: PropTypes.func.isRequired,
  isUploading: PropTypes.bool,
  uploadProgress: PropTypes.number,
};
