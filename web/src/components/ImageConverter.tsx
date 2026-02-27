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
    <div className="min-h-screen bg-white">
      {/* Hero Section compacte */}
      <div className="relative overflow-hidden border-b border-[#F5F5F5]">
        {/* Accents visuels */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#AA3939] opacity-5 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl lg:text-7xl font-bold text-[#0A0A0A] leading-[0.95] mb-4">
              Convertisseur
              <span className="block text-[#801515] mt-2">d'Images</span>
            </h1>
            <p className="text-lg text-[#1A1A1A] opacity-60 max-w-xl">
              Transformez vos images en tous formats, avec une qualité exceptionnelle.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content avec Sidebar fixe */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Zone principale - Upload + Liste (gauche) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
            {/* DropZone */}
            <div className="animate-fade-in-up delay-100">
              <DropZone onFilesSelected={handleFilesSelected} />
            </div>

            {/* FileList */}
            <div className="animate-fade-in-up delay-200">
              <FileList files={files} onRemoveFile={handleRemoveFile} />
            </div>
          </div>

          {/* Sidebar fixe - Tous les contrôles (droite) */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-8 space-y-8 animate-fade-in-up delay-300">
              {/* Format Selector */}
              <div className="border-b border-[#F5F5F5] pb-8">
                <div className="text-xs font-semibold tracking-widest uppercase text-[#1A1A1A] opacity-50 mb-6">
                  Configuration
                </div>
                <FormatSelector
                  format={targetFormat}
                  onFormatChange={setTargetFormat}
                  quality={quality}
                  onQualityChange={setQuality}
                />
              </div>

              {/* Bouton Convertir */}
              {files.length > 0 && conversions.size === 0 && (
                <div className="border-b border-[#F5F5F5] pb-8">
                  <div className="text-xs font-semibold tracking-widest uppercase text-[#1A1A1A] opacity-50 mb-4">
                    Action
                  </div>
                  <button
                    onClick={handleConvert}
                    disabled={isLoading}
                    className="group relative w-full overflow-hidden text-left"
                  >
                    <div className="absolute inset-0 bg-[#801515] transition-all duration-300 group-hover:bg-[#AA3939]" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                    <div className="relative px-6 py-4 flex items-center justify-between">
                      <span className="text-white font-semibold">
                        {isLoading ? 'Conversion...' : `Convertir`}
                      </span>
                      {isLoading && (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                  </button>

                  {/* Info badge */}
                  <div className="mt-4 flex items-center gap-2 text-sm text-[#1A1A1A] opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#AA3939]" />
                    <span>{files.length} fichier{files.length > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {conversions.size > 0 && (
                <div className="border-b border-[#F5F5F5] pb-8">
                  <div className="text-xs font-semibold tracking-widest uppercase text-[#1A1A1A] opacity-50 mb-4">
                    Progression
                  </div>
                  <ProgressBar conversions={conversions} globalProgress={globalProgress} />
                </div>
              )}

              {/* Download Buttons */}
              {Array.from(conversions.values()).filter(c => c.status === 'completed').length > 0 && (
                <div>
                  <div className="text-xs font-semibold tracking-widest uppercase text-[#1A1A1A] opacity-50 mb-4">
                    Téléchargement
                  </div>
                  <DownloadButtons
                    conversions={conversions}
                    targetFormat={targetFormat}
                    onDownloadFile={downloadFile}
                    onDownloadAll={() => downloadAll(Array.from(conversions.values()))}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative py-8 border-t border-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-[#1A1A1A] opacity-30 font-medium">
              © 2025 — Convertisseur d'Images
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#801515]" />
              <div className="w-2 h-2 rounded-full bg-[#AA3939]" />
            </div>
          </div>
        </div>
      </div>

      {/* Overlay mobile pour sidebar */}
      {files.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#F5F5F5] p-4 z-50">
          <div className="space-y-4">
            <FormatSelector
              format={targetFormat}
              onFormatChange={setTargetFormat}
              quality={quality}
              onQualityChange={setQuality}
            />
            {conversions.size === 0 && (
              <button
                onClick={handleConvert}
                disabled={isLoading}
                className="w-full px-6 py-4 bg-[#801515] text-white font-semibold"
              >
                {isLoading ? 'Conversion...' : 'Convertir'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
