import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { challengeId, challengeQuestionId, userAnswer, isCorrect, timeSpent } = await request.json();

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
