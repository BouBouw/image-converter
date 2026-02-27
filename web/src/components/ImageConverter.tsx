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
    <div className="min-h-screen">
      {/* Hero Section - Asymétrique */}
      <div className="relative overflow-hidden">
        {/* Accent rouge visuel */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[#AA3939] opacity-5" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#801515] rounded-full opacity-10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="pt-20 pb-16 lg:pt-32 lg:pb-24">
            {/* Layout asymétrique */}
            <div className="grid lg:grid-cols-12 gap-12 items-end">
              <div className="lg:col-span-8 animate-fade-in-up">
                <h1 className="text-6xl lg:text-8xl font-bold text-[#0A0A0A] leading-[0.95] mb-8">
                  Convertisseur
                  <span className="block text-[#801515] mt-2">d'Images</span>
                </h1>
                <p className="text-xl text-[#1A1A1A] opacity-70 max-w-2xl leading-relaxed">
                  Transformez vos images en tous formats, avec une qualité exceptionnelle.
                </p>
              </div>
              <div className="lg:col-span-4 lg:text-right animate-fade-in-up delay-200">
                <div className="inline-block">
                  <div className="text-sm font-semibold tracking-widest uppercase text-[#AA3939] mb-2">
                    Format de sortie
                  </div>
                  <FormatSelector
                    format={targetFormat}
                    onFormatChange={setTargetFormat}
                    quality={quality}
                    onQualityChange={setQuality}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-32">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Zone de gauche - Upload + Liste */}
          <div className="lg:col-span-7 space-y-8">
            {/* DropZone avec design éditeur */}
            <div className="animate-fade-in-up delay-300">
              <DropZone onFilesSelected={handleFilesSelected} />
            </div>

            {/* FileList */}
            <div className="animate-fade-in-up delay-400">
              <FileList files={files} onRemoveFile={handleRemoveFile} />
            </div>
          </div>

          {/* Zone de droite - Actions + Progression */}
          <div className="lg:col-span-5 space-y-8">
            {/* Bouton Convertir */}
            {files.length > 0 && conversions.size === 0 && (
              <div className="sticky top-8 animate-fade-in-up delay-500">
                <button
                  onClick={handleConvert}
                  disabled={isLoading}
                  className="group relative w-full overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#801515] transition-all duration-300 group-hover:bg-[#AA3939]" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                  <div className="relative px-8 py-5">
                    <span className="text-white font-semibold text-lg tracking-wide">
                      {isLoading ? 'Conversion en cours...' : `Convertir en ${targetFormat.toUpperCase()}`}
                    </span>
                  </div>
                </button>

                {/* Info badge */}
                <div className="mt-4 flex items-center gap-3 text-sm text-[#1A1A1A] opacity-60">
                  <div className="w-2 h-2 rounded-full bg-[#AA3939]" />
                  <span>{files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}</span>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="animate-fade-in-up">
              <ProgressBar conversions={conversions} globalProgress={globalProgress} />
            </div>

            {/* Download Buttons */}
            <div className="animate-fade-in-up">
              <DownloadButtons
                conversions={conversions}
                targetFormat={targetFormat}
                onDownloadFile={downloadFile}
                onDownloadAll={() => downloadAll(Array.from(conversions.values()))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer décoratif */}
      <div className="relative py-12 border-t border-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-[#1A1A1A] opacity-40 font-medium">
              © 2025 — Convertisseur d'Images
            </div>
            <div className="flex items-center gap-6">
              <div className="w-3 h-3 rounded-full bg-[#801515]" />
              <div className="w-3 h-3 rounded-full bg-[#AA3939]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
