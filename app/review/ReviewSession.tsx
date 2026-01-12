'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Trophy, Target, RefreshCw } from 'lucide-react';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { Scratchpad } from '@/components/practice/Scratchpad';
import { QualityRating } from '@/components/review/QualityRating';
import { BadgeUnlock } from '@/components/game/BadgeUnlock';
import { getMasteryLevel, Quality } from '@/lib/mastery';
import { useSound } from '@/components/audio/SoundProvider';

interface Topic {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
}

interface Question {
  id: string;
  title: string;
  content: string;
  answer: string;
  answerType: string;
  acceptedAnswers: string | null;
  hints: string | null;
  solution: string | null;
  tier: number;
  xpValue: number;
  topic: Topic;
}

interface ReviewQuestion {
  masteryId: string;
  questionId: string;
  question: Question;
  repetitions: number;
  easeFactor: number;
  interval: number;
  priority: number;
}

interface Student {
  id: string;
  name: string;
  totalXp: number;
}

interface Stats {
  dueToday: number;
  learned: number;
  mastered: number;
  totalInQueue: number;
}

interface ReviewSessionProps {
  student: Student;
  initialQuestions: ReviewQuestion[];
  stats: Stats;
}

export function ReviewSession({
  student,
  initialQuestions,
  stats,
}: ReviewSessionProps) {
  const { playSound } = useSound();
  const [questions] = useState(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    questionsReviewed: 0,
    correctAnswers: 0,
    xpEarned: 0,
  });
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [pendingBadges, setPendingBadges] = useState<{ type: string; name: string; description: string; icon: string }[]>([]);
  const [currentBadge, setCurrentBadge] = useState<{ type: string; name: string; description: string; icon: string } | null>(null);

  // State for quality rating flow
  const [awaitingQuality, setAwaitingQuality] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{
    answer: string;
    isCorrect: boolean;
    hintsUsed: number;
    timeSpent: number;
  } | null>(null);

  const currentQuestion = questions[currentIndex];
  const masteryLevel = currentQuestion
    ? getMasteryLevel(currentQuestion.repetitions, currentQuestion.easeFactor)
    : null;

  const handleSubmit = useCallback(async (
    answer: string,
    isCorrect: boolean,
    hintsUsed: number,
    timeSpent: number
  ) => {
    // Store answer for quality rating
    setLastAnswer({ answer, isCorrect, hintsUsed, timeSpent });

    // Only show quality rating for correct answers
    if (isCorrect) {
      setAwaitingQuality(true);
      playSound('correct');
    } else {
      // For incorrect answers, submit immediately with quality 1
      await submitReview(answer, isCorrect, hintsUsed, timeSpent, 1);
      playSound('incorrect');
    }
  }, [playSound]);

  const submitReview = async (
    answer: string,
    isCorrect: boolean,
    hintsUsed: number,
    timeSpent: number,
    quality: Quality
  ) => {
    // Calculate XP
    let xpEarned = 0;
    if (isCorrect) {
      xpEarned = Math.round(10 * (quality === 3 ? 1.2 : quality === 1 ? 0.8 : 1));
    }

    // Update session stats
    setSessionStats(prev => ({
      questionsReviewed: prev.questionsReviewed + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      xpEarned: prev.xpEarned + xpEarned,
    }));

    // Submit to API
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          questionId: currentQuestion.questionId,
          userAnswer: answer,
          isCorrect,
          quality,
          hintsUsed,
          timeSpent,
        }),
      });

      const data = await response.json();

      // Check for new badges
      if (data.newBadges && data.newBadges.length > 0) {
        setPendingBadges(prev => [...prev, ...data.newBadges]);
        if (!currentBadge) {
          setCurrentBadge(data.newBadges[0]);
        }
        playSound('badgeUnlock');
      }

      // Play XP sound
      if (xpEarned > 0) {
        playSound('xpGain');
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }

    // Reset quality state
    setAwaitingQuality(false);
    setLastAnswer(null);
  };

  const handleQualitySelect = useCallback(async (quality: Quality) => {
    if (lastAnswer) {
      await submitReview(
        lastAnswer.answer,
        lastAnswer.isCorrect,
        lastAnswer.hintsUsed,
        lastAnswer.timeSpent,
        quality
      );
    }
  }, [lastAnswer, student.id, currentQuestion?.questionId]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsSessionComplete(true);
    }
  }, [currentIndex, questions.length]);

  const handleBadgeClose = useCallback(() => {
    setPendingBadges(prev => {
      const remaining = prev.slice(1);
      if (remaining.length > 0) {
        setCurrentBadge(remaining[0]);
      } else {
        setCurrentBadge(null);
      }
      return remaining;
    });
  }, []);

  if (isSessionComplete) {
    const accuracy = sessionStats.questionsReviewed > 0
      ? Math.round((sessionStats.correctAnswers / sessionStats.questionsReviewed) * 100)
      : 0;

    return (
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto bg-space-card/70 backdrop-blur-sm border border-space-border rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-nebula-purple/20 flex items-center justify-center">
            <Brain className="w-10 h-10 text-nebula-purple" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Review Complete!</h1>
          <p className="text-muted-foreground mb-8">
            Great job strengthening your memory!
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-star-gold">{sessionStats.xpEarned}</p>
              <p className="text-sm text-gray-400">XP Earned</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-success-green">{accuracy}%</p>
              <p className="text-sm text-gray-400">Accuracy</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-white">{sessionStats.correctAnswers}</p>
              <p className="text-sm text-gray-400">Correct</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-3xl font-bold text-white">{sessionStats.questionsReviewed}</p>
              <p className="text-sm text-gray-400">Reviewed</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/review"
              className="flex-1 px-6 py-3 rounded-xl bg-nebula-purple hover:bg-nebula-purple/80 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Review More
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-nebula-purple" />
              Spaced Review
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${masteryLevel?.color}20`,
                  color: masteryLevel?.color,
                }}
              >
                {masteryLevel?.label}
              </span>
              <span className="text-sm text-gray-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-400">Session XP</p>
            <p className="text-lg font-bold text-star-gold">+{sessionStats.xpEarned}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
            <Target className="h-4 w-4 text-success-green" />
            <span className="text-sm text-gray-300">
              {sessionStats.correctAnswers}/{sessionStats.questionsReviewed}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mb-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between text-sm bg-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Due today:</span>
            <span className="font-bold text-white">{stats.dueToday - sessionStats.questionsReviewed}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Learned:</span>
            <span className="font-bold text-nebula-purple">{stats.learned}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Mastered:</span>
            <span className="font-bold text-success-green">{stats.mastered}</span>
          </div>
        </div>
      </div>

      {/* Topic Tag */}
      <div className="max-w-2xl mx-auto mb-4">
        <span
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            backgroundColor: `${currentQuestion.question.topic.color}20`,
            color: currentQuestion.question.topic.color,
          }}
        >
          {currentQuestion.question.topic.name}
        </span>
      </div>

      {/* Question Card or Quality Rating */}
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {awaitingQuality ? (
            <motion.div
              key="quality"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <QualityRating
                onSelect={handleQualitySelect}
                onNext={handleNext}
              />
            </motion.div>
          ) : (
            <motion.div
              key="question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <QuestionCard
                question={{
                  ...currentQuestion.question,
                  acceptedAnswers: currentQuestion.question.acceptedAnswers ?? undefined,
                  hints: currentQuestion.question.hints ?? undefined,
                  solution: currentQuestion.question.solution ?? undefined,
                }}
                onSubmit={handleSubmit}
                onNext={handleNext}
                onToggleScratchpad={() => setScratchpadOpen(true)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {questions.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex
                ? 'bg-nebula-purple'
                : index < currentIndex
                ? 'bg-success-green'
                : 'bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Scratchpad */}
      <Scratchpad
        isOpen={scratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
      />

      {/* Badge Unlock Modal */}
      <BadgeUnlock badge={currentBadge} onClose={handleBadgeClose} />
    </div>
  );
}
