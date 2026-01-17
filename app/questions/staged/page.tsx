import { Suspense } from 'react';
import { prisma } from '@/lib/db';
import { StagedQuestionList } from './StagedQuestionList';

export const dynamic = 'force-dynamic';

async function getStats() {
  const stats = await prisma.stagedQuestion.groupBy({
    by: ['status'],
    _count: true,
  });

  const total = await prisma.stagedQuestion.count();

  return {
    pending: stats.find(s => s.status === 'pending')?._count || 0,
    approved: stats.find(s => s.status === 'approved')?._count || 0,
    rejected: stats.find(s => s.status === 'rejected')?._count || 0,
    needs_edit: stats.find(s => s.status === 'needs_edit')?._count || 0,
    total,
  };
}

async function getSourceFiles() {
  const files = await prisma.stagedQuestion.findMany({
    select: { sourceFile: true },
    distinct: ['sourceFile'],
    orderBy: { sourceFile: 'asc' },
  });
  return files.map(f => f.sourceFile);
}

export default async function StagedQuestionsPage() {
  const [stats, sourceFiles] = await Promise.all([getStats(), getSourceFiles()]);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-white">Staged Questions</h1>
      <p className="text-gray-400 mb-6">Review and approve questions extracted from PDFs</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Pending" value={stats.pending} color="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" />
        <StatCard label="Needs Edit" value={stats.needs_edit} color="bg-orange-500/20 text-orange-300 border border-orange-500/30" />
        <StatCard label="Approved" value={stats.approved} color="bg-green-500/20 text-green-300 border border-green-500/30" />
        <StatCard label="Rejected" value={stats.rejected} color="bg-red-500/20 text-red-300 border border-red-500/30" />
        <StatCard label="Total" value={stats.total} color="bg-blue-500/20 text-blue-300 border border-blue-500/30" />
      </div>

      <Suspense fallback={<div className="text-gray-300">Loading questions...</div>}>
        <StagedQuestionList sourceFiles={sourceFiles} />
      </Suspense>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}
