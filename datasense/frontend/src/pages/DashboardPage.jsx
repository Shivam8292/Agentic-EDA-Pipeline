import React, { useState } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import DataPreview from '../components/DataPreview';
import QuestionInput from '../components/QuestionInput';
import AnalysisCard from '../components/AnalysisCard';
import { analyzeDataset } from '../services/api';

/**
 * DashboardPage — Main workspace after dataset upload.
 * Shows sidebar + data preview + question input + analysis results.
 */
export default function DashboardPage({ previewData, datasetId }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [analysisProgress, setAnalysisProgress] = useState(null);

  const hasResults = analysisResults.length > 0;

  const handleAnalyze = async (questions) => {
    setIsAnalyzing(true);
    setAnalysisResults([]);
    setPendingQuestions(questions);
    setAnalysisProgress({ current: 0, total: questions.length, message: 'Starting analysis...' });

    try {
      // Simulate progress since backend processes sequentially
      const progressInterval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (!prev) return null;
          const next = Math.min(prev.current + 1, prev.total - 1);
          return {
            ...prev,
            current: next,
            message: `Analyzing question ${next + 1} of ${prev.total}...`,
          };
        });
      }, 8000); // average 8s per question

      const res = await analyzeDataset(datasetId, questions);
      clearInterval(progressInterval);

      const results = res.data.results || [];
      setAnalysisResults(results);
      setAnalysisProgress(null);

      const successCount = results.filter((r) => r.status === 'success').length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(
          `✓ Analysis complete — ${successCount} chart${successCount !== 1 ? 's' : ''} generated${failCount > 0 ? `, ${failCount} failed` : ''}`,
          { style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' } }
        );
      } else {
        toast.error('Analysis failed for all questions. Please try rephrasing.', {
          style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' },
        });
      }
    } catch (err) {
      setAnalysisProgress(null);
      const message = err.response?.data?.detail || 'Analysis failed. Please try again.';
      toast.error(message, {
        style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' },
      });
    } finally {
      setIsAnalyzing(false);
      setPendingQuestions([]);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <Sidebar
        previewData={previewData}
        datasetId={datasetId}
        hasResults={hasResults}
      />

      {/* Main content */}
      <main className="main-content">
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Data Preview */}
          <DataPreview previewData={previewData} />

          {/* Question Input */}
          <QuestionInput
            datasetId={datasetId}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            analysisProgress={analysisProgress}
          />

          {/* Analysis Results */}
          {(isAnalyzing || hasResults) && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
                  Analysis Results
                </h2>
                {hasResults && (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span className="badge badge-success">
                      {analysisResults.filter(r => r.status === 'success').length} charts
                    </span>
                    {analysisResults.filter(r => r.status === 'failed').length > 0 && (
                      <span className="badge badge-error">
                        {analysisResults.filter(r => r.status === 'failed').length} failed
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Show skeleton cards while loading */}
                {isAnalyzing && pendingQuestions.map((q, i) => (
                  <AnalysisCard key={`skeleton-${i}`} result={{ question: q }} index={i} isLoading />
                ))}

                {/* Show real results */}
                {!isAnalyzing && analysisResults.map((result, i) => (
                  <AnalysisCard key={`result-${i}`} result={result} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state when no analysis yet */}
          {!isAnalyzing && !hasResults && (
            <div className="card" style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Enter at least one question to analyze your data
              </p>
              <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
                Use the "Suggest Questions" button above for AI-generated ideas based on your dataset schema.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

DashboardPage.propTypes = {
  previewData: PropTypes.object.isRequired,
  datasetId: PropTypes.string.isRequired,
};
