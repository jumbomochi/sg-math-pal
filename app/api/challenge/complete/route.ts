import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getChallengeConfig, getTierName, calculateChallengeResult, TIER_XP_THRESHOLDS } from '@/lib/tier-challenge';

// Input validation schema
const completeSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = completeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { challengeId } = parseResult.data;

    // Get the challenge with all questions
    const challenge = await prisma.tierChallenge.findUnique({
      where: { id: challengeId },
      include: {
        questions: {
          include: {
            question: true,
          },
        },
        topicProgress: true,
        topic: true,
      },
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

    // Get the config for this tier transition
    const config = getChallengeConfig(challenge.fromTier, challenge.toTier);
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid challenge configuration' },
        { status: 500 }
      );
    }

    // Calculate the result
    const { passed, percentage } = calculateChallengeResult(
      challenge.correctAnswers,
      challenge.totalQuestions,
      config
    );

    let xpEarned = 0;
    const status = passed ? 'passed' : 'failed';

    // Update challenge status
    await prisma.tierChallenge.update({
      where: { id: challengeId },
      data: {
        status,
        completedAt: new Date(),
        xpEarned: passed ? config.passXpBonus : 0,
      },
    });

    if (passed) {
      // Award XP bonus
      xpEarned = config.passXpBonus;

      // Promote to next tier
      await prisma.topicProgress.update({
        where: { id: challenge.topicProgressId },
        data: {
          currentTier: challenge.toTier,
          tierXp: 0, // Reset tier XP for new tier
          tierXpRequired: TIER_XP_THRESHOLDS[challenge.toTier] || 100,
          canAttemptPromotion: false,
          lastPromotionAt: new Date(),
          tierUnlockedAt: new Date(),
        },
      });

      // Update student total XP
      await prisma.student.update({
        where: { id: challenge.studentId },
        data: {
          totalXp: { increment: xpEarned },
          lastActiveAt: new Date(),
        },
      });

      // Check and award tier badges
      await awardTierBadge(challenge.studentId, challenge.toTier, challenge.topic.slug);
    } else {
      // Update promotion attempts count
      await prisma.topicProgress.update({
        where: { id: challenge.topicProgressId },
        data: {
          promotionAttempts: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      result: {
        passed,
        percentage,
        correctAnswers: challenge.correctAnswers,
        totalQuestions: challenge.totalQuestions,
        requiredCorrect: config.requiredCorrect,
        xpEarned,
        fromTier: challenge.fromTier,
        toTier: challenge.toTier,
        fromTierName: getTierName(challenge.fromTier),
        toTierName: getTierName(challenge.toTier),
        topicName: challenge.topic.name,
        cooldownMinutes: passed ? 0 : config.failCooldownMinutes,
      },
    });
  } catch (error) {
    console.error('Error completing challenge:', error);
    return NextResponse.json(
      { error: 'Failed to complete challenge' },
      { status: 500 }
    );
  }
}

async function awardTierBadge(studentId: string, tier: number, topicSlug: string) {
  const tierBadges: Record<number, { type: string; name: string; description: string; icon: string }> = {
    2: {
      type: 'bronze-explorer',
      name: 'Bronze Explorer',
      description: 'Reached Bronze tier in a topic',
      icon: 'medal',
    },
    3: {
      type: 'silver-star',
      name: 'Silver Star',
      description: 'Reached Silver tier in a topic',
      icon: 'star',
    },
    4: {
      type: 'gold-master',
      name: 'Gold Master',
      description: 'Reached Gold tier in a topic',
      icon: 'crown',
    },
    5: {
      type: 'platinum-legend',
      name: 'Platinum Legend',
      description: 'Reached Platinum tier - the highest level!',
      icon: 'trophy',
    },
  };

  const badgeInfo = tierBadges[tier];
  if (!badgeInfo) return;

  // Use upsert to handle race conditions - unique constraint prevents duplicates
  try {
    await prisma.badge.upsert({
      where: {
        studentId_type: {
          studentId,
          type: badgeInfo.type,
        },
      },
      create: {
        studentId,
        type: badgeInfo.type,
        name: badgeInfo.name,
        description: badgeInfo.description,
        icon: badgeInfo.icon,
        topic: topicSlug,
        tier,
      },
      update: {}, // No update if exists
    });
  } catch {
    // Ignore unique constraint errors - badge already exists
  }
}
