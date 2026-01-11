'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useSoundOptional } from '@/components/audio/SoundProvider';

interface Badge {
  type: string;
  name: string;
  description: string;
  icon: string;
}

interface BadgeUnlockProps {
  badge: Badge | null;
  onClose: () => void;
}

export function BadgeUnlock({ badge, onClose }: BadgeUnlockProps) {
  const sound = useSoundOptional();

  // Play sound when badge appears
  useEffect(() => {
    if (badge && sound) {
      sound.playSound('badgeUnlock');
    }
  }, [badge, sound]);

  // Get the icon component dynamically
  const getIconComponent = (iconName: string) => {
    const pascalName = iconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (LucideIcons as any)[pascalName] || LucideIcons.Award;
  };

  if (!badge) return null;

  const IconComponent = getIconComponent(badge.icon);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 15, stiffness: 300 }}
            className="relative bg-gradient-to-br from-amber-500/20 via-space-card to-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>

            {/* Sparkle effects */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-amber-400 rounded-full"
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0,
                    opacity: 0,
                  }}
                  animate={{
                    x: `${20 + Math.random() * 60}%`,
                    y: `${20 + Math.random() * 60}%`,
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 1,
                  }}
                />
              ))}
            </div>

            {/* Badge icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2, damping: 10 }}
              className="relative mx-auto mb-6 w-24 h-24"
            >
              <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl animate-pulse" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                <IconComponent className="w-12 h-12 text-black" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-amber-400 text-sm font-medium mb-1">Badge Unlocked!</p>
              <h2 className="text-2xl font-bold text-white mb-2">{badge.name}</h2>
              <p className="text-gray-400 text-sm">{badge.description}</p>
            </motion.div>

            {/* Continue button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={onClose}
              className="mt-6 px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold transition-colors"
            >
              Awesome!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
