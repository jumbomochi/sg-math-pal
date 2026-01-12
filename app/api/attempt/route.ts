import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAttemptBadges, getBadgeDefinition } from '@/lib/badges';
import { calculateStreakUpdate, getStreakMessage } from '@/lib/streak';
import { calculateNextReview, getInitialMasteryState, Quality } from '@/lib/mastery';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      questionId,
      userAnswer,
      isCorrect,
      hintsUsed,
      timeSpent,
      xpEarned,
    } = body;

    // Create the question attempt
    const attempt = await prisma.questionAttempt.create({
      data: {
        studentId,
        questionId,
        userAnswer,
        isCorrect,
        hintsUsed,
        timeSpent,
        xpEarned,
        sessionType: 'practice',
      },
    });

    // Get the question to find its topic
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { topicId: true },
    });

    let newBadges: { type: string; name: string; description: string; icon: string }[] = [];
    let streakInfo: { currentStreak: number; streakMessage: string | null; streakIncreased: boolean; streakBroken: boolean } | undefined;

    if (question) {
      // Update topic progress
      const updatedProgress = await prisma.topicProgress.update({
        where: {
          studentId_topicId: {
            studentId,
            topicId: question.topicId,
          },
        },
        data: {
          questionsAttempted: { increment: 1 },
          questionsCorrect: isCorrect ? { increment: 1 } : undefined,
          perfectAnswers: isCorrect && hintsUsed === 0 ? { increment: 1 } : undefined,
          totalTimeSpent: { increment: timeSpent },
          tierXp: isCorrect ? { increment: xpEarned } : undefined,
          lastPracticedAt: new Date(),
        },
      });

      // Update student total XP and streak
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (student && isCorrect) {
        // Calculate daily streak update
        const streakUpdate = calculateStreakUpdate(
          student.lastActiveAt,
          student.currentStreak,
          student.bestStreak
        );

        // Update student with XP and streak
        await prisma.student.update({
          where: { id: studentId },
          data: {
            totalXp: { increment: xpEarned },
            lastActiveAt: new Date(),
            currentStreak: streakUpdate.currentStreak,
            bestStreak: streakUpdate.bestStreak,
          },
        });

        // Set streak info for response
        streakInfo = {
          currentStreak: streakUpdate.currentStreak,
          streakMessage: getStreakMessage(streakUpdate),
          streakIncreased: streakUpdate.streakIncreased,
          streakBroken: streakUpdate.streakBroken,
        };

        // Calculate current correct streak (consecutive correct answers)
        const recentAttempts = await prisma.questionAttempt.findMany({
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

        let correctStreak = 0;
        for (const att of recentAttempts) {
          if (att.isCorrect) {
            correctStreak++;
          } else {
            break;
          }
        }

        // Get total correct answers
        const totalCorrect = await prisma.questionAttempt.count({
          where: { studentId, isCorrect: true },
        });

        // Check for badges (using updated day streak)
        const earnedBadgeTypes = checkAttemptBadges({
          isCorrect,
          hintsUsed,
          timeSpent,
          currentStreak: correctStreak,
          perfectAnswers: updatedProgress.perfectAnswers,
          totalCorrect,
          dayStreak: streakUpdate.currentStreak,
        });

        // Award new badges (check if already earned)
        const existingBadges = await prisma.badge.findMany({
          where: {
            studentId,
            type: { in: earnedBadgeTypes },
          },
          select: { type: true },
        });

        const existingTypes = new Set(existingBadges.map(b => b.type));
        const newBadgeTypes = earnedBadgeTypes.filter(t => !existingTypes.has(t));

        // Create new badges
        for (const badgeType of newBadgeTypes) {
          const definition = getBadgeDefinition(badgeType);
          if (definition) {
            await prisma.badge.create({
              data: {
                studentId,
                type: definition.type,
                name: definition.name,
                description: definition.description,
                icon: definition.icon,
              },
            });
            newBadges.push({
              type: definition.type,
              name: definition.name,
              description: definition.description,
              icon: definition.icon,
            });
          }
        }
      }

      // Add/update question mastery for spaced repetition
      const existingMastery = await prisma.questionMastery.findUnique({
        where: {
          studentId_questionId: { studentId, questionId },
        },
      });

      if (existingMastery) {
        // Update existing mastery with SM-2 algorithm
        const masteryState = {
          easeFactor: existingMastery.easeFactor,
          interval: existingMastery.interval,
          repetitions: existingMastery.repetitions,
          nextReviewDate: existingMastery.nextReviewDate,
          lastQuality: existingMastery.lastQuality,
        };

        // Use quality 2 (Good) for practice attempts
        const quality: Quality = isCorrect ? 2 : 1;
        const update = calculateNextReview(masteryState, quality, isCorrect);

        await prisma.questionMastery.update({
          where: { id: existingMastery.id },
          data: {
            easeFactor: update.easeFactor,
            interval: update.interval,
            repetitions: update.repetitions,
            nextReviewDate: update.nextReviewDate,
            lastQuality: quality,
            totalAttempts: { increment: 1 },
            correctCount: isCorrect ? { increment: 1 } : undefined,
            lastAttemptAt: new Date(),
          },
        });
      } else {
        // Create new mastery record
        const initialState = getInitialMasteryState();
        const quality: Quality = isCorrect ? 2 : 1;
        const update = calculateNextReview(initialState, quality, isCorrect);

        await prisma.questionMastery.create({
          data: {
            studentId,
            questionId,
            easeFactor: update.easeFactor,
            interval: update.interval,
            repetitions: update.repetitions,
            nextReviewDate: update.nextReviewDate,
            lastQuality: quality,
            totalAttempts: 1,
            correctCount: isCorrect ? 1 : 0,
            lastAttemptAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      attempt,
      newBadges: newBadges.length > 0 ? newBadges : undefined,
      streakInfo,
    });
  } catch (error) {
    console.error('Error recording attempt:', error);
    return NextResponse.json(
      { error: 'Failed to record attempt' },
      { status: 500 }
    );
  }
}
