import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Plot from 'react-plotly.js';

const CHART_TYPE_ICONS = {
  bar: '📊',
  line: '📈',
  scatter: '🔵',
  pie: '🥧',
  heatmap: '🌡',
  box: '📦',
  histogram: '📉',
};

/**
 * AnalysisCard — Displays one question's result: chart + insight.
 */
export default function AnalysisCard({ result, index, isLoading }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div
        className="analysis-card"
        style={{
          padding: '20px',
          animation: `fadeInUp 0.5s ease ${index * 0.1}s both`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
          <div className="skeleton" style={{ width: '60%', height: '18px', borderRadius: '4px' }} />
        </div>
        <div className="skeleton" style={{ height: '300px', borderRadius: '8px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ height: '14px', borderRadius: '4px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '14px', borderRadius: '4px', width: '80%' }} />
      </div>
    );
  }

  const isFailed = result.status === 'failed';
  const chartData = result.chart_json ? JSON.parse(result.chart_json) : null;

  return (
    <div
      className={`analysis-card ${isFailed ? 'failed' : ''}`}
      style={{ animation: `fadeInUp 0.5s ease ${index * 0.1}s both` }}
    >
      {/* Card header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
          <span style={{
            width: '28px',
            height: '28px',
            flexShrink: 0,
            borderRadius: '6px',
            background: isFailed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            color: isFailed ? 'var(--error)' : 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '700',
            fontFamily: 'JetBrains Mono, monospace',
            marginTop: '1px',
          }}>
            {index + 1}
          </span>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            lineHeight: '1.5',
          }}>
            {result.question}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {!isFailed && result.chart_type && (
            <span className="badge badge-numeric" style={{ fontSize: '10px' }}>
              {CHART_TYPE_ICONS[result.chart_type] || '📊'} {result.chart_type}
            </span>
          )}
          {isFailed && (
            <span className="badge badge-error" style={{ fontSize: '10px' }}>
              Failed
            </span>
          )}
          {!isFailed && chartData && (
            <button
              className="btn-ghost"
              onClick={() => setIsExpanded(true)}
              style={{ padding: '4px 8px', fontSize: '12px' }}
              title="Expand chart"
            >
              ⛶
            </button>
          )}
        </div>
      </div>

      {/* Chart area */}
      {isFailed ? (
        <div style={{
          padding: '32px 24px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠</div>
          <p style={{ fontWeight: '600', color: 'var(--error)', marginBottom: '8px' }}>
            Could not answer this question
          </p>
          <p style={{ fontSize: '13px' }}>
            {result.error_message || 'Try rephrasing your question or check if the relevant columns exist.'}
          </p>
        </div>
      ) : chartData ? (
        <div className="chart-container" style={{ padding: '4px' }}>
          <Plot
            data={chartData.data}
            layout={{
              ...chartData.layout,
              paper_bgcolor: '#111118',
              plot_bgcolor: '#0A0A0F',
              font: { color: '#F0F0F5', family: 'Inter, sans-serif', size: 12 },
              margin: { l: 50, r: 30, t: 40, b: 50 },
              autosize: true,
            }}
            config={{
              displayModeBar: true,
              modeBarButtonsToRemove: ['lasso2d', 'select2d'],
              responsive: true,
              displaylogo: false,
              toImageButtonOptions: {
                format: 'png',
                filename: `datasense_chart_${index + 1}`,
                height: 500,
                width: 900,
                scale: 2,
              },
            }}
            style={{ width: '100%', minHeight: '350px' }}
            useResizeHandler
          />
        </div>
      ) : (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--text-tertiary)',
          fontSize: '13px',
        }}>
          No chart generated
        </div>
      )}

      {/* Insight section */}
      {!isFailed && result.insight && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--accent-secondary)' }}>✦</span>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Analyst Insight
            </span>
          </div>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            fontStyle: 'italic',
          }}>
            {result.insight}
          </p>
        </div>
      )}

      {/* Expanded chart modal */}
      {isExpanded && chartData && (
        <div className="modal-overlay" onClick={() => setIsExpanded(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>{result.question}</h3>
              <button className="btn-ghost" onClick={() => setIsExpanded(false)}>✕ Close</button>
            </div>
            <div style={{ padding: '8px' }}>
              <Plot
                data={chartData.data}
                layout={{
                  ...chartData.layout,
                  paper_bgcolor: '#111118',
                  plot_bgcolor: '#0A0A0F',
                  font: { color: '#F0F0F5', family: 'Inter, sans-serif', size: 12 },
                  autosize: true,
                }}
                config={{ displayModeBar: true, responsive: true, displaylogo: false }}
                style={{ width: '100%', height: '500px' }}
                useResizeHandler
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

AnalysisCard.propTypes = {
  result: PropTypes.shape({
    question: PropTypes.string,
    chart_json: PropTypes.string,
    chart_type: PropTypes.string,
    insight: PropTypes.string,
    status: PropTypes.string,
    error_message: PropTypes.string,
  }),
  index: PropTypes.number.isRequired,
  isLoading: PropTypes.bool,
};

AnalysisCard.defaultProps = {
  isLoading: false,
};
