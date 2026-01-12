import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { QuestionForm } from '@/components/admin/QuestionForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getQuestionData(id: string) {
  const question = await prisma.question.findUnique({
    where: { id },
    include: { topic: true },
  });

  if (!question) return null;

  const topics = await prisma.topic.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });

  return { question, topics };
}

export default async function EditQuestionPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getQuestionData(id);

  if (!data) {
    notFound();
  }

  const { question, topics } = data;

  // Parse JSON fields
  const acceptedAnswers = question.acceptedAnswers
    ? JSON.parse(question.acceptedAnswers).join('\n')
    : '';
  const hints = question.hints ? JSON.parse(question.hints).join('\n') : '';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/questions"
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Question</h1>
          <p className="text-sm text-muted-foreground">{question.title}</p>
        </div>
      </div>

      {/* Form */}
      <QuestionForm
        topics={topics.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
        }))}
        initialData={{
          id: question.id,
          title: question.title,
          content: question.content,
          answer: question.answer,
          answerType: question.answerType,
          acceptedAnswers,
          hints,
          solution: question.solution || '',
          tier: question.tier,
          topicId: question.topicId,
          source: question.source || '',
          sourceYear: question.sourceYear?.toString() || '',
          isChallengeQuestion: question.isChallengeQuestion,
        }}
        mode="edit"
      />
    </div>
  );
}
