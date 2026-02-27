import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function DropZone({ onFilesSelected }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );

    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      onFilesSelected(imageFiles);
    }
  }, [onFilesSelected]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative group cursor-pointer overflow-hidden transition-all duration-300
        ${isDragging
          ? 'scale-[1.02]'
          : 'hover:scale-[1.01]'
        }
      `}
    >
      {/* Background avec bordure minimaliste */}
      <div className={`
        border-2 transition-all duration-300
        ${isDragging
          ? 'border-[#AA3939] bg-[#801515]/5'
          : 'border-[#F5F5F5] group-hover:border-[#E5E5E5]'
        }
      `}>
        <div className="p-16 lg:p-24 text-center">
          {/* Icône animée */}
          <div className={`
            inline-flex items-center justify-center w-20 h-20 rounded-full
            transition-all duration-300 mb-8
            ${isDragging
              ? 'bg-[#AA3939] scale-110'
              : 'bg-[#FAFAFA] group-hover:bg-[#F5F5F5]'
            }
          `}>
            <Upload className={`
              w-8 h-8 transition-colors duration-300
              ${isDragging ? 'text-white' : 'text-[#801515]'}
            `} />
          </div>

          {/* Titre et sous-titre */}
          <h3 className={`
            text-2xl font-semibold mb-3 transition-colors duration-300 font-serif
            ${isDragging ? 'text-[#801515]' : 'text-[#0A0A0A]'}
          `}>
            {isDragging ? 'Relâchez pour ajouter' : 'Glissez vos images ici'}
          </h3>
          <p className="text-[#1A1A1A] opacity-50 mb-8">
            ou cliquez pour parcourir vos fichiers
          </p>

          {/* Bouton */}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className={`
              inline-flex items-center gap-3 px-8 py-4
              font-medium text-sm tracking-wide uppercase
              transition-all duration-300 cursor-pointer
              ${isDragging
                ? 'bg-[#801515] text-white'
                : 'bg-[#0A0A0A] text-white hover:bg-[#801515]'
              }
            `}
          >
            <span>Parcourir</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </label>
        </div>
      </div>

      {/* Accent décoratif */}
      <div className="absolute top-0 left-0 w-1 h-full bg-[#AA3939] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
    </div>
  );
}
