'use client';

import { cn } from '@/lib/utils';
import { Shield } from 'lucide-react';

export const TIER_CONFIG = {
  1: { name: 'Iron', color: '#71717a', bgColor: 'bg-tier-iron' },
  2: { name: 'Bronze', color: '#cd7f32', bgColor: 'bg-tier-bronze' },
  3: { name: 'Silver', color: '#c0c0c0', bgColor: 'bg-tier-silver' },
  4: { name: 'Gold', color: '#ffd700', bgColor: 'bg-tier-gold' },
  5: { name: 'Platinum', color: '#e5e4e2', bgColor: 'bg-tier-platinum' },
} as const;

interface TierBadgeProps {
  tier: 1 | 2 | 3 | 4 | 5;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export function TierBadge({ tier, size = 'md', showName = true }: TierBadgeProps) {
  const config = TIER_CONFIG[tier];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        sizeClasses[size]
      )}
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}40`
      }}
    >
      <Shield className={iconSizes[size]} style={{ color: config.color }} />
      {showName && <span>{config.name}</span>}
    </div>
  );
}

export function getTierConfig(tier: number) {
  return TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG[1];
}
