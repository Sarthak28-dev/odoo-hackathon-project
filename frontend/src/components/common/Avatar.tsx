import React from 'react';
import { cn } from '../../lib/utils';
import { Plane, Camera } from 'lucide-react';
import type { PresenceIndicator } from '../../types';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  presence?: PresenceIndicator;
  isEditable?: boolean;
  onEditClick?: () => void;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'User',
  size = 'md',
  presence,
  isEditable = false,
  onEditClick,
  className,
}) => {
  const getInitials = (str: string) => {
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
    '2xl': 'w-28 h-28 text-3xl font-bold',
  };

  const dotSizes = {
    xs: 'w-2 h-2 ring-1',
    sm: 'w-2.5 h-2.5 ring-1.5',
    md: 'w-3 h-3 ring-2',
    lg: 'w-4 h-4 ring-2',
    xl: 'w-5 h-5 ring-2.5',
    '2xl': 'w-6 h-6 ring-3',
  };

  return (
    <div className={cn('relative inline-flex shrink-0 select-none group', className)}>
      <div
        className={cn(
          'rounded-full overflow-hidden flex items-center justify-center font-medium bg-gradient-to-tr from-purple-900 to-indigo-800 text-purple-200 border border-purple-500/30 shadow-inner',
          sizes[size]
        )}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              // Gracefully fallback to initials on broken image link
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {/* Edit pencil overlay */}
      {isEditable && (
        <button
          type="button"
          onClick={onEditClick}
          className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer border border-purple-500/50"
          title="Change profile picture"
        >
          <Camera className="w-5 h-5 text-purple-300 drop-shadow" />
        </button>
      )}

      {/* Presence Indicator Dot (Green / Yellow / Airplane) */}
      {presence && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-neutral-950 flex items-center justify-center shadow',
            dotSizes[size],
            presence === 'present' && 'bg-emerald-500',
            presence === 'absent' && 'bg-amber-500',
            presence === 'on_leave' && 'bg-sky-500'
          )}
          title={`Status: ${presence === 'present' ? 'Present' : presence === 'on_leave' ? 'On Leave' : 'Absent'}`}
        >
          {presence === 'on_leave' && size !== 'xs' && size !== 'sm' && (
            <Plane className="w-2.5 h-2.5 text-white" />
          )}
        </div>
      )}
    </div>
  );
};
