'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Check, X, ChevronRight, Pencil } from 'lucide-react';
import { MathText } from '@/components/math/MathDisplay';
import { TierBadge, getTierConfig } from '@/components/game/TierBadge';
import { useSoundOptional } from '@/components/audio/SoundProvider';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  title: string;
  content: string;
  answer: string;
  answerType: string;
  acceptedAnswers?: string;
  hints?: string;
  solution?: string;
  tier: number;
  xpValue: number;
}

interface QuestionCardProps {
  question: Question;
  onSubmit: (answer: string, isCorrect: boolean, hintsUsed: number, timeSpent: number) => void;
  onNext: () => void;
  onToggleScratchpad?: () => void;
}

export function QuestionCard({ question, onSubmit, onNext, onToggleScratchpad }: QuestionCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [startTime] = useState(Date.now());
  const sound = useSoundOptional();

  const hints = question.hints ? JSON.parse(question.hints) as string[] : [];
  const acceptedAnswers = question.acceptedAnswers
    ? JSON.parse(question.acceptedAnswers) as string[]
    : [];
  const tierConfig = getTierConfig(question.tier);

  const checkAnswer = (answer: string): boolean => {
    const normalizedAnswer = answer.trim().toLowerCase();
    const correctAnswer = question.answer.toLowerCase();

    // Check exact match
    if (normalizedAnswer === correctAnswer) return true;

    // Check accepted alternatives
    if (acceptedAnswers.some(a => a.toLowerCase() === normalizedAnswer)) return true;

    // For numeric answers, try parsing
    if (question.answerType === 'numeric') {
      const numAnswer = parseFloat(normalizedAnswer);
      const numCorrect = parseFloat(correctAnswer);
      if (!isNaN(numAnswer) && !isNaN(numCorrect)) {
        return Math.abs(numAnswer - numCorrect) < 0.001;
      }
    }

    return false;
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || isSubmitted) return;

    const correct = checkAnswer(userAnswer);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    setIsCorrect(correct);
    setIsSubmitted(true);

    // Play sound effect
    if (sound) {
      sound.playSound(correct ? 'correct' : 'incorrect');
      if (correct) {
        setTimeout(() => sound.playSound('xpGain'), 300);
      }
    }

    onSubmit(userAnswer, correct, hintsRevealed, timeSpent);
  };

  const handleRevealHint = () => {
    if (hintsRevealed < hints.length) {
      setHintsRevealed(prev => prev + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-space-card/70 backdrop-blur-sm border border-space-border rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-space-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TierBadge tier={question.tier as 1 | 2 | 3 | 4 | 5} size="sm" />
          <h2 className="font-semibold text-white">{question.title}</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="text-star-gold">+{question.xpValue} XP</span>
        </div>
      </div>

      {/* Question Content */}
      <div className="p-6">
        <div className="text-lg text-gray-100 leading-relaxed">
          <MathText>{question.content}</MathText>
        </div>
      </div>

      {/* Hints Section */}
      <AnimatePresence>
        {hintsRevealed > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 pb-4"
          >
            <div className="space-y-2">
              {hints.slice(0, hintsRevealed).map((hint, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                >
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-yellow-200">
                    <MathText>{hint}</MathText>
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer Input */}
      <div className="px-6 pb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitted}
            placeholder="Enter your answer..."
            className={cn(
              'flex-1 px-4 py-3 rounded-xl bg-white/5 border transition-colors',
              'text-white placeholder:text-gray-500',
              'focus:outline-none focus:ring-2',
              isSubmitted
                ? isCorrect
                  ? 'border-success-green/50 focus:ring-success-green/30'
                  : 'border-red-500/50 focus:ring-red-500/30'
                : 'border-white/10 focus:ring-nebula-purple/30 focus:border-nebula-purple/50'
            )}
          />
          {onToggleScratchpad && (
            <button
              onClick={onToggleScratchpad}
              className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Open Scratchpad"
            >
              <Pencil className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-3">
          {!isSubmitted ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
                className={cn(
                  'flex-1 px-6 py-3 rounded-xl font-semibold transition-all',
                  userAnswer.trim()
                    ? 'bg-nebula-purple hover:bg-nebula-purple/80 text-white'
                    : 'bg-white/10 text-gray-500 cursor-not-allowed'
                )}
              >
                Submit Answer
              </button>
              {hints.length > 0 && hintsRevealed < hints.length && (
                <button
                  onClick={handleRevealHint}
                  className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                >
                  <Lightbulb className="h-5 w-5" />
                </button>
              )}
            </>
          ) : (
            <>
              {question.solution && (
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors"
                >
                  {showSolution ? 'Hide Solution' : 'View Solution'}
                </button>
              )}
              <button
                onClick={onNext}
                className="flex-1 px-6 py-3 rounded-xl bg-nebula-purple hover:bg-nebula-purple/80 text-white font-semibold transition-all flex items-center justify-center gap-2"
              >
                Next Question
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Result Feedback */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={cn(
              'px-6 py-4 border-t',
              isCorrect
                ? 'bg-success-green/10 border-success-green/30'
                : 'bg-red-500/10 border-red-500/30'
            )}
          >
            <div className="flex items-center gap-3">
              {isCorrect ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-success-green/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-success-green" />
                  </div>
                  <div>
                    <p className="font-semibold text-success-green">Correct!</p>
                    <p className="text-sm text-gray-400">
                      +{question.xpValue} XP earned
                      {hintsRevealed === 0 && ' (Perfect!)'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-400">Not quite!</p>
                    <p className="text-sm text-gray-400">
                      The correct answer is: <span className="text-white">{question.answer}</span>
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solution */}
      <AnimatePresence>
        {showSolution && question.solution && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-4 bg-white/5 border-t border-space-border"
          >
            <h3 className="font-semibold text-white mb-2">Solution:</h3>
            <div className="text-gray-300 whitespace-pre-wrap">
              <MathText>{question.solution}</MathText>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
