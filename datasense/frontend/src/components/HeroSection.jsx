import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * HeroSection — Full-screen landing with animated particle background.
 */
export default function HeroSection({ onUploadClick }) {
  const canvasRef = useRef(null);

  // Animated particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PARTICLE_COUNT = 60;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    const CONNECT_DISTANCE = 120;
    let rafId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update + draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DISTANCE) {
            const alpha = (1 - dist / CONNECT_DISTANCE) * 0.2;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: '80px',
    }}>
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      {/* Radial gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        maxWidth: '800px',
        padding: '0 24px',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '20px',
          padding: '6px 16px',
          marginBottom: '32px',
          animation: 'fadeIn 0.6s ease',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '600', letterSpacing: '0.05em' }}>
            ✦ POWERED BY GEMINI 1.5 FLASH
          </span>
        </div>

        {/* Headline */}
        <h1
          className="hero-headline"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '24px',
            animation: 'fadeInUp 0.7s ease',
          }}
        >
          Turn raw data into{' '}
          <span style={{
            background: 'linear-gradient(135deg, #6366F1, #A78BFA, #06B6D4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            analyst-grade insights
          </span>
          . Instantly.
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: '1.125rem',
          color: 'var(--text-secondary)',
          maxWidth: '600px',
          margin: '0 auto 40px',
          lineHeight: '1.7',
          animation: 'fadeInUp 0.8s ease 0.1s both',
        }}>
          Upload any dataset. Ask questions in plain English.
          Get professional charts and insights — powered by AI.
        </p>

        {/* CTA */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          animation: 'fadeInUp 0.8s ease 0.2s both',
        }}>
          <button
            id="hero-upload-btn"
            className="btn-primary"
            onClick={onUploadClick}
            style={{
              fontSize: '16px',
              padding: '14px 32px',
              borderRadius: '10px',
              boxShadow: '0 0 32px rgba(99, 102, 241, 0.3)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Upload Dataset
          </button>

          <a
            href="https://github.com/Shivam8292/Agentic-EDA-Pipeline"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ fontSize: '16px', padding: '14px 28px', borderRadius: '10px' }}
          >
            View on GitHub
          </a>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: '40px',
          justifyContent: 'center',
          marginTop: '60px',
          flexWrap: 'wrap',
          animation: 'fadeInUp 0.8s ease 0.3s both',
        }}>
          {[
            { value: '10', label: 'Questions per Analysis' },
            { value: '6+', label: 'Chart Types' },
            { value: '3', label: 'Export Formats' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        maxWidth: '900px',
        width: '100%',
        padding: '60px 24px 40px',
        position: 'relative',
        zIndex: 1,
        animation: 'fadeInUp 0.8s ease 0.4s both',
      }}>
        {[
          {
            icon: '🧹',
            title: 'Auto Data Cleaning',
            desc: 'Automatically fills nulls, removes duplicates, fixes types, and flags outliers.',
          },
          {
            icon: '🤖',
            title: 'AI Analysis',
            desc: 'Ask questions in plain English — Gemini generates charts and analyst insights.',
          },
          {
            icon: '📤',
            title: 'Export Reports',
            desc: 'Download polished PDF, PowerPoint, or cleaned Excel in one click.',
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="card" style={{ padding: '24px' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

HeroSection.propTypes = {
  onUploadClick: PropTypes.func.isRequired,
};
