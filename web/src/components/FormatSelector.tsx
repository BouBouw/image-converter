import { useState } from 'react';

// Using local type definition to avoid module resolution issues
interface FormatOption {
  value: string;
  label: string;
  supportsQuality: boolean;
}

const FORMATS: FormatOption[] = [
  { value: 'png', label: 'PNG', supportsQuality: false },
  { value: 'jpeg', label: 'JPEG', supportsQuality: true },
  { value: 'jpg', label: 'JPG', supportsQuality: true },
  { value: 'webp', label: 'WebP', supportsQuality: true },
  { value: 'gif', label: 'GIF', supportsQuality: false },
  { value: 'bmp', label: 'BMP', supportsQuality: false },
  { value: 'tiff', label: 'TIFF', supportsQuality: false },
  { value: 'ico', label: 'ICO', supportsQuality: false },
  { value: 'avif', label: 'AVIF', supportsQuality: true },
];

interface FormatSelectorProps {
  format: string;
  onFormatChange: (format: string) => void;
  quality: number;
  onQualityChange: (quality: number) => void;
}

export function FormatSelector({
  format,
  onFormatChange,
  quality,
  onQualityChange
}: FormatSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const selectedFormat = FORMATS.find(f => f.value === format);

  // Filtrer les formats basé sur la recherche
  const filteredFormats = FORMATS.filter(f =>
    f.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Barre de recherche + Grille de formats */}
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-[#1A1A1A] opacity-50 mb-3">
          Format
        </label>

        {/* Search input */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A] opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un format..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#FAFAFA] border-2 border-transparent focus:border-[#801515] focus:bg-white transition-all duration-300 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A] opacity-30 hover:opacity-60 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Grille de boutons filtrés */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {filteredFormats.length > 0 ? (
            filteredFormats.map((f) => (
              <button
                key={f.value}
                onClick={() => onFormatChange(f.value)}
                className={`
                  relative px-3 py-3 text-xs font-medium transition-all duration-300
                  ${format === f.value
                    ? 'bg-[#801515] text-white shadow-md'
                    : 'bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#F5F5F5]'
                  }
                `}
                title={f.label}
              >
                <span className="relative z-10">{f.label}</span>
                {/* Indicator pour format sélectionné */}
                {format === f.value && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#AA3939]" />
                )}
              </button>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-sm text-[#1A1A1A] opacity-40">
              Aucun format trouvé
            </div>
          )}
        </div>

        {/* Nombre de résultats */}
        {searchQuery && filteredFormats.length > 0 && (
          <div className="mt-2 text-xs text-[#1A1A1A] opacity-40">
            {filteredFormats.length} format{filteredFormats.length > 1 ? 's' : ''} trouvé{filteredFormats.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Quality Slider - Conditionnel */}
      {selectedFormat?.supportsQuality && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-xs font-semibold tracking-widest uppercase text-[#1A1A1A] opacity-50">
              Qualité
            </label>
            <span className="text-sm font-bold text-[#801515]">
              {quality}%
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => onQualityChange(parseInt(e.target.value))}
              className="w-full h-2 bg-[#F5F5F5] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#801515] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
            />
            {/* Track progress */}
            <div
              className="absolute top-0 left-0 h-2 bg-[#AA3939] rounded-full pointer-events-none transition-all duration-150"
              style={{ width: `${quality}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
