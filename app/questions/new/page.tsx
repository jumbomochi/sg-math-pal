import { prisma } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { QuestionForm } from '@/components/admin/QuestionForm';

async function getTopics() {
  return prisma.topic.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
  });
}

export default async function NewQuestionPage() {
  const topics = await getTopics();

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
          <h1 className="text-2xl font-bold text-white">Add New Question</h1>
          <p className="text-sm text-muted-foreground">
            Create a new question for the question bank
          </p>
        </div>
      </div>

      {/* Form */}
      <QuestionForm
        topics={topics.map((t) => ({
          id: t.id,
          name: t.name,
          color: t.color,
        }))}
        mode="create"
      />
    </div>
  );
}
