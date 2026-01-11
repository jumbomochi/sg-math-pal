import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ChallengeSession } from './ChallengeSession';
import { canUnlockChallenge } from '@/lib/tier-challenge';

interface PageProps {
  params: Promise<{ topic: string }>;
}

async function getChallengeData(topicSlug: string) {
  const topic = await prisma.topic.findUnique({
    where: { slug: topicSlug },
  });

  if (!topic) return null;

  // Get active student
  const student = await prisma.student.findFirst({
    where: { isActive: true },
  });

  if (!student) return null;

  // Get topic progress
  const progress = await prisma.topicProgress.findUnique({
    where: {
      studentId_topicId: {
        studentId: student.id,
        topicId: topic.id,
      },
    },
  });

  if (!progress) return null;

  // Check if challenge is unlocked
  const challengeUnlocked = canUnlockChallenge(progress.currentTier, progress.tierXp);

  return {
    topic,
    student,
    progress,
    challengeUnlocked,
  };
}

export default async function ChallengePage({ params }: PageProps) {
  const { topic: topicSlug } = await params;
  const data = await getChallengeData(topicSlug);

  if (!data) {
    notFound();
  }

  const { topic, student, progress, challengeUnlocked } = data;

  // Redirect if challenge not unlocked
  if (!challengeUnlocked) {
    redirect(`/practice/${topicSlug}`);
  }

  // Check if already at max tier
  if (progress.currentTier >= 5) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          Maximum Tier Reached
        </h1>
        <p className="text-muted-foreground mb-8">
          You&apos;ve already reached Platinum tier in {topic.name}. Amazing work!
        </p>
        <a
          href="/dashboard"
          className="inline-block px-6 py-3 bg-nebula-purple hover:bg-nebula-purple/80 rounded-full text-white font-semibold transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <ChallengeSession
      topic={topic}
      student={student}
      progress={progress}
    />
  );
}
