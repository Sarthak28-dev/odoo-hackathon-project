import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string; fullScreen?: boolean }> = ({
  message = 'Loading Dayflow HRMS...',
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3 text-neutral-400 p-8">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      <p className="text-sm font-medium animate-pulse">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-neutral-950">
        {content}
      </div>
    );
  }

  return content;
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-neutral-800 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-neutral-800 rounded w-3/4" />
          <div className="h-3 bg-neutral-800/60 rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-neutral-800/40 rounded w-full" />
        <div className="h-3 bg-neutral-800/40 rounded w-5/6" />
      </div>
    </div>
  );
};
