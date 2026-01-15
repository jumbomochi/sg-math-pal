import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

// Input validation schema
const submitSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
  challengeQuestionId: z.string().min(1, 'Challenge question ID is required'),
  userAnswer: z.string(),
  isCorrect: z.boolean(),
  timeSpent: z.number().int().min(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with zod
    const parseResult = submitSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { challengeId, challengeQuestionId, userAnswer, isCorrect, timeSpent } = parseResult.data;

    // Get the challenge to verify it's still in progress
    const challenge = await prisma.tierChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge not found' },
        { status: 404 }
      );
    }

    if (challenge.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Challenge is no longer active' },
        { status: 400 }
      );
    }

    // Update the challenge question with the answer
    const updatedQuestion = await prisma.tierChallengeQuestion.update({
      where: { id: challengeQuestionId },
      data: {
        userAnswer,
        isCorrect,
        timeSpent,
        answeredAt: new Date(),
      },
    });

    // Update the challenge totals
    await prisma.tierChallenge.update({
      where: { id: challengeId },
      data: {
        correctAnswers: isCorrect ? { increment: 1 } : undefined,
        incorrectAnswers: !isCorrect ? { increment: 1 } : undefined,
        totalTime: { increment: timeSpent },
      },
    });

    // Check if all questions have been answered
    const answeredCount = await prisma.tierChallengeQuestion.count({
      where: {
        challengeId,
        userAnswer: { not: null },
      },
    });

    return NextResponse.json({
      success: true,
      updatedQuestion,
      answeredCount,
      allAnswered: answeredCount >= challenge.totalQuestions,
    });
  } catch (error) {
    console.error('Error submitting challenge answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
