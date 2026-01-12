import { prisma } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, Plus, Search } from 'lucide-react';
import { QuestionList } from './QuestionList';

async function getQuestionsData() {
  const questions = await prisma.question.findMany({
    include: {
      topic: true,
    },
    orderBy: [
      { topic: { orderIndex: 'asc' } },
      { tier: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  const topics = await prisma.topic.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  return { questions, topics };
}

export default async function QuestionsPage() {
  const { questions, topics } = await getQuestionsData();

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
            <h1 className="text-2xl font-bold text-white">Question Bank</h1>
            <p className="text-sm text-muted-foreground">
              {questions.length} questions across {topics.length} topics
            </p>
          </div>
        </div>

        <Link
          href="/questions/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nebula-purple hover:bg-nebula-purple/80 text-white font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </Link>
      </div>

      {/* Question List with Client-Side Filtering */}
      <QuestionList
        questions={questions.map((q) => ({
          id: q.id,
          title: q.title,
          content: q.content,
          answer: q.answer,
          tier: q.tier,
          topicId: q.topicId,
          topicName: q.topic.name,
          topicColor: q.topic.color,
          source: q.source,
          sourceYear: q.sourceYear,
          isChallengeQuestion: q.isChallengeQuestion,
          createdAt: q.createdAt.toISOString(),
        }))}
        topics={topics.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
        }))}
      />
    </div>
  );
}
