import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { PracticeSession } from './PracticeSession';

interface PageProps {
  params: Promise<{ topic: string }>;
}

async function getTopicData(topicSlug: string) {
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

  // Get questions for current tier (or tier 1 if no progress)
  const currentTier = progress?.currentTier ?? 1;
  const questions = await prisma.question.findMany({
    where: {
      topicId: topic.id,
      tier: {
        lte: currentTier, // Include questions up to current tier
      },
    },
    orderBy: [
      { tier: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return {
    topic,
    student,
    progress,
    questions,
  };
}

export default async function PracticePage({ params }: PageProps) {
  const { topic: topicSlug } = await params;
  const data = await getTopicData(topicSlug);

  if (!data) {
    notFound();
  }

  const { topic, student, progress, questions } = data;

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">
          No questions available
        </h1>
        <p className="text-muted-foreground mb-8">
          There are no questions for {topic.name} yet. Check back soon!
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
    <PracticeSession
      topic={topic}
      student={student}
      progress={progress}
      initialQuestions={questions}
    />
  );
}
