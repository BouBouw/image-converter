import { useState, useEffect } from 'react';
import type { FileWithMetadata, ConversionStatus } from '../types/conversion';
import { useConversion } from '../hooks/useConversion';
import { useWebSocket } from '../hooks/useWebSocket';
import { FormatSelector } from './FormatSelector';
import { DropZone } from './DropZone';
import { FileList } from './FileList';
import { ProgressBar } from './ProgressBar';
import { DownloadButtons } from './DownloadButtons';

export function ImageConverter() {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [conversions, setConversions] = useState<Map<string, ConversionStatus>>(new Map());
  const [targetFormat, setTargetFormat] = useState('png');
  const [quality, setQuality] = useState(85);

  const { uploadFiles, startConversion, downloadFile, downloadAll, isLoading, conversionId } =
    useConversion();

  const { onProgress } = useWebSocket(conversionId);

  useEffect(() => {
    if (!onProgress) return;

    const unsubscribe = onProgress((data) => {
      setConversions(prev => {
        const newMap = new Map(prev);
        newMap.set(data.fileId, {
          fileId: data.fileId,
          progress: data.progress,
          status: data.status,
          error: data.error,
          outputPath: data.outputPath
        });
        return newMap;
      });
    });

    return unsubscribe;
  }, [onProgress]);

  const handleFilesSelected = async (newFiles: File[]) => {
    const filesWithMetadata: FileWithMetadata[] = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file),
      originalName: file.name,
      size: file.size
    }));

    setFiles(prev => [...prev, ...filesWithMetadata]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    const uploadedFiles = await uploadFiles(files.map(f => f.file));
    if (!uploadedFiles) return;

    const id = await startConversion(uploadedFiles, targetFormat, quality);
    if (!id) return;

    setConversions(new Map());
  };

  const globalProgress = {
    completed: Array.from(conversions.values()).filter(c => c.status === 'completed').length,
    total: files.length
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Convertisseur d'Images
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Convertissez vos images en tous formats, rapidement et facilement
        </p>

        <FormatSelector
          format={targetFormat}
          onFormatChange={setTargetFormat}
          quality={quality}
          onQualityChange={setQuality}
        />

        <div className="mt-6">
          <DropZone onFilesSelected={handleFilesSelected} />
        </div>

        <FileList files={files} onRemoveFile={handleRemoveFile} />

        {files.length > 0 && conversions.size === 0 && (
          <button
            onClick={handleConvert}
            disabled={isLoading}
            className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Conversion en cours...' : `Convertir en ${targetFormat.toUpperCase()}`}
          </button>
        )}

        <ProgressBar conversions={conversions} globalProgress={globalProgress} />

        <DownloadButtons
          conversions={conversions}
          targetFormat={targetFormat}
          onDownloadFile={downloadFile}
          onDownloadAll={() => downloadAll(Array.from(conversions.values()))}
        />
      </div>
    </div>
  );
}
