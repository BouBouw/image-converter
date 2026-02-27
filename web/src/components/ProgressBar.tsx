import { ConversionStatus } from '../types/conversion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

interface ProgressBarProps {
  conversions: Map<string, ConversionStatus>;
  globalProgress: { completed: number; total: number };
}

export function ProgressBar({ conversions, globalProgress }: ProgressBarProps) {
  if (conversions.size === 0) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'converting': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'converting': return <Loader className="w-5 h-5 text-yellow-500 animate-spin" />;
      default: return null;
    }
  };

  const globalPercentage = globalProgress.total > 0
    ? (globalProgress.completed / globalProgress.total) * 100
    : 0;

  return (
    <div className="mt-6 space-y-4">
      {/* Global Progress */}
      <div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progression globale</span>
          <span>
            {globalProgress.completed}/{globalProgress.total} (
            {Math.round(globalPercentage)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${globalPercentage}%` }}
          />
        </div>
      </div>

      {/* Individual Progress */}
      <div className="space-y-2">
        {Array.from(conversions.values()).map((conv) => (
          <div key={conv.fileId} className="flex items-center gap-3">
            {getStatusIcon(conv.status)}
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getStatusColor(conv.status)} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${conv.progress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-600 w-12 text-right">
              {Math.round(conv.progress)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
