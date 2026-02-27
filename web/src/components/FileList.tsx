import { FileWithMetadata } from '../types/conversion';
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
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-700 mb-3">
        Fichiers sélectionnés ({files.length})
      </h3>
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg"
          >
            <img
              src={file.preview}
              alt={file.originalName}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.originalName}
              </p>
              <p className="text-sm text-gray-500">
                {formatSize(file.size)}
              </p>
            </div>
            <button
              onClick={() => onRemoveFile(file.id)}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
