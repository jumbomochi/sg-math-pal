'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight } from 'lucide-react';
import { MathText } from '@/components/math/MathDisplay';
import { TierBadge } from '@/components/game/TierBadge';
import { useSoundOptional } from '@/components/audio/SoundProvider';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  title: string;
  content: string;
  answer: string;
  answerType: string;
  acceptedAnswers?: string;
  tier: number;
}

interface ChallengeCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onSubmit: (answer: string, isCorrect: boolean, timeSpent: number) => void;
  onNext: () => void;
  isLastQuestion: boolean;
}

export function ChallengeCard({
  question,
  questionNumber,
  totalQuestions,
  onSubmit,
  onNext,
  isLastQuestion,
}: ChallengeCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime] = useState(Date.now());
  const sound = useSoundOptional();

  const acceptedAnswers = question.acceptedAnswers
    ? JSON.parse(question.acceptedAnswers) as string[]
    : [];

  const checkAnswer = (answer: string): boolean => {
    const normalizedAnswer = answer.trim().toLowerCase();
    const correctAnswer = question.answer.toLowerCase();

    if (normalizedAnswer === correctAnswer) return true;

    if (acceptedAnswers.some(a => a.toLowerCase() === normalizedAnswer)) return true;

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
    }

    onSubmit(userAnswer, correct, timeSpent);
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
      className="bg-space-card/70 backdrop-blur-sm border border-amber-500/30 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold text-sm">
              {questionNumber}
            </div>
            <span className="text-sm text-amber-400">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
          <TierBadge tier={question.tier as 1 | 2 | 3 | 4 | 5} size="sm" />
        </div>
      </div>

      {/* Question Content */}
      <div className="p-6">
        <h2 className="font-semibold text-white mb-3">{question.title}</h2>
        <div className="text-lg text-gray-100 leading-relaxed">
          <MathText>{question.content}</MathText>
        </div>
      </div>

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
                : 'border-amber-500/30 focus:ring-amber-500/30 focus:border-amber-500/50'
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-3">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className={cn(
                'flex-1 px-6 py-3 rounded-xl font-semibold transition-all',
                userAnswer.trim()
                  ? 'bg-amber-500 hover:bg-amber-600 text-black'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              )}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex-1 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isLastQuestion ? 'Finish Challenge' : 'Next Question'}
              <ChevronRight className="h-5 w-5" />
            </button>
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
                  <p className="font-semibold text-success-green">Correct!</p>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-400">Incorrect</p>
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
    </motion.div>
  );
}
