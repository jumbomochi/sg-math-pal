import { prisma } from '@/lib/db';
import { PlanetMap } from '@/components/dashboard/PlanetMap';
import { XPBar } from '@/components/game/XPBar';
import { Flame, Trophy, Brain } from 'lucide-react';
import Link from 'next/link';

async function getDashboardData() {
  // Get active student
  const student = await prisma.student.findFirst({
    where: { isActive: true },
    include: {
      topicProgress: true,
      badges: {
        orderBy: { earnedAt: 'desc' },
        take: 5,
      },
    },
  });

  // Get all active topics
  const topics = await prisma.topic.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  // Get review stats for active student
  let reviewStats = { dueToday: 0, mastered: 0 };
  if (student) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const dueCount = await prisma.questionMastery.count({
      where: {
        studentId: student.id,
        nextReviewDate: { lte: now },
      },
    });

    const masteredCount = await prisma.questionMastery.count({
      where: {
        studentId: student.id,
        repetitions: { gte: 5 },
        easeFactor: { gte: 2.0 },
      },
    });

    reviewStats = { dueToday: dueCount, mastered: masteredCount };
  }

  return { student, topics, reviewStats };
}

export default async function DashboardPage() {
  const { student, topics, reviewStats } = await getDashboardData();

  if (!student) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Welcome to SG Math Pal!</h1>
        <p className="text-muted-foreground mb-8">
          Create a profile to start your space math adventure.
        </p>
        <a
          href="/profiles"
          className="inline-block px-6 py-3 bg-nebula-purple hover:bg-nebula-purple/80 rounded-full text-white font-semibold transition-colors"
        >
          Create Profile
        </a>
      </div>
    );
  }

  const totalXpToNextLevel = 500; // Simplified level calculation

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome section */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {student.name}!
        </h1>
        <p className="text-muted-foreground">
          Ready to explore the math galaxy?
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-5xl mx-auto">
        {/* Total XP */}
        <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-6 h-6 text-star-gold" />
            <span className="text-gray-400 text-sm">Total XP</span>
          </div>
          <p className="text-3xl font-bold text-star-gold">
            {student.totalXp.toLocaleString()}
          </p>
          <div className="mt-3">
            <XPBar
              currentXp={student.totalXp % totalXpToNextLevel}
              requiredXp={totalXpToNextLevel}
              tierColor="#fbbf24"
              showLabel={false}
              size="sm"
            />
          </div>
        </div>

        {/* Streak */}
        <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Flame className="w-6 h-6 text-comet-orange" />
            <span className="text-gray-400 text-sm">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-comet-orange">
            {student.currentStreak} <span className="text-lg font-normal">days</span>
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Best: {student.bestStreak} days
          </p>
        </div>

        {/* Badges */}
        <div className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏅</span>
            <span className="text-gray-400 text-sm">Badges Earned</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {student.badges.length}
          </p>
          <div className="mt-2 flex gap-1">
            {student.badges.slice(0, 3).map((badge) => (
              <span
                key={badge.id}
                title={badge.name}
                className="text-lg"
              >
                🌟
              </span>
            ))}
          </div>
        </div>

        {/* Review */}
        <Link
          href="/review"
          className="bg-space-card/50 backdrop-blur-sm border border-space-border rounded-xl p-6 hover:border-nebula-purple/50 transition-colors group"
        >
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-6 h-6 text-nebula-purple" />
            <span className="text-gray-400 text-sm">Spaced Review</span>
          </div>
          {reviewStats.dueToday > 0 ? (
            <>
              <p className="text-3xl font-bold text-nebula-purple">
                {reviewStats.dueToday}
              </p>
              <p className="mt-2 text-sm text-gray-400 group-hover:text-white transition-colors">
                questions due today →
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-success-green">
                ✓
              </p>
              <p className="mt-2 text-sm text-gray-400">
                All caught up!
              </p>
            </>
          )}
        </Link>
      </div>

      {/* Planet Map */}
      <PlanetMap
        topics={topics}
        progress={student.topicProgress.map(p => ({
          topicId: p.topicId,
          currentTier: p.currentTier,
          tierXp: p.tierXp,
          tierXpRequired: p.tierXpRequired,
        }))}
      />
    </div>
  );
}
