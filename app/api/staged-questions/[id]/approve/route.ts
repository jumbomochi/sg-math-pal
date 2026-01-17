import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const approveSchema = z.object({
  finalTopic: z.string(),
  finalTier: z.number().min(1).max(5),
  title: z.string().optional(),
  hints: z.array(z.string()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = approveSchema.parse(body);

    // Get the staged question
    const staged = await prisma.stagedQuestion.findUnique({
      where: { id },
    });

    if (!staged) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (staged.status === 'approved') {
      return NextResponse.json({ error: 'Already approved' }, { status: 400 });
    }

    // Find the topic
    const topic = await prisma.topic.findUnique({
      where: { slug: data.finalTopic },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Invalid topic' }, { status: 400 });
    }

    // Check for duplicates (fuzzy match on content)
    const normalizedContent = staged.content.toLowerCase().replace(/\s+/g, ' ').trim();
    const existingQuestions = await prisma.question.findMany({
      where: { topicId: topic.id },
      select: { id: true, content: true },
    });

    const isDuplicate = existingQuestions.some(q => {
      const existing = q.content.toLowerCase().replace(/\s+/g, ' ').trim();
      return existing === normalizedContent ||
        (existing.length > 50 && normalizedContent.includes(existing.slice(0, 50)));
    });

    if (isDuplicate) {
      return NextResponse.json({
        error: 'Potential duplicate question detected',
        warning: true,
      }, { status: 409 });
    }

    // Generate slug
    const sourceSlug = staged.sourceFile
      .replace(/\.pdf$/i, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .toLowerCase()
      .slice(0, 20);
    const count = await prisma.question.count({
      where: { topicId: topic.id, tier: data.finalTier },
    });
    const slug = `${data.finalTopic}-t${data.finalTier}-${sourceSlug}-${String(count + 1).padStart(3, '0')}`;

    // Generate title if not provided
    const title = data.title || staged.content.slice(0, 50).replace(/\$.*?\$/g, '').trim() + '...';

    // Create the question
    const question = await prisma.question.create({
      data: {
        topicId: topic.id,
        slug,
        tier: data.finalTier,
        title,
        content: staged.content,
        answer: staged.answer || '',
        answerType: staged.answerType || 'numeric',
        acceptedAnswers: staged.acceptedAnswers,
        hints: data.hints ? JSON.stringify(data.hints) : staged.hints,
        solution: staged.solution,
        source: staged.sourceFile,
        xpValue: [10, 15, 25, 40, 60][data.finalTier - 1] || 10,
      },
    });

    // Update staged question
    await prisma.stagedQuestion.update({
      where: { id },
      data: {
        status: 'approved',
        finalTopic: data.finalTopic,
        finalTier: data.finalTier,
        approvedQuestionId: question.id,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      questionId: question.id,
      slug: question.slug,
    });
  } catch (error) {
    console.error('Error approving staged question:', error);
    return NextResponse.json({ error: 'Failed to approve' }, { status: 500 });
  }
}
