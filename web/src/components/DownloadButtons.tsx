import { Download } from 'lucide-react';
import type { ConversionStatus } from '../types/conversion';

interface DownloadButtonsProps {
  conversions: Map<string, ConversionStatus>;
  targetFormat: string;
  onDownloadFile: (fileId: string, format: string) => void;
  onDownloadAll: () => void;
}

export function DownloadButtons({
  conversions,
  targetFormat,
  onDownloadFile,
  onDownloadAll
}: DownloadButtonsProps) {
  const completedConversions = Array.from(conversions.values()).filter(
    c => c.status === 'completed'
  );

  if (completedConversions.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-4">
        <span className="text-sm font-semibold tracking-widest uppercase text-[#1A1A1A] opacity-60">
          Téléchargement
        </span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#801515]" />
          <span className="text-sm font-bold text-[#801515]">
            {completedConversions.length}
          </span>
        </div>
      </div>

      {/* Bouton Télécharger tout (si plusieurs fichiers) */}
      {completedConversions.length > 1 && (
        <button
          onClick={onDownloadAll}
          className="group relative w-full overflow-hidden"
        >
          <div className="absolute inset-0 bg-[#801515] transition-all duration-300 group-hover:bg-[#AA3939]" />
          <div className="relative flex items-center justify-center gap-3 px-6 py-5">
            <Download className="w-5 h-5 text-white" />
            <span className="text-white font-semibold tracking-wide">
              Télécharger tout (ZIP)
            </span>
          </div>
        </button>
      )}

      {/* Boutons individuels */}
      <div className="space-y-2">
        {completedConversions.map((conv, index) => (
          <button
            key={conv.fileId}
            onClick={() => onDownloadFile(conv.fileId, targetFormat)}
            className={`
              group flex items-center justify-between px-5 py-4
              bg-white border border-[#F5F5F5] hover:border-[#E5E5E5]
              transition-all duration-300
              animate-fade-in-up
            `}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <span className="text-sm font-medium text-[#0A0A0A]">
              Image_{index + 1}.{targetFormat}
            </span>
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full
              transition-all duration-300
              group-hover:bg-[#801515] group-hover:text-white
            `}>
              <Download className="w-4 h-4 text-[#1A1A1A] group-hover:text-white transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
