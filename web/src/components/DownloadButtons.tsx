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
    <div className="mt-6 space-y-3">
      {completedConversions.length > 1 && (
        <button
          onClick={onDownloadAll}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Télécharger tout (ZIP)
        </button>
      )}

      <div className="space-y-2">
        {completedConversions.map((conv) => (
          <button
            key={conv.fileId}
            onClick={() => onDownloadFile(conv.fileId, targetFormat)}
            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-700">
              {conv.fileId.slice(0, 8)}.{targetFormat}
            </span>
            <Download className="w-4 h-4 text-gray-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
