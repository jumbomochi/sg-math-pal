import { prisma } from '@/lib/db';
import { PlanetMap } from '@/components/dashboard/PlanetMap';
import { XPBar } from '@/components/game/XPBar';
import { Flame, Trophy } from 'lucide-react';

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

  return { student, topics };
}

export default async function DashboardPage() {
  const { student, topics } = await getDashboardData();

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl mx-auto">
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
