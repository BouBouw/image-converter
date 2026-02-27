// Using local type definition to avoid module resolution issues
interface FormatOption {
  value: string;
  label: string;
  supportsQuality: boolean;
}

const FORMATS: FormatOption[] = [
  { value: 'png', label: 'PNG', supportsQuality: false },
  { value: 'jpeg', label: 'JPEG', supportsQuality: true },
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
  const selectedFormat = FORMATS.find(f => f.value === format);

  return (
    <div className="space-y-6">
      {/* Format Buttons - Stack vertical, aligné gauche */}
      <div>
        <label className="block text-xs font-semibold tracking-widest uppercase text-[#1A1A1A] opacity-50 mb-3">
          Format
        </label>
        <div className="space-y-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFormatChange(f.value)}
              className={`
                w-full text-left px-4 py-3 text-sm font-medium transition-all duration-300 relative
                ${format === f.value
                  ? 'bg-[#801515] text-white shadow-md'
                  : 'bg-[#FAFAFA] text-[#0A0A0A] hover:bg-[#F5F5F5] hover:pl-6'
                }
              `}
            >
              <span className="relative z-10">{f.label}</span>
              {/* Indicator pour format sélectionné */}
              {format === f.value && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#AA3939]" />
              )}
            </button>
          ))}
        </div>
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
