import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/questions - List all questions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get('topicId');
    const tier = searchParams.get('tier');

    const questions = await prisma.question.findMany({
      where: {
        ...(topicId && { topicId }),
        ...(tier && { tier: parseInt(tier) }),
      },
      include: {
        topic: true,
      },
      orderBy: [
        { topic: { orderIndex: 'asc' } },
        { tier: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/questions - Create a new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      answer,
      answerType = 'exact',
      acceptedAnswers,
      hints,
      solution,
      tier,
      topicId,
      source,
      sourceYear,
      isChallengeQuestion = false,
    } = body;

    // Validation
    if (!title || !content || !answer || !tier || !topicId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, answer, tier, topicId' },
        { status: 400 }
      );
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Generate slug
    const slugBase = `${topic.slug}-t${tier}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;
    const existingCount = await prisma.question.count({
      where: {
        slug: {
          startsWith: slugBase,
        },
      },
    });
    const slug = existingCount > 0 ? `${slugBase}-${existingCount + 1}` : slugBase;

    // Calculate XP value based on tier
    const xpValues: Record<number, number> = { 1: 10, 2: 15, 3: 25, 4: 40, 5: 60 };
    const xpValue = xpValues[tier] || 10;

    // Create question
    const question = await prisma.question.create({
      data: {
        slug,
        title,
        content,
        answer,
        answerType,
        acceptedAnswers: acceptedAnswers ? JSON.stringify(acceptedAnswers) : null,
        hints: hints ? JSON.stringify(hints) : null,
        solution: solution || null,
        tier,
        topicId,
        source: source || null,
        sourceYear: sourceYear || null,
        isChallengeQuestion,
        xpValue,
      },
      include: {
        topic: true,
      },
    });

    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}
