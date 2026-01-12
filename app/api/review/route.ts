import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  calculateNextReview,
  getInitialMasteryState,
  getReviewPriority,
  Quality,
} from '@/lib/mastery';
import { checkAttemptBadges, getBadgeDefinition } from '@/lib/badges';
import { calculateStreakUpdate, getStreakMessage } from '@/lib/streak';

// GET /api/review - Get questions due for review
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const topicId = searchParams.get('topicId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Get due questions from QuestionMastery
    const dueQuestions = await prisma.questionMastery.findMany({
      where: {
        studentId,
        nextReviewDate: { lte: now },
        ...(topicId && {
          question: { topicId },
        }),
      },
      include: {
        question: {
          include: { topic: true },
        },
      },
    });

    // Sort by priority (most overdue and difficult first)
    const sortedQuestions = dueQuestions
      .map((mastery) => ({
        ...mastery,
        priority: getReviewPriority(
          mastery.nextReviewDate,
          mastery.easeFactor,
          mastery.repetitions
        ),
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);

    // Get count of all due questions
    const totalDue = await prisma.questionMastery.count({
      where: {
        studentId,
        nextReviewDate: { lte: now },
        ...(topicId && {
          question: { topicId },
        }),
      },
    });

    // Get review stats
    const allMastery = await prisma.questionMastery.findMany({
      where: { studentId },
      select: {
        repetitions: true,
        easeFactor: true,
        nextReviewDate: true,
        totalAttempts: true,
      },
    });

    const stats = {
      dueToday: totalDue,
      learned: allMastery.filter((m) => m.repetitions >= 1).length,
      mastered: allMastery.filter(
        (m) => m.repetitions >= 5 && m.easeFactor >= 2.0
      ).length,
      totalReviewed: allMastery.filter((m) => m.totalAttempts > 0).length,
    };

    return NextResponse.json({
      questions: sortedQuestions.map((m) => ({
        masteryId: m.id,
        questionId: m.questionId,
        question: m.question,
        repetitions: m.repetitions,
        easeFactor: m.easeFactor,
        interval: m.interval,
        nextReviewDate: m.nextReviewDate,
        priority: m.priority,
      })),
      totalDue,
      stats,
    });
  } catch (error) {
    console.error('Error fetching review questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review questions' },
      { status: 500 }
    );
  }
}

// POST /api/review - Submit a review answer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      questionId,
      userAnswer,
      isCorrect,
      quality,
      hintsUsed = 0,
      timeSpent = 0,
    } = body;

    if (!studentId || !questionId) {
      return NextResponse.json(
        { error: 'studentId and questionId are required' },
        { status: 400 }
      );
    }

    // Get or create mastery record
    let mastery = await prisma.questionMastery.findUnique({
      where: {
        studentId_questionId: { studentId, questionId },
      },
    });

    const initialState = getInitialMasteryState();

    if (!mastery) {
      mastery = await prisma.questionMastery.create({
        data: {
          studentId,
          questionId,
          ...initialState,
        },
      });
    }

    // Calculate next review using SM-2
    const masteryState = {
      easeFactor: mastery.easeFactor,
      interval: mastery.interval,
      repetitions: mastery.repetitions,
      nextReviewDate: mastery.nextReviewDate,
      lastQuality: mastery.lastQuality,
    };

    const reviewQuality: Quality = quality || (isCorrect ? 2 : 1);
    const update = calculateNextReview(masteryState, reviewQuality, isCorrect);

    // Update mastery record
    const updatedMastery = await prisma.questionMastery.update({
      where: { id: mastery.id },
      data: {
        easeFactor: update.easeFactor,
        interval: update.interval,
        repetitions: update.repetitions,
        nextReviewDate: update.nextReviewDate,
        lastQuality: reviewQuality,
        totalAttempts: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined,
        lastAttemptAt: new Date(),
      },
    });

    // Create a question attempt record
    const xpEarned = isCorrect ? Math.round(10 * (quality === 3 ? 1.2 : quality === 1 ? 0.8 : 1)) : 2;

    await prisma.questionAttempt.create({
      data: {
        studentId,
        questionId,
        userAnswer: userAnswer || '',
        isCorrect,
        hintsUsed,
        timeSpent,
        xpEarned,
        sessionType: 'review',
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
      await prisma.topicProgress.update({
        where: {
          studentId_topicId: {
            studentId,
            topicId: question.topicId,
          },
        },
        data: {
          questionsAttempted: { increment: 1 },
          questionsCorrect: isCorrect ? { increment: 1 } : undefined,
          totalTimeSpent: { increment: timeSpent },
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

        // Get total correct answers for badge checking
        const totalCorrect = await prisma.questionAttempt.count({
          where: { studentId, isCorrect: true },
        });

        // Get correct streak
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

        // Get updated progress for badge check
        const updatedProgress = await prisma.topicProgress.findUnique({
          where: {
            studentId_topicId: {
              studentId,
              topicId: question.topicId,
            },
          },
        });

        // Check for badges
        const earnedBadgeTypes = checkAttemptBadges({
          isCorrect,
          hintsUsed,
          timeSpent,
          currentStreak: correctStreak,
          perfectAnswers: updatedProgress?.perfectAnswers || 0,
          totalCorrect,
          dayStreak: streakUpdate.currentStreak,
        });

        // Award new badges
        const existingBadges = await prisma.badge.findMany({
          where: {
            studentId,
            type: { in: earnedBadgeTypes },
          },
          select: { type: true },
        });

        const existingTypes = new Set(existingBadges.map((b) => b.type));
        const newBadgeTypes = earnedBadgeTypes.filter((t) => !existingTypes.has(t));

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
    }

    return NextResponse.json({
      success: true,
      mastery: {
        id: updatedMastery.id,
        easeFactor: updatedMastery.easeFactor,
        interval: updatedMastery.interval,
        repetitions: updatedMastery.repetitions,
        nextReviewDate: updatedMastery.nextReviewDate,
      },
      xpEarned,
      newBadges: newBadges.length > 0 ? newBadges : undefined,
      streakInfo,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
