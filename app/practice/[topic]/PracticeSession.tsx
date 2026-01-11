'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Target } from 'lucide-react';
import { QuestionCard } from '@/components/practice/QuestionCard';
import { Scratchpad } from '@/components/practice/Scratchpad';
import { XPBar } from '@/components/game/XPBar';
import { TierBadge, getTierConfig } from '@/components/game/TierBadge';
import { BadgeUnlock } from '@/components/game/BadgeUnlock';

interface Topic {
  id: string;
  slug: string;
  name: string;
  icon: string;
  color: string;
}

interface Student {
  id: string;
  name: string;
  totalXp: number;
}

interface TopicProgress {
  id: string;
  currentTier: number;
  tierXp: number;
  tierXpRequired: number;
  questionsAttempted: number;
  questionsCorrect: number;
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
}

interface PracticeSessionProps {
  topic: Topic;
  student: Student;
  progress: TopicProgress | null;
  initialQuestions: Question[];
}

export function PracticeSession({
  topic,
  student,
  progress,
  initialQuestions,
}: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    xpEarned: 0,
    hintsUsed: 0,
  });
  const [tierXp, setTierXp] = useState(progress?.tierXp ?? 0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [pendingBadges, setPendingBadges] = useState<{ type: string; name: string; description: string; icon: string }[]>([]);
  const [currentBadge, setCurrentBadge] = useState<{ type: string; name: string; description: string; icon: string } | null>(null);

  // Shuffle questions for variety
  const [questions] = useState(() => {
    const shuffled = [...initialQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 10); // Limit to 10 questions per session
  });

  const currentQuestion = questions[currentIndex];
  const currentTier = progress?.currentTier ?? 1;
  const tierConfig = getTierConfig(currentTier);
  const tierXpRequired = progress?.tierXpRequired ?? 100;

  const handleSubmit = useCallback(async (
    answer: string,
    isCorrect: boolean,
    hintsUsed: number,
    timeSpent: number
  ) => {
    // Calculate XP earned
    let xpEarned = 0;
    if (isCorrect) {
      xpEarned = currentQuestion.xpValue;
      // Bonus for no hints
      if (hintsUsed === 0) {
        xpEarned = Math.floor(xpEarned * 1.5);
      }
      // Bonus for fast answers (under 30 seconds)
      if (timeSpent < 30) {
        xpEarned = Math.floor(xpEarned * 1.25);
      }
    }

    // Update session stats
    setSessionStats(prev => ({
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      xpEarned: prev.xpEarned + xpEarned,
      hintsUsed: prev.hintsUsed + hintsUsed,
    }));

    // Update tier XP
    if (isCorrect) {
      setTierXp(prev => Math.min(prev + xpEarned, tierXpRequired));
    }

    // Record attempt in database
    try {
      const response = await fetch('/api/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          questionId: currentQuestion.id,
          userAnswer: answer,
          isCorrect,
          hintsUsed,
          timeSpent,
          xpEarned,
        }),
      });

      const data = await response.json();

      // Check for new badges
      if (data.newBadges && data.newBadges.length > 0) {
        // Add to pending badges queue
        setPendingBadges(prev => [...prev, ...data.newBadges]);
        // Show first badge if none currently showing
        if (!currentBadge) {
          setCurrentBadge(data.newBadges[0]);
        }
      }
    } catch (error) {
      console.error('Failed to record attempt:', error);
    }
  }, [currentQuestion, student.id, tierXpRequired, currentBadge]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsSessionComplete(true);
    }
  }, [currentIndex, questions.length]);

  const handleBadgeClose = useCallback(() => {
    // Remove the current badge from pending
    setPendingBadges(prev => {
      const remaining = prev.slice(1);
      // Show next badge if there are more
      if (remaining.length > 0) {
        setCurrentBadge(remaining[0]);
      } else {
        setCurrentBadge(null);
      }
      return remaining;
    });
  }, []);

  if (isSessionComplete) {
    const accuracy = sessionStats.questionsAnswered > 0
      ? Math.round((sessionStats.correctAnswers / sessionStats.questionsAnswered) * 100)
      : 0;

    return (
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto bg-space-card/70 backdrop-blur-sm border border-space-border rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${topic.color}30` }}
          >
            <Trophy className="w-10 h-10" style={{ color: topic.color }} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Session Complete!</h1>
          <p className="text-muted-foreground mb-8">
            Great work on {topic.name}!
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
              <p className="text-3xl font-bold text-white">{sessionStats.questionsAnswered}</p>
              <p className="text-sm text-gray-400">Attempted</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setSessionStats({
                  questionsAnswered: 0,
                  correctAnswers: 0,
                  xpEarned: 0,
                  hintsUsed: 0,
                });
                setIsSessionComplete(false);
              }}
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-colors"
              style={{ backgroundColor: topic.color }}
            >
              Practice Again
            </button>
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
            <h1 className="text-xl font-bold text-white">{topic.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <TierBadge tier={currentTier as 1 | 2 | 3 | 4 | 5} size="sm" />
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
              {sessionStats.correctAnswers}/{sessionStats.questionsAnswered}
            </span>
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="mb-6 max-w-2xl mx-auto">
        <XPBar
          currentXp={tierXp}
          requiredXp={tierXpRequired}
          tierName={`${tierConfig.name} Tier`}
          tierColor={tierConfig.color}
        />
      </div>

      {/* Question Card */}
      <div className="max-w-2xl mx-auto">
        <QuestionCard
          key={currentQuestion.id}
          question={{
            ...currentQuestion,
            acceptedAnswers: currentQuestion.acceptedAnswers ?? undefined,
            hints: currentQuestion.hints ?? undefined,
            solution: currentQuestion.solution ?? undefined,
          }}
          onSubmit={handleSubmit}
          onNext={handleNext}
          onToggleScratchpad={() => setScratchpadOpen(true)}
        />
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
