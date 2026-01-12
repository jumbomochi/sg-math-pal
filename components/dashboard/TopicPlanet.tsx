'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Trophy } from 'lucide-react';
import { getTierConfig } from '@/components/game/TierBadge';
import { canUnlockChallenge } from '@/lib/tier-challenge';
import { cn } from '@/lib/utils';

interface TopicPlanetProps {
  topic: {
    id: string;
    slug: string;
    name: string;
    icon: string;
    color: string;
  };
  progress?: {
    currentTier: number;
    tierXp: number;
    tierXpRequired: number;
  };
  index: number;
}

export function TopicPlanet({ topic, progress, index }: TopicPlanetProps) {
  const tier = progress?.currentTier ?? 1;
  const tierConfig = getTierConfig(tier);
  const xpPercentage = progress ? (progress.tierXp / progress.tierXpRequired) * 100 : 0;

  // Check if challenge is unlocked
  const challengeUnlocked = progress && canUnlockChallenge(tier, progress.tierXp);
  const isMaxTier = tier >= 5;

  // Get the icon component dynamically
  const iconName = topic.icon.charAt(0).toUpperCase() + topic.icon.slice(1).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || LucideIcons.Circle;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, type: 'spring', bounce: 0.4 }}
      className="relative group"
    >
      <Link href={`/practice/${topic.slug}`}>
        <div className="relative">
          {/* Challenge unlocked glow */}
          {challengeUnlocked && !isMaxTier && (
            <motion.div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ backgroundColor: '#f59e0b' }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}

          {/* Planet glow effect */}
          <div
            className={cn(
              "absolute inset-0 rounded-full blur-xl transition-opacity",
              challengeUnlocked && !isMaxTier
                ? "opacity-30 group-hover:opacity-50"
                : "opacity-40 group-hover:opacity-60"
            )}
            style={{ backgroundColor: topic.color }}
          />

          {/* Tier ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={challengeUnlocked && !isMaxTier ? '#f59e0b' : tierConfig.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${xpPercentage * 2.83} 283`}
              className="transition-all duration-500"
            />
          </svg>

          {/* Planet body */}
          <div
            className={cn(
              'relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center',
              'bg-gradient-to-br shadow-lg group-hover:scale-105 transition-transform duration-200'
            )}
            style={{
              background: `linear-gradient(135deg, ${topic.color}, ${topic.color}99)`,
            }}
          >
            <IconComponent className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </div>

          {/* Challenge unlocked indicator */}
          {challengeUnlocked && !isMaxTier && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
            >
              <Trophy className="w-4 h-4 text-black" />
            </motion.div>
          )}

          {/* Tier badge */}
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{
              backgroundColor: `${tierConfig.color}30`,
              color: tierConfig.color,
              border: `1px solid ${tierConfig.color}50`
            }}
          >
            {tierConfig.name}
          </div>
        </div>

        {/* Topic name */}
        <p className="mt-4 text-center text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
          {topic.name}
        </p>

        {/* Challenge ready text */}
        {challengeUnlocked && !isMaxTier && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-xs font-medium text-amber-400 mt-1"
          >
            Challenge Ready!
          </motion.p>
        )}
      </Link>

      {/* Challenge button (shown on hover when unlocked) */}
      {challengeUnlocked && !isMaxTier && (
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:pointer-events-auto"
        >
          <Link
            href={`/challenge/${topic.slug}`}
            className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shadow-lg transition-colors flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Trophy className="w-3 h-3" />
            Take Challenge
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
