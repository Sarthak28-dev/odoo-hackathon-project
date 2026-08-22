import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
}) => {
  return (
    <div className="w-full p-6 bg-rose-950/20 border border-rose-800/40 rounded-xl flex flex-col items-center text-center gap-3">
      <div className="w-10 h-10 rounded-full bg-rose-900/40 border border-rose-700/50 flex items-center justify-center text-rose-400">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-rose-300">{title}</h4>
        <p className="text-xs text-rose-400/80 mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="mt-2 border-rose-700/50 text-rose-300 hover:bg-rose-950/40"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
