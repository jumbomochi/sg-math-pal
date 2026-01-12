import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/questions/[id] - Get a specific question
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        topic: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[id] - Update a question
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      content,
      answer,
      answerType,
      acceptedAnswers,
      hints,
      solution,
      tier,
      topicId,
      source,
      sourceYear,
      isChallengeQuestion,
    } = body;

    // Check if question exists
    const existing = await prisma.question.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Calculate XP value based on tier
    const xpValues: Record<number, number> = { 1: 10, 2: 15, 3: 25, 4: 40, 5: 60 };
    const xpValue = tier ? xpValues[tier] || 10 : undefined;

    // Update question
    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(answer && { answer }),
        ...(answerType && { answerType }),
        acceptedAnswers: acceptedAnswers !== undefined
          ? (acceptedAnswers ? JSON.stringify(acceptedAnswers) : null)
          : undefined,
        hints: hints !== undefined
          ? (hints ? JSON.stringify(hints) : null)
          : undefined,
        solution: solution !== undefined ? (solution || null) : undefined,
        ...(tier && { tier, xpValue }),
        ...(topicId && { topicId }),
        source: source !== undefined ? (source || null) : undefined,
        sourceYear: sourceYear !== undefined ? (sourceYear || null) : undefined,
        ...(isChallengeQuestion !== undefined && { isChallengeQuestion }),
      },
      include: {
        topic: true,
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - Delete a question
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if question exists
    const existing = await prisma.question.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Check for related records
    const attemptCount = await prisma.questionAttempt.count({
      where: { questionId: id },
    });

    const masteryCount = await prisma.questionMastery.count({
      where: { questionId: id },
    });

    const challengeCount = await prisma.tierChallengeQuestion.count({
      where: { questionId: id },
    });

    // Delete related records first
    if (attemptCount > 0) {
      await prisma.questionAttempt.deleteMany({
        where: { questionId: id },
      });
    }

    if (masteryCount > 0) {
      await prisma.questionMastery.deleteMany({
        where: { questionId: id },
      });
    }

    if (challengeCount > 0) {
      await prisma.tierChallengeQuestion.deleteMany({
        where: { questionId: id },
      });
    }

    // Delete the question
    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully',
      deletedRelated: {
        attempts: attemptCount,
        mastery: masteryCount,
        challenges: challengeCount,
      },
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
