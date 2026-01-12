import { prisma } from '@/lib/db';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  Flame,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react';
import { getTierConfig } from '@/lib/tiers';

async function getStatsData() {
  // Get active student with all related data
  const student = await prisma.student.findFirst({
    where: { isActive: true },
    include: {
      topicProgress: {
        include: {
          topic: true,
        },
      },
      badges: {
        orderBy: { earnedAt: 'desc' },
      },
      questionAttempts: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!student) return null;

  // Calculate aggregate stats
  const totalAttempts = await prisma.questionAttempt.count({
    where: { studentId: student.id },
  });

  const correctAttempts = await prisma.questionAttempt.count({
    where: { studentId: student.id, isCorrect: true },
  });

  const totalTimeSpent = await prisma.questionAttempt.aggregate({
    where: { studentId: student.id },
    _sum: { timeSpent: true },
  });

  // Get attempts by day for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentAttempts = await prisma.questionAttempt.findMany({
    where: {
      studentId: student.id,
      createdAt: { gte: sevenDaysAgo },
    },
    select: {
      createdAt: true,
      isCorrect: true,
    },
  });

  // Group by day
  const activityByDay: Record<string, { total: number; correct: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    activityByDay[key] = { total: 0, correct: 0 };
  }

  recentAttempts.forEach((attempt) => {
    const key = attempt.createdAt.toISOString().split('T')[0];
    if (activityByDay[key]) {
      activityByDay[key].total++;
      if (attempt.isCorrect) {
        activityByDay[key].correct++;
      }
    }
  });

  // Get mastery stats
  const masteryStats = await prisma.questionMastery.aggregate({
    where: { studentId: student.id },
    _count: true,
    _avg: { easeFactor: true },
  });

  const masteredCount = await prisma.questionMastery.count({
    where: {
      studentId: student.id,
      repetitions: { gte: 5 },
      easeFactor: { gte: 2.0 },
    },
  });

  return {
    student,
    stats: {
      totalAttempts,
      correctAttempts,
      accuracy: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      totalTimeMinutes: Math.round((totalTimeSpent._sum.timeSpent || 0) / 60),
      questionsInQueue: masteryStats._count,
      questionsMastered: masteredCount,
    },
    activityByDay,
  };
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export default async function StatsPage() {
  const data = await getStatsData();

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">No profile found</h1>
        <p className="text-muted-foreground mb-8">
          Please select a profile to view stats.
        </p>
        <Link
          href="/profiles"
          className="inline-block px-6 py-3 bg-nebula-purple hover:bg-nebula-purple/80 rounded-full text-white font-semibold transition-colors"
        >
          Select Profile
        </Link>
      </div>
    );
  }

  const { student, stats, activityByDay } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Progress Report</h1>
          <p className="text-sm text-muted-foreground">
            {student.name}&apos;s learning journey
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-star-gold" />
            <span className="text-sm text-gray-400">Total XP</span>
          </div>
          <p className="text-2xl font-bold text-star-gold">
            {student.totalXp.toLocaleString()}
          </p>
        </div>

        <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-comet-orange" />
            <span className="text-sm text-gray-400">Best Streak</span>
          </div>
          <p className="text-2xl font-bold text-comet-orange">
            {student.bestStreak} <span className="text-sm font-normal">days</span>
          </p>
        </div>

        <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-nebula-purple" />
            <span className="text-sm text-gray-400">Time Practiced</span>
          </div>
          <p className="text-2xl font-bold text-nebula-purple">
            {formatTime(stats.totalTimeMinutes)}
          </p>
        </div>

        <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-success-green" />
            <span className="text-sm text-gray-400">Accuracy</span>
          </div>
          <p className="text-2xl font-bold text-success-green">
            {stats.accuracy}%
          </p>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Last 7 Days Activity</h2>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {Object.entries(activityByDay).map(([date, data]) => {
            const maxHeight = 100;
            const height = data.total > 0 ? Math.max(20, (data.total / 20) * maxHeight) : 4;
            const correctPercent = data.total > 0 ? (data.correct / data.total) * 100 : 0;

            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <div
                    className="w-full max-w-[40px] rounded-t-lg transition-all relative overflow-hidden"
                    style={{
                      height: `${height}px`,
                      backgroundColor: data.total > 0 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      className="absolute bottom-0 w-full bg-nebula-purple rounded-t-lg transition-all"
                      style={{ height: `${correctPercent}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatDate(date)}</span>
                {data.total > 0 && (
                  <span className="text-xs text-gray-400">{data.total}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-nebula-purple" />
            <span>Correct</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-nebula-purple/30" />
            <span>Attempted</span>
          </div>
        </div>
      </div>

      {/* Topic Progress */}
      <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">Topic Progress</h2>
        </div>
        <div className="space-y-4">
          {student.topicProgress.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No topics started yet. Start practicing to see progress!
            </p>
          ) : (
            student.topicProgress.map((progress) => {
              const tierConfig = getTierConfig(progress.currentTier as 1 | 2 | 3 | 4 | 5);
              const accuracy = progress.questionsAttempted > 0
                ? Math.round((progress.questionsCorrect / progress.questionsAttempted) * 100)
                : 0;
              const xpProgress = progress.tierXpRequired > 0
                ? Math.round((progress.tierXp / progress.tierXpRequired) * 100)
                : 0;

              return (
                <div
                  key={progress.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-white/5"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${progress.topic.color}20` }}
                  >
                    {progress.topic.icon === 'shapes' && '📐'}
                    {progress.topic.icon === 'pie-chart' && '🥧'}
                    {progress.topic.icon === 'hash' && '🔢'}
                    {progress.topic.icon === 'calculator' && '🧮'}
                    {progress.topic.icon === 'percent' && '💯'}
                    {progress.topic.icon === 'book-open' && '📖'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white">{progress.topic.name}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${tierConfig.color}20`,
                          color: tierConfig.color,
                        }}
                      >
                        {tierConfig.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{progress.questionsAttempted} attempted</span>
                      <span>{accuracy}% accuracy</span>
                      <span>{progress.perfectAnswers} perfect</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${xpProgress}%`,
                          backgroundColor: tierConfig.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">
            Badges Earned ({student.badges.length})
          </h2>
        </div>
        {student.badges.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            No badges earned yet. Keep practicing to unlock achievements!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {student.badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
              >
                <span className="text-2xl">
                  {badge.icon === 'zap' && '⚡'}
                  {badge.icon === 'flame' && '🔥'}
                  {badge.icon === 'star' && '⭐'}
                  {badge.icon === 'trophy' && '🏆'}
                  {badge.icon === 'target' && '🎯'}
                  {badge.icon === 'rocket' && '🚀'}
                  {badge.icon === 'brain' && '🧠'}
                  {badge.icon === 'award' && '🏅'}
                  {!['zap', 'flame', 'star', 'trophy', 'target', 'rocket', 'brain', 'award'].includes(badge.icon) && '🌟'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{badge.name}</p>
                  <p className="text-xs text-gray-400 truncate">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          {stats.totalAttempts} questions attempted · {stats.questionsMastered} mastered ·
          Member since {student.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
