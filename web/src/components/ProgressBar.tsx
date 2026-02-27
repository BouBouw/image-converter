import type { ConversionStatus } from '../types/conversion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface ProgressBarProps {
  conversions: Map<string, ConversionStatus>;
  globalProgress: { completed: number; total: number };
}

export function ProgressBar({ conversions, globalProgress }: ProgressBarProps) {
  if (conversions.size === 0) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#801515';
      case 'error': return '#DC2626';
      case 'converting': return '#AA3939';
      default: return '#E5E5E5';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-[#801515]" />;
      case 'error': return <XCircle className="w-5 h-5 text-[#DC2626]" />;
      case 'converting': return <Loader className="w-5 h-5 text-[#AA3939] animate-spin" />;
      default: return null;
    }
  };

  const globalPercentage = globalProgress.total > 0
    ? (globalProgress.completed / globalProgress.total) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Global Progress - Design éditorial */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#1A1A1A] opacity-50">
            Progression
          </span>
          <span className="text-sm font-bold text-[#801515]">
            {globalProgress.completed}/{globalProgress.total}
          </span>
        </div>
        <div className="relative h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[#801515] transition-all duration-500 ease-out"
            style={{ width: `${globalPercentage}%` }}
          />
        </div>
        <div className="text-right mt-1">
          <span className="text-xs font-semibold text-[#801515]">
            {Math.round(globalPercentage)}%
          </span>
        </div>
      </div>

      {/* Individual Progress - List minimaliste */}
      <div className="space-y-3">
        {Array.from(conversions.values()).map((conv) => (
          <div key={conv.fileId} className="flex items-center gap-3 py-2">
            <div className="w-5 flex justify-center">
              {getStatusIcon(conv.status)}
            </div>
            <div className="flex-1">
              <div className="relative h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-300 ease-out"
                  style={{
                    width: `${conv.progress}%`,
                    backgroundColor: getStatusColor(conv.status)
                  }}
                />
              </div>
            </div>
            <span className="text-xs font-semibold w-10 text-right text-[#1A1A1A] opacity-60">
              {Math.round(conv.progress)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
