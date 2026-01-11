'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, XCircle, Star, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { getTierName, getTierColor } from '@/lib/tier-challenge';
import { useSoundOptional } from '@/components/audio/SoundProvider';
import { cn } from '@/lib/utils';

interface ChallengeResultProps {
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  requiredCorrect: number;
  xpEarned: number;
  fromTier: number;
  toTier: number;
  topicName: string;
  topicSlug: string;
  cooldownMinutes: number;
}

export function ChallengeResult({
  passed,
  correctAnswers,
  totalQuestions,
  requiredCorrect,
  xpEarned,
  fromTier,
  toTier,
  topicName,
  topicSlug,
  cooldownMinutes,
}: ChallengeResultProps) {
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const toTierColor = getTierColor(toTier);
  const sound = useSoundOptional();

  // Play result sound on mount
  useEffect(() => {
    if (sound) {
      if (passed) {
        sound.playSound('challengePass');
        setTimeout(() => sound.playSound('levelUp'), 500);
      } else {
        sound.playSound('challengeFail');
      }
    }
  }, [passed, sound]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-lg mx-auto"
    >
      <div
        className={cn(
          'rounded-2xl overflow-hidden border-2',
          passed
            ? 'bg-gradient-to-br from-success-green/20 to-success-green/5 border-success-green/50'
            : 'bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/50'
        )}
      >
        {/* Header with Icon */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center mb-4',
              passed ? 'bg-success-green/20' : 'bg-red-500/20'
            )}
          >
            {passed ? (
              <Trophy className="w-12 h-12 text-success-green" />
            ) : (
              <XCircle className="w-12 h-12 text-red-500" />
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              'text-3xl font-bold mb-2',
              passed ? 'text-success-green' : 'text-red-400'
            )}
          >
            {passed ? 'Challenge Passed!' : 'Challenge Failed'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400"
          >
            {topicName} - {getTierName(fromTier)} to {getTierName(toTier)}
          </motion.p>
        </div>

        {/* Stats */}
        <div className="px-8 pb-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-white">{correctAnswers}</div>
              <div className="text-xs text-gray-400">Correct</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-white">{totalQuestions}</div>
              <div className="text-xs text-gray-400">Total</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl font-bold text-white">{percentage}%</div>
              <div className="text-xs text-gray-400">Score</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Your Score</span>
              <span className="text-gray-400">
                Need {requiredCorrect} of {totalQuestions} to pass
              </span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className={cn(
                  'h-full rounded-full',
                  passed ? 'bg-success-green' : 'bg-red-500'
                )}
              />
            </div>
          </div>

          {/* Result Message */}
          {passed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-3 p-4 bg-success-green/10 border border-success-green/30 rounded-xl mb-6"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${toTierColor}30` }}
              >
                <Star className="w-5 h-5" style={{ color: toTierColor }} />
              </div>
              <div>
                <p className="font-semibold text-white">
                  Promoted to {getTierName(toTier)}!
                </p>
                <p className="text-sm text-gray-400">+{xpEarned} XP bonus earned</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-6"
            >
              <p className="text-sm text-gray-300">
                Don&apos;t give up! Keep practicing to improve your skills.
                {cooldownMinutes > 0 && (
                  <span className="block mt-1 text-gray-400">
                    You can retry in {cooldownMinutes} minutes.
                  </span>
                )}
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!passed && (
              <Link
                href={`/practice/${topicSlug}`}
                className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Practice More
              </Link>
            )}
            <Link
              href="/dashboard"
              className={cn(
                'flex-1 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2',
                passed
                  ? 'bg-success-green hover:bg-success-green/80 text-black'
                  : 'bg-nebula-purple hover:bg-nebula-purple/80 text-white'
              )}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
