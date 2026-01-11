'use client';

import { motion } from 'framer-motion';
import { Star, Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    avatar: string;
    color: string;
    totalXp: number;
    isActive: boolean;
  };
  onSelect: () => void;
  isSelected?: boolean;
}

export function ProfileCard({ profile, onSelect, isSelected = false }: ProfileCardProps) {
  // Get avatar icon dynamically
  const AvatarIcon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
    profile.avatar.charAt(0).toUpperCase() + profile.avatar.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  ] || LucideIcons.User;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'relative w-full p-6 rounded-2xl border transition-all text-left',
        'bg-space-card/50 backdrop-blur-sm',
        isSelected
          ? 'border-nebula-purple ring-2 ring-nebula-purple/30'
          : 'border-space-border hover:border-white/20'
      )}
    >
      {/* Active indicator */}
      {profile.isActive && (
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-success-green/20 rounded-full">
            <Check className="h-3 w-3 text-success-green" />
            <span className="text-xs text-success-green">Active</span>
          </div>
        </div>
      )}

      {/* Avatar */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: `${profile.color}30` }}
      >
        <AvatarIcon className="w-8 h-8" style={{ color: profile.color }} />
      </div>

      {/* Name */}
      <h3 className="text-lg font-bold text-white mb-2">{profile.name}</h3>

      {/* XP */}
      <div className="flex items-center gap-1.5">
        <Star className="h-4 w-4 text-star-gold" />
        <span className="text-sm text-star-gold">{profile.totalXp.toLocaleString()} XP</span>
      </div>
    </motion.button>
  );
}
