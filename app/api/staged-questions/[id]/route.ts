import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateSchema = z.object({
  content: z.string().optional(),
  answer: z.string().optional(),
  answerType: z.enum(['exact', 'numeric', 'multiple-choice']).optional(),
  acceptedAnswers: z.array(z.string()).optional(),
  hints: z.array(z.string()).optional(),
  solution: z.string().optional(),
  suggestedTopic: z.string().optional(),
  suggestedTier: z.number().min(1).max(5).optional(),
  finalTopic: z.string().optional(),
  finalTier: z.number().min(1).max(5).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'needs_edit']).optional(),
  reviewNotes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await prisma.stagedQuestion.findUnique({
      where: { id },
    });

    if (!question) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error fetching staged question:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    // Convert arrays to JSON strings for storage
    const updateData: Record<string, unknown> = { ...data };
    if (data.acceptedAnswers) {
      updateData.acceptedAnswers = JSON.stringify(data.acceptedAnswers);
    }
    if (data.hints) {
      updateData.hints = JSON.stringify(data.hints);
    }
    if (data.status) {
      updateData.reviewedAt = new Date();
    }

    const question = await prisma.stagedQuestion.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error updating staged question:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.stagedQuestion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting staged question:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
