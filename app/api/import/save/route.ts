// POST /api/import/save
// Saves reviewed questions to the database

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ExtractedQuestion, SaveRequest, SaveResponse } from '@/lib/import-types';

export async function POST(request: NextRequest) {
  try {
    const body: SaveRequest = await request.json();
    const { importId, questions } = body;

    if (!importId) {
      return NextResponse.json(
        { success: false, error: 'Import ID is required' },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No questions to save' },
        { status: 400 }
      );
    }

    // Verify import exists
    const importRecord = await prisma.importedPDF.findUnique({
      where: { id: importId },
    });

    if (!importRecord) {
      return NextResponse.json(
        { success: false, error: 'Import not found' },
        { status: 404 }
      );
    }

    // Get all topics for mapping
    const topics = await prisma.topic.findMany();
    const topicMap = new Map(topics.map((t) => [t.slug, t.id]));

    // Save questions
    const savedIds: string[] = [];
    let skipped = 0;

    for (const question of questions) {
      try {
        // Get topic ID
        const topicId = topicMap.get(question.topicSlug);
        if (!topicId) {
          console.warn(`Unknown topic: ${question.topicSlug}, skipping question`);
          skipped++;
          continue;
        }

        // Generate unique slug
        const slug = await generateUniqueSlug(question, importRecord);

        // Calculate XP value based on tier
        const xpValue = calculateXpValue(question.tier);

        // Create question in database
        const created = await prisma.question.create({
          data: {
            topicId,
            slug,
            tier: question.tier,
            title: question.title,
            content: question.content,
            answer: question.answer,
            answerType: question.answerType,
            acceptedAnswers: question.acceptedAnswers
              ? JSON.stringify(question.acceptedAnswers)
              : null,
            hints: question.hints ? JSON.stringify(question.hints) : null,
            solution: question.solution || null,
            heuristic: question.heuristic || null,
            source: importRecord.source || null,
            sourceYear: importRecord.year || null,
            sourceQuestion: question.sourceQuestion || null,
            xpValue,
            isChallengeQuestion: question.tier >= 3, // Tier 3+ can be challenge questions
          },
        });

        savedIds.push(created.id);
      } catch (saveError) {
        console.error('Error saving question:', saveError);
        skipped++;
      }
    }

    // Update import record
    await prisma.importedPDF.update({
      where: { id: importId },
      data: {
        status: 'completed',
        questionsCount: savedIds.length,
        completedAt: new Date(),
        // Clear extracted data to save space
        extractedData: null,
      },
    });

    const response: SaveResponse = {
      success: true,
      saved: savedIds.length,
      skipped,
      importId,
      questionIds: savedIds,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Save questions error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save questions',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a unique slug for a question
 */
async function generateUniqueSlug(
  question: ExtractedQuestion,
  importRecord: { source?: string | null; year?: number | null }
): Promise<string> {
  // Build base slug: topic-tier-source-index
  const topicPrefix = question.topicSlug.slice(0, 3); // geo, fra, num, etc.
  const tierPart = `t${question.tier}`;
  const sourcePart = importRecord.source
    ? importRecord.source.slice(0, 4).toLowerCase()
    : 'imp';
  const yearPart = importRecord.year ? String(importRecord.year).slice(-2) : '';

  // Create base slug
  const baseSlug = `${topicPrefix}-${tierPart}-${sourcePart}${yearPart}`;

  // Find existing slugs with this prefix
  const existing = await prisma.question.findMany({
    where: { slug: { startsWith: baseSlug } },
    select: { slug: true },
  });

  // Find next available number
  let nextNum = 1;
  const existingSlugs = new Set(existing.map((q) => q.slug));

  while (existingSlugs.has(`${baseSlug}-${String(nextNum).padStart(3, '0')}`)) {
    nextNum++;
  }

  return `${baseSlug}-${String(nextNum).padStart(3, '0')}`;
}

/**
 * Calculate XP value based on tier
 */
function calculateXpValue(tier: number): number {
  const xpByTier: Record<number, number> = {
    1: 10,  // Iron
    2: 15,  // Bronze
    3: 25,  // Silver
    4: 40,  // Gold
    5: 60,  // Platinum
  };

  return xpByTier[tier] || 10;
}
