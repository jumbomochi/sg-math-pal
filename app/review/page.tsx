import { prisma } from '@/lib/db';
import { ReviewSession } from './ReviewSession';
import { getReviewPriority } from '@/lib/mastery';
import Link from 'next/link';
import { Brain, Sparkles, ArrowLeft } from 'lucide-react';

async function getReviewData() {
  // Get active student
  const student = await prisma.student.findFirst({
    where: { isActive: true },
  });

  if (!student) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Get due questions from QuestionMastery
  const dueQuestions = await prisma.questionMastery.findMany({
    where: {
      studentId: student.id,
      nextReviewDate: { lte: now },
    },
    include: {
      question: {
        include: { topic: true },
      },
    },
  });

  // Sort by priority (most overdue and difficult first)
  const sortedQuestions = dueQuestions
    .map((mastery) => ({
      ...mastery,
      priority: getReviewPriority(
        mastery.nextReviewDate,
        mastery.easeFactor,
        mastery.repetitions
      ),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 20); // Limit to 20 questions per session

  // Get review stats
  const allMastery = await prisma.questionMastery.findMany({
    where: { studentId: student.id },
    select: {
      repetitions: true,
      easeFactor: true,
      nextReviewDate: true,
      totalAttempts: true,
    },
  });

  const stats = {
    dueToday: dueQuestions.length,
    learned: allMastery.filter((m) => m.repetitions >= 1).length,
    mastered: allMastery.filter(
      (m) => m.repetitions >= 5 && m.easeFactor >= 2.0
    ).length,
    totalInQueue: allMastery.length,
  };

  return {
    student,
    questions: sortedQuestions,
    stats,
  };
}

export default async function ReviewPage() {
  const data = await getReviewData();

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">No profile found</h1>
        <p className="text-muted-foreground mb-8">
          Please select a profile to start reviewing.
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

  const { student, questions, stats } = data;

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Spaced Review</h1>
            <p className="text-sm text-muted-foreground">
              Review questions to strengthen your memory
            </p>
          </div>
        </div>

        <div className="max-w-lg mx-auto bg-space-card/70 backdrop-blur-sm border border-space-border rounded-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success-green/20 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-success-green" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">All caught up!</h2>
          <p className="text-muted-foreground mb-6">
            No questions are due for review right now. Keep practicing to add more questions to your review queue!
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-nebula-purple">{stats.totalInQueue}</p>
              <p className="text-sm text-gray-400">In Queue</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-bold text-success-green">{stats.mastered}</p>
              <p className="text-sm text-gray-400">Mastered</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-nebula-purple hover:bg-nebula-purple/80 rounded-xl text-white font-semibold transition-colors"
          >
            Go Practice
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ReviewSession
      student={student}
      initialQuestions={questions.map((m) => ({
        masteryId: m.id,
        questionId: m.questionId,
        question: m.question,
        repetitions: m.repetitions,
        easeFactor: m.easeFactor,
        interval: m.interval,
        priority: m.priority,
      }))}
      stats={stats}
    />
  );
}
