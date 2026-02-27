import { useState, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export function useConversion() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionId, setConversionId] = useState<string | null>(null);

  const uploadFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.files;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startConversion = useCallback(async (
    files: any[],
    targetFormat: string,
    quality: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/convert`, {
        files,
        targetFormat,
        quality
      });
      setConversionId(response.data.conversionId);
      return response.data.conversionId;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Conversion failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const downloadFile = useCallback((fileId: string, format: string) => {
    window.open(`${API_URL}/download/${fileId}?format=${format}`, '_blank');
  }, []);

  const downloadAll = useCallback(async (files: any[]) => {
    try {
      const response = await axios.post(`${API_URL}/download-all`, { files }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'images.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Download failed');
    }
  }, []);

  return {
    uploadFiles,
    startConversion,
    downloadFile,
    downloadAll,
    isLoading,
    error,
    conversionId
  };
}
