import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Plot from 'react-plotly.js';

/**
 * ChartViewer — Standalone Plotly chart with zoom/pan/download.
 * Used inside AnalysisCard and as a fullscreen modal.
 */
export default function ChartViewer({ chartJson, title, isModal, onClose }) {
  if (!chartJson) return null;

  let chartData;
  try {
    chartData = typeof chartJson === 'string' ? JSON.parse(chartJson) : chartJson;
  } catch {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: 'var(--error)',
        fontSize: '13px',
      }}>
        Failed to render chart — invalid data format.
      </div>
    );
  }

  const plotLayout = {
    ...chartData.layout,
    paper_bgcolor: '#111118',
    plot_bgcolor: '#0A0A0F',
    font: {
      color: '#F0F0F5',
      family: 'Inter, sans-serif',
      size: 12,
    },
    margin: isModal
      ? { l: 60, r: 40, t: 50, b: 60 }
      : { l: 50, r: 30, t: 40, b: 50 },
    autosize: true,
    legend: {
      bgcolor: 'rgba(17,17,24,0.9)',
      bordercolor: '#2A2A38',
      borderwidth: 1,
      font: { color: '#F0F0F5', size: 11 },
    },
    xaxis: {
      ...chartData.layout?.xaxis,
      gridcolor: '#2A2A38',
      zerolinecolor: '#2A2A38',
    },
    yaxis: {
      ...chartData.layout?.yaxis,
      gridcolor: '#2A2A38',
      zerolinecolor: '#2A2A38',
    },
  };

  const plotConfig = {
    displayModeBar: true,
    modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
    responsive: true,
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: title || 'datasense_chart',
      height: 600,
      width: 1000,
      scale: 2,
    },
  };

  if (isModal) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '1100px' }}
        >
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {title || 'Chart'}
            </h3>
            <button className="btn-ghost" onClick={onClose} style={{ fontSize: '13px' }}>
              ✕ Close
            </button>
          </div>
          <div style={{ padding: '12px' }}>
            <Plot
              data={chartData.data}
              layout={{ ...plotLayout, height: 520 }}
              config={plotConfig}
              style={{ width: '100%' }}
              useResizeHandler
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <Plot
        data={chartData.data}
        layout={{ ...plotLayout, height: 360 }}
        config={plotConfig}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </div>
  );
}

ChartViewer.propTypes = {
  chartJson: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  title: PropTypes.string,
  isModal: PropTypes.bool,
  onClose: PropTypes.func,
};

ChartViewer.defaultProps = {
  isModal: false,
  onClose: () => {},
};
