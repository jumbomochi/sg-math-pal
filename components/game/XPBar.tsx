'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPBarProps {
  currentXp: number;
  requiredXp: number;
  tierName?: string;
  tierColor?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function XPBar({
  currentXp,
  requiredXp,
  tierName,
  tierColor = '#7c3aed',
  showLabel = true,
  size = 'md'
}: XPBarProps) {
  const percentage = Math.min((currentXp / requiredXp) * 100, 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1 text-sm">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4" style={{ color: tierColor }} />
            {tierName && (
              <span className="font-medium text-gray-300">{tierName}</span>
            )}
          </div>
          <span className="text-gray-400">
            {currentXp} / {requiredXp} XP
          </span>
        </div>
      )}
      <div className={cn(
        'w-full bg-white/10 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: tierColor,
            boxShadow: `0 0 10px ${tierColor}40`
          }}
        />
      </div>
    </div>
  );
}
