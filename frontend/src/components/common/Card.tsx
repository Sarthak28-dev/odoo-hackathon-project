import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  interactive = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl p-5 shadow-lg shadow-black/20 text-neutral-100 transition-all',
        hoverEffect && 'hover:border-neutral-700 hover:shadow-xl hover:shadow-purple-950/10',
        interactive && 'cursor-pointer hover:border-purple-500/50 hover:bg-neutral-900 active:scale-[0.99]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
