import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getInitialMasteryState } from '@/lib/mastery';

// POST /api/review/add - Add a question to review queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, questionId } = body;

    if (!studentId || !questionId) {
      return NextResponse.json(
        { error: 'studentId and questionId are required' },
        { status: 400 }
      );
    }

    // Check if mastery record already exists
    const existing = await prisma.questionMastery.findUnique({
      where: {
        studentId_questionId: { studentId, questionId },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        mastery: existing,
        alreadyExists: true,
      });
    }

    // Create new mastery record with initial state
    const initialState = getInitialMasteryState();
    const mastery = await prisma.questionMastery.create({
      data: {
        studentId,
        questionId,
        easeFactor: initialState.easeFactor,
        interval: initialState.interval,
        repetitions: initialState.repetitions,
        nextReviewDate: initialState.nextReviewDate,
        lastQuality: initialState.lastQuality,
      },
      include: {
        question: {
          include: { topic: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      mastery,
      alreadyExists: false,
    });
  } catch (error) {
    console.error('Error adding to review queue:', error);
    return NextResponse.json(
      { error: 'Failed to add to review queue' },
      { status: 500 }
    );
  }
}
