import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const bulkActionSchema = z.object({
  action: z.enum(['approve', 'reject', 'delete']),
  ids: z.array(z.string()).min(1).max(100),
  defaultTopic: z.string().optional(),
  defaultTier: z.number().min(1).max(5).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids, defaultTopic, defaultTier } = bulkActionSchema.parse(body);

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    if (action === 'reject') {
      const result = await prisma.stagedQuestion.updateMany({
        where: { id: { in: ids } },
        data: { status: 'rejected', reviewedAt: new Date() },
      });
      processed = result.count;
    } else if (action === 'delete') {
      const result = await prisma.stagedQuestion.deleteMany({
        where: { id: { in: ids } },
      });
      processed = result.count;
    } else if (action === 'approve') {
      for (const id of ids) {
        try {
          const staged = await prisma.stagedQuestion.findUnique({ where: { id } });
          if (!staged || staged.status === 'approved') continue;

          const topic = defaultTopic || staged.suggestedTopic || staged.finalTopic;
          const tier = defaultTier || staged.suggestedTier || staged.finalTier;

          if (!topic || !tier) {
            errors.push(`${id}: Missing topic or tier`);
            failed++;
            continue;
          }

          const topicRecord = await prisma.topic.findUnique({ where: { slug: topic } });
          if (!topicRecord) {
            errors.push(`${id}: Invalid topic ${topic}`);
            failed++;
            continue;
          }

          const sourceSlug = staged.sourceFile
            .replace(/\.pdf$/i, '')
            .replace(/[^a-z0-9]+/gi, '-')
            .toLowerCase()
            .slice(0, 20);
          const count = await prisma.question.count({
            where: { topicId: topicRecord.id, tier },
          });
          const slug = `${topic}-t${tier}-${sourceSlug}-${String(count + 1).padStart(3, '0')}`;
          const title = staged.content.slice(0, 50).replace(/\$.*?\$/g, '').trim() + '...';

          const question = await prisma.question.create({
            data: {
              topicId: topicRecord.id,
              slug,
              tier,
              title,
              content: staged.content,
              answer: staged.answer || '',
              answerType: staged.answerType || 'numeric',
              acceptedAnswers: staged.acceptedAnswers,
              hints: staged.hints,
              solution: staged.solution,
              source: staged.sourceFile,
              xpValue: [10, 15, 25, 40, 60][tier - 1] || 10,
            },
          });

          await prisma.stagedQuestion.update({
            where: { id },
            data: {
              status: 'approved',
              finalTopic: topic,
              finalTier: tier,
              approvedQuestionId: question.id,
              reviewedAt: new Date(),
            },
          });

          processed++;
        } catch (err) {
          errors.push(`${id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          failed++;
        }
      }
    }

    return NextResponse.json({
      processed,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error in bulk action:', error);
    return NextResponse.json({ error: 'Failed to process bulk action' }, { status: 500 });
  }
}
