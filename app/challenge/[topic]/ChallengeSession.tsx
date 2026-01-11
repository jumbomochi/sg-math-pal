'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Trophy, AlertTriangle } from 'lucide-react';
import { ChallengeCard } from '@/components/challenge/ChallengeCard';
import { ChallengeResult } from '@/components/challenge/ChallengeResult';
import { TierBadge } from '@/components/game/TierBadge';
import {
  getTierName,
  formatTimeRemaining,
  getChallengeConfig,
} from '@/lib/tier-challenge';

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
}

interface ChallengeQuestion {
  id: string;
  questionId: string;
  orderIndex: number;
  userAnswer: string | null;
  isCorrect: boolean | null;
  question: {
    id: string;
    title: string;
    content: string;
    answer: string;
    answerType: string;
    acceptedAnswers: string | null;
    tier: number;
  };
}

interface Challenge {
  id: string;
  fromTier: number;
  toTier: number;
  totalQuestions: number;
  requiredCorrect: number;
  timeLimit: number | null;
  correctAnswers: number;
  questions: ChallengeQuestion[];
}

interface ChallengeSessionProps {
  topic: Topic;
  student: Student;
  progress: TopicProgress;
}

type SessionState = 'loading' | 'ready' | 'in_progress' | 'completing' | 'completed' | 'error' | 'cooldown';

interface ChallengeResultData {
  passed: boolean;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  requiredCorrect: number;
  xpEarned: number;
  fromTier: number;
  toTier: number;
  fromTierName: string;
  toTierName: string;
  topicName: string;
  cooldownMinutes: number;
}

