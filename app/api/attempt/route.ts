import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAttemptBadges, getBadgeDefinition } from '@/lib/badges';

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
        await prisma.student.update({
          where: { id: studentId },
          data: {
            totalXp: { increment: xpEarned },
            lastActiveAt: new Date(),
          },
        });

        // Calculate current correct streak (consecutive correct answers)
        const recentAttempts = await prisma.questionAttempt.findMany({
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

        let currentStreak = 0;
        for (const att of recentAttempts) {
          if (att.isCorrect) {
            currentStreak++;
          } else {
            break;
          }
        }

        // Get total correct answers
        const totalCorrect = await prisma.questionAttempt.count({
          where: { studentId, isCorrect: true },
        });

        // Check for badges
        const earnedBadgeTypes = checkAttemptBadges({
          isCorrect,
          hintsUsed,
          timeSpent,
          currentStreak,
          perfectAnswers: updatedProgress.perfectAnswers,
          totalCorrect,
          dayStreak: student.currentStreak,
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
    }

    return NextResponse.json({
      success: true,
      attempt,
      newBadges: newBadges.length > 0 ? newBadges : undefined,
    });
  } catch (error) {
    console.error('Error recording attempt:', error);
    return NextResponse.json(
      { error: 'Failed to record attempt' },
      { status: 500 }
    );
  }
}
