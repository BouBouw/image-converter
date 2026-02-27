import { FormatOption } from '../types/conversion';

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
  const selectedFormat = FORMATS.find(f => f.value === format);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Format de sortie
        </label>
        <select
          value={format}
          onChange={(e) => onFormatChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {FORMATS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {selectedFormat?.supportsQuality && (
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qualité: {quality}%
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={quality}
            onChange={(e) => onQualityChange(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