export function ChallengeSession({
  topic,
  student,
  progress,
}: ChallengeSessionProps) {
  const [state, setState] = useState<SessionState>('loading');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<ChallengeResultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownMinutes, setCooldownMinutes] = useState(0);

  const fromTier = progress.currentTier;
  const toTier = fromTier + 1;
  const config = getChallengeConfig(fromTier, toTier);

  // Start or resume challenge
  useEffect(() => {
    async function initChallenge() {
      try {
        const response = await fetch('/api/challenge/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: student.id,
            topicId: topic.id,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            // Cooldown
            setState('cooldown');
            setCooldownMinutes(data.cooldownMinutes || 60);
            return;
          }
          throw new Error(data.error || 'Failed to start challenge');
        }

        setChallenge(data.challenge);

        // Find first unanswered question
        const unansweredIndex = data.challenge.questions.findIndex(
          (q: ChallengeQuestion) => q.userAnswer === null
        );
        setCurrentIndex(unansweredIndex >= 0 ? unansweredIndex : 0);

        // Set timer if applicable
        if (data.challenge.timeLimit) {
          // Calculate remaining time based on elapsed time
          const startTime = new Date(data.challenge.startedAt).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          const remaining = Math.max(0, data.challenge.timeLimit - elapsed);
          setTimeRemaining(remaining);
        }

        setState(data.resuming ? 'in_progress' : 'ready');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setState('error');
      }
    }

    initChallenge();
  }, [student.id, topic.id]);

  // Timer countdown
  useEffect(() => {
    if (state !== 'in_progress' || timeRemaining === null) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          // Time's up - complete challenge
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state, timeRemaining]);

  const handleStart = () => {
    setState('in_progress');
  };

  const handleSubmitAnswer = useCallback(async (
    answer: string,
    isCorrect: boolean,
    timeSpent: number
  ) => {
    if (!challenge) return;

    const currentQuestion = challenge.questions[currentIndex];

    try {
      await fetch('/api/challenge/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: challenge.id,
          challengeQuestionId: currentQuestion.id,
          userAnswer: answer,
          isCorrect,
          timeSpent,
        }),
      });

      // Update local state
      setChallenge(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
          questions: prev.questions.map((q, i) =>
            i === currentIndex
              ? { ...q, userAnswer: answer, isCorrect }
              : q
          ),
        };
      });
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  }, [challenge, currentIndex]);

  const handleNext = useCallback(() => {
    if (!challenge) return;

    if (currentIndex < challenge.questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  }, [challenge, currentIndex]);

  const handleComplete = async () => {
    if (!challenge) return;

    setState('completing');

    try {
      const response = await fetch('/api/challenge/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete challenge');
      }

      setResult(data.result);
      setState('completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete challenge');
      setState('error');
    }
  };

  // Loading state
  if (state === 'loading') {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400">Loading challenge...</p>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Challenge Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Cooldown state
  if (state === 'cooldown') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl p-8">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Challenge on Cooldown</h1>
          <p className="text-gray-400 mb-6">
            You can retry this challenge in {cooldownMinutes} minutes.
            Keep practicing in the meantime!
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href={`/practice/${topic.slug}`}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 rounded-xl text-black font-semibold transition-colors"
            >
              Practice More
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Completed state
  if (state === 'completed' && result) {
    return (
      <div className="container mx-auto px-4 py-12">
        <ChallengeResult
          passed={result.passed}
          correctAnswers={result.correctAnswers}
          totalQuestions={result.totalQuestions}
          requiredCorrect={result.requiredCorrect}
          xpEarned={result.xpEarned}
          fromTier={result.fromTier}
          toTier={result.toTier}
          topicName={result.topicName}
          topicSlug={topic.slug}
          cooldownMinutes={result.cooldownMinutes}
        />
      </div>
    );
  }

  // Ready state - show challenge intro
  if (state === 'ready' && challenge && config) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-2 border-amber-500/50 rounded-2xl p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-amber-500" />
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">
              Tier Challenge
            </h1>
            <p className="text-gray-400 mb-6">
              {topic.name}: {getTierName(fromTier)} → {getTierName(toTier)}
            </p>

            <div className="flex justify-center gap-4 mb-8">
              <TierBadge tier={fromTier as 1 | 2 | 3 | 4 | 5} size="lg" />
              <span className="text-gray-400 text-2xl self-center">→</span>
              <TierBadge tier={toTier as 1 | 2 | 3 | 4 | 5} size="lg" />
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-semibold text-white mb-3">Challenge Rules:</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  Answer {config.requiredCorrect} of {config.totalQuestions} questions correctly
                </li>
                {config.timeLimit && (
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    Time limit: {Math.floor(config.timeLimit / 60)} minutes
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  No hints allowed during challenge
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                  Earn +{config.passXpBonus} XP bonus on success
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard"
                className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              >
                Back
              </Link>
              <button
                onClick={handleStart}
                className="flex-1 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-colors"
              >
                Start Challenge
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // In progress state
  if ((state === 'in_progress' || state === 'completing') && challenge) {
    const currentQuestion = challenge.questions[currentIndex];
    const answeredCount = challenge.questions.filter(q => q.userAnswer !== null).length;

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
              <h1 className="text-xl font-bold text-white">
                Tier Challenge: {topic.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <TierBadge tier={fromTier as 1 | 2 | 3 | 4 | 5} size="sm" />
                <span className="text-sm text-gray-400">→</span>
                <TierBadge tier={toTier as 1 | 2 | 3 | 4 | 5} size="sm" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                timeRemaining < 60 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="font-mono font-bold">
                  {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            )}

            {/* Score */}
            <div className="text-right">
              <p className="text-sm text-gray-400">Correct</p>
              <p className="text-lg font-bold text-white">
                {challenge.correctAnswers} / {challenge.requiredCorrect} needed
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 max-w-2xl mx-auto">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="text-gray-400">
              {answeredCount} of {challenge.totalQuestions} answered
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(answeredCount / challenge.totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="max-w-2xl mx-auto">
          {state === 'completing' ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400">Calculating results...</p>
            </div>
          ) : (
            <ChallengeCard
              key={currentQuestion.id}
              question={{
                ...currentQuestion.question,
                acceptedAnswers: currentQuestion.question.acceptedAnswers ?? undefined,
              }}
              questionNumber={currentIndex + 1}
              totalQuestions={challenge.totalQuestions}
              onSubmit={handleSubmitAnswer}
              onNext={handleNext}
              isLastQuestion={currentIndex === challenge.questions.length - 1}
            />
          )}
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {challenge.questions.map((q, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-amber-500'
                  : q.userAnswer !== null
                  ? q.isCorrect
                    ? 'bg-success-green'
                    : 'bg-red-500'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
