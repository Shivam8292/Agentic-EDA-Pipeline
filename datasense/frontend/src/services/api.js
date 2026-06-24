/**
 * DataSense API Service
 * All axios calls to the FastAPI backend live here.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300_000, // 5 minutes for analysis
});

// ── Health ────────────────────────────────────
export const checkHealth = () => api.get('/health');

// ── Upload ────────────────────────────────────
export const uploadFile = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        const pct = Math.round((event.loaded * 100) / event.total);
        onProgress(pct);
      }
    },
  });
};

// ── Analysis ──────────────────────────────────
export const analyzeDataset = (datasetId, questions) =>
  api.post('/analyze', { dataset_id: datasetId, questions });

// ── Suggest Questions ─────────────────────────
export const suggestQuestions = (datasetId) =>
  api.post('/suggest', { dataset_id: datasetId });

// ── Exports ───────────────────────────────────
export const exportPDF = (datasetId) =>
  api.get(`/export/pdf?dataset_id=${datasetId}`, { responseType: 'blob' });

export const exportPPT = (datasetId) =>
  api.get(`/export/ppt?dataset_id=${datasetId}`, { responseType: 'blob' });

export const exportExcel = (datasetId) =>
  api.get(`/export/excel?dataset_id=${datasetId}`, { responseType: 'blob' });

// ── Helper: trigger browser download from blob ─
export const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default api;
