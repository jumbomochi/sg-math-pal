'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Quality, getQualityOptions } from '@/lib/mastery';
import { useSound } from '@/components/audio/SoundProvider';

interface QualityRatingProps {
  onSelect: (quality: Quality) => void;
  onNext: () => void;
}

export function QualityRating({ onSelect, onNext }: QualityRatingProps) {
  const { playSound } = useSound();
  const options = getQualityOptions();

  const handleSelect = (quality: Quality) => {
    playSound('click');
    onSelect(quality);
    // Auto-advance after selection
    setTimeout(() => {
      onNext();
    }, 300);
  };

  return (
    <div className="bg-space-card/70 backdrop-blur-sm border border-space-border rounded-2xl p-8">
      {/* Success Message */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-success-green/20 flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-success-green" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Correct!</h2>
        <p className="text-muted-foreground">
          How did that feel?
        </p>
      </div>

      {/* Quality Options */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {options.map((option, index) => (
          <motion.button
            key={option.quality}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSelect(option.quality)}
            className="flex flex-col items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border-2 border-transparent hover:border-nebula-purple/50 transition-all group"
          >
            <span className="text-4xl mb-2">{option.emoji}</span>
            <span className="font-bold text-white mb-1">{option.label}</span>
            <span className="text-xs text-gray-400 text-center">{option.description}</span>
          </motion.button>
        ))}
      </div>

      {/* Info Text */}
      <p className="text-center text-xs text-gray-500">
        Your rating helps us schedule the best time to review this question again
      </p>
    </div>
  );
}
