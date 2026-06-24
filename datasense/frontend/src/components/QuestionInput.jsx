import React, { useState } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { suggestQuestions } from '../services/api';

const PLACEHOLDER_QUESTIONS = [
  'What is the distribution of the main metric?',
  'Which category has the highest average value?',
  'Show the trend over time',
  'What is the correlation between two key variables?',
  'Which segment contributes most to the total?',
];

/**
 * QuestionInput — 10 numbered question inputs with AI suggestion support.
 */
export default function QuestionInput({ datasetId, onAnalyze, isAnalyzing, analysisProgress }) {
  const [questions, setQuestions] = useState(Array(10).fill(''));
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleChange = (index, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    try {
      const res = await suggestQuestions(datasetId);
      const suggested = res.data.questions || [];
      setQuestions((prev) => {
        const updated = [...prev];
        suggested.forEach((q, i) => {
          if (i < 10) updated[i] = q;
        });
        return updated;
      });
      toast.success('✦ 5 questions suggested by AI!', {
        style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' },
      });
    } catch {
      toast.error('Failed to suggest questions. Please try again.', {
        style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' },
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAnalyze = () => {
    const filled = questions.filter((q) => q.trim());
    if (filled.length === 0) {
      toast.error('Enter at least one question to analyze.', {
        style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' },
      });
      return;
    }
    onAnalyze(filled);
  };

  const filledCount = questions.filter((q) => q.trim()).length;

  return (
    <div className="card animate-fadeInUp" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
            Ask Your Questions
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Enter up to 10 questions in plain English
          </p>
        </div>

        <button
          id="suggest-questions-btn"
          className="btn-secondary"
          onClick={handleSuggest}
          disabled={isSuggesting || isAnalyzing}
          style={{ fontSize: '13px', padding: '8px 16px' }}
        >
          {isSuggesting ? (
            <>
              <span style={{ width: '14px', height: '14px', border: '2px solid var(--border)', borderTop: '2px solid var(--accent-primary)', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
              Suggesting...
            </>
          ) : (
            <>
              <span>✦</span>
              Suggest Questions
            </>
          )}
        </button>
      </div>

      {/* Question inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {questions.map((q, index) => (
          <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{
              width: '28px',
              height: '28px',
              flexShrink: 0,
              borderRadius: '6px',
              background: q.trim() ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: q.trim() ? '#fff' : 'var(--text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '700',
              fontFamily: 'JetBrains Mono, monospace',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}>
              {index + 1}
            </span>
            <input
              id={`question-input-${index + 1}`}
              className="input-field"
              type="text"
              value={q}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={index === 0
                ? 'e.g. What is the most common category by count?'
                : PLACEHOLDER_QUESTIONS[index % PLACEHOLDER_QUESTIONS.length]
              }
              disabled={isAnalyzing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && index === 0) handleAnalyze();
              }}
            />
          </div>
        ))}
      </div>

      {/* Progress during analysis */}
      {isAnalyzing && analysisProgress && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {analysisProgress.message}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--accent-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
              {analysisProgress.current}/{analysisProgress.total}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Analyze button */}
      <button
        id="analyze-btn"
        className="btn-primary"
        onClick={handleAnalyze}
        disabled={filledCount === 0 || isAnalyzing}
        style={{ width: '100%', fontSize: '15px', padding: '12px' }}
      >
        {isAnalyzing ? (
          <>
            <span style={{
              width: '16px', height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid #fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            Analyzing {filledCount} question{filledCount !== 1 ? 's' : ''}...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            Analyze {filledCount > 0 ? `${filledCount} Question${filledCount !== 1 ? 's' : ''}` : 'Dataset'}
          </>
        )}
      </button>
    </div>
  );
}

QuestionInput.propTypes = {
  datasetId: PropTypes.string.isRequired,
  onAnalyze: PropTypes.func.isRequired,
  isAnalyzing: PropTypes.bool,
  analysisProgress: PropTypes.shape({
    current: PropTypes.number,
    total: PropTypes.number,
    message: PropTypes.string,
  }),
};

QuestionInput.defaultProps = {
  isAnalyzing: false,
  analysisProgress: null,
};
