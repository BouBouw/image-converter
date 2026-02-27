import type { FileWithMetadata } from '../types/conversion';
import { X } from 'lucide-react';

interface FileListProps {
  files: FileWithMetadata[];
  onRemoveFile: (id: string) => void;
}

export function FileList({ files, onRemoveFile }: FileListProps) {
  if (files.length === 0) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Header éditorial */}
      <div className="flex items-baseline justify-between border-b border-[#F5F5F5] pb-4">
        <h3 className="text-sm font-semibold tracking-widest uppercase text-[#1A1A1A] opacity-60">
          Fichiers
        </h3>
        <span className="text-sm font-bold text-[#801515]">
          {files.length.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Liste de fichiers avec design minimaliste */}
      <div className="space-y-3">
        {files.map((file, index) => (
          <div
            key={file.id}
            className="group flex items-center gap-4 p-4 bg-white border border-[#F5F5F5] hover:border-[#E5E5E5] transition-all duration-300 animate-slide-in-left"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Preview */}
            <img
              src={file.preview}
              alt={file.originalName}
              className="w-20 h-20 object-cover border-2 border-[#E5E5E5]"
            />

            {/* Info fichier */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0A0A0A] truncate mb-1 font-serif">
                {file.originalName}
              </p>
              <p className="text-xs text-[#1A1A1A] opacity-40 uppercase tracking-wide">
                {formatSize(file.size)}
              </p>
            </div>

            {/* Bouton supprimer avec animation */}
            <button
              onClick={() => onRemoveFile(file.id)}
              className="p-3 text-[#1A1A1A] opacity-30 hover:text-[#AA3939] hover:opacity-100 hover:bg-[#FAFAFA] rounded-full transition-all duration-300"
              aria-label="Supprimer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
