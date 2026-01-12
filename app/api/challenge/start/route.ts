import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getChallengeConfig, isChallengeOnCooldown } from '@/lib/tier-challenge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, topicId } = body;

    // Validate required parameters
    if (!studentId || !topicId) {
      return NextResponse.json(
        { error: 'Missing required parameters: studentId and topicId are required' },
        { status: 400 }
      );
    }

    // Get the student's topic progress
    const topicProgress = await prisma.topicProgress.findUnique({
      where: {
        studentId_topicId: {
          studentId,
          topicId,
        },
      },
    });

    if (!topicProgress) {
      return NextResponse.json(
        { error: 'Topic progress not found' },
        { status: 404 }
      );
    }

    const fromTier = topicProgress.currentTier;
    const toTier = fromTier + 1;

    // Check if already at max tier
    if (fromTier >= 5) {
      return NextResponse.json(
        { error: 'Already at maximum tier' },
        { status: 400 }
      );
    }

    // Get challenge config
    const config = getChallengeConfig(fromTier, toTier);
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid tier transition' },
        { status: 400 }
      );
    }

    // Check for existing in-progress challenge
    const existingChallenge = await prisma.tierChallenge.findFirst({
      where: {
        studentId,
        topicId,
        status: 'in_progress',
      },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (existingChallenge) {
      // Return the existing challenge
      return NextResponse.json({
        success: true,
        challenge: existingChallenge,
        resuming: true,
      });
    }

    // Check cooldown from last failed attempt
    const lastFailedChallenge = await prisma.tierChallenge.findFirst({
      where: {
        studentId,
        topicId,
        fromTier,
        status: 'failed',
      },
      orderBy: { completedAt: 'desc' },
    });

    if (lastFailedChallenge?.completedAt) {
      const { onCooldown, remainingMinutes } = isChallengeOnCooldown(
        lastFailedChallenge.completedAt,
        fromTier
      );

      if (onCooldown) {
        return NextResponse.json(
          {
            error: 'Challenge on cooldown',
            cooldownMinutes: remainingMinutes,
          },
          { status: 429 }
        );
      }
    }

    // Get random questions for the challenge from the target tier
    const questions = await prisma.question.findMany({
      where: {
        topicId,
        tier: toTier,
      },
    });

    if (questions.length < config.totalQuestions) {
      return NextResponse.json(
        {
          error: `Not enough questions available for tier ${toTier}. Need ${config.totalQuestions}, found ${questions.length}`,
        },
        { status: 400 }
      );
    }

    // Shuffle and select questions
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, config.totalQuestions);

    // Create the challenge
    const challenge = await prisma.tierChallenge.create({
      data: {
        studentId,
        topicProgressId: topicProgress.id,
        topicId,
        fromTier,
        toTier,
        requiredCorrect: config.requiredCorrect,
        totalQuestions: config.totalQuestions,
        timeLimit: config.timeLimit,
        allowHints: config.allowHints,
        questions: {
          create: selectedQuestions.map((q, index) => ({
            questionId: q.id,
            orderIndex: index,
          })),
        },
      },
      include: {
        questions: {
          include: {
            question: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      challenge,
      config: {
        timeLimit: config.timeLimit,
        requiredCorrect: config.requiredCorrect,
        totalQuestions: config.totalQuestions,
        allowHints: config.allowHints,
      },
    });
  } catch (error) {
    console.error('Error starting challenge:', error);
    return NextResponse.json(
      { error: 'Failed to start challenge' },
      { status: 500 }
    );
  }
}
