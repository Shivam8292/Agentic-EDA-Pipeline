import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import { uploadFile } from './services/api';
import toast from 'react-hot-toast';

export default function App() {
  const [previewData, setPreviewData] = useState(null);
  const [datasetId, setDatasetId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileAccepted = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await uploadFile(file, (pct) => setUploadProgress(pct));
      const data = res.data;
      setDatasetId(data.dataset_id);
      setPreviewData(data);

      toast.success('Dataset uploaded and cleaned successfully!', {
        style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' },
        icon: '✓',
      });
    } catch (err) {
      const message = err.response?.data?.detail || 'Upload failed. Please try again.';
      toast.error(message, {
        style: { background: '#1A1A24', color: '#F0F0F5', border: '1px solid #2A2A38' },
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ErrorBoundary>
      <Navbar hasDataset={!!previewData} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1A24',
            color: '#F0F0F5',
            border: '1px solid #2A2A38',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
          },
        }}
      />

      {previewData && datasetId ? (
        <DashboardPage previewData={previewData} datasetId={datasetId} />
      ) : (
        <LandingPage
          onFileAccepted={handleFileAccepted}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      )}
    </ErrorBoundary>
  );
}
