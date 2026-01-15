import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { checkAttemptBadges, getBadgeDefinition } from '@/lib/badges';
import { calculateStreakUpdate, getStreakMessage } from '@/lib/streak';
import { calculateNextReview, getInitialMasteryState, Quality } from '@/lib/mastery';

// Input validation schema
const attemptSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  userAnswer: z.string(),
  isCorrect: z.boolean(),
  hintsUsed: z.number().int().min(0).default(0),
  timeSpent: z.number().int().min(0),
  xpEarned: z.number().int().min(0).default(0),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const parseResult = attemptSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      studentId,
      questionId,
      userAnswer,
      isCorrect,
      hintsUsed,
      timeSpent,
      xpEarned,
    } = parseResult.data;

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

      // Get student to calculate streak updates
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (student) {
        // Calculate daily streak update
        const streakUpdate = calculateStreakUpdate(
          student.lastActiveAt,
          student.currentStreak,
          student.bestStreak
        );

        // Calculate new correct answer streak (cached value)
        // If correct, increment; if incorrect, reset to 0
        const newCorrectAnswerStreak = isCorrect
          ? student.correctAnswerStreak + 1
          : 0;

        // Update student with XP, streaks, and cached correct answer streak
        await prisma.student.update({
          where: { id: studentId },
          data: {
            totalXp: isCorrect ? { increment: xpEarned } : undefined,
            lastActiveAt: new Date(),
            currentStreak: streakUpdate.currentStreak,
            bestStreak: streakUpdate.bestStreak,
            correctAnswerStreak: newCorrectAnswerStreak,
          },
        });

        // Set streak info for response
        streakInfo = {
          currentStreak: streakUpdate.currentStreak,
          streakMessage: getStreakMessage(streakUpdate),
          streakIncreased: streakUpdate.streakIncreased,
          streakBroken: streakUpdate.streakBroken,
        };

        if (isCorrect) {
          // Get total correct answers
          const totalCorrect = await prisma.questionAttempt.count({
            where: { studentId, isCorrect: true },
          });

          // Check for badges using the cached correctAnswerStreak
          const earnedBadgeTypes = checkAttemptBadges({
            isCorrect,
            hintsUsed,
            timeSpent,
            currentStreak: newCorrectAnswerStreak,
            perfectAnswers: updatedProgress.perfectAnswers,
            totalCorrect,
            dayStreak: streakUpdate.currentStreak,
          });

          // Award new badges using upsert pattern to handle race conditions
          // The unique constraint @@unique([studentId, type]) prevents duplicates
          for (const badgeType of earnedBadgeTypes) {
            const definition = getBadgeDefinition(badgeType);
            if (definition) {
              try {
                // Use upsert to handle race condition - if badge exists, do nothing
                const badge = await prisma.badge.upsert({
                  where: {
                    studentId_type: {
                      studentId,
                      type: definition.type,
                    },
                  },
                  create: {
                    studentId,
                    type: definition.type,
                    name: definition.name,
                    description: definition.description,
                    icon: definition.icon,
                  },
                  update: {}, // No update if exists
                });

                // Only add to newBadges if this was just created (check earnedAt)
                const isNew = new Date().getTime() - badge.earnedAt.getTime() < 1000;
                if (isNew) {
                  newBadges.push({
                    type: definition.type,
                    name: definition.name,
                    description: definition.description,
                    icon: definition.icon,
                  });
                }
              } catch {
                // Ignore unique constraint errors - badge already exists
              }
            }
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
