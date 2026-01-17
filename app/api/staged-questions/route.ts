import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'needs_edit', 'all']).optional(),
  topic: z.string().optional(),
  tier: z.coerce.number().min(1).max(5).optional(),
  sourceFile: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['extractedAt', 'aiConfidence', 'sourceFile']).default('extractedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = querySchema.parse(searchParams);

    const where: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }
    if (query.topic) {
      where.suggestedTopic = query.topic;
    }
    if (query.tier) {
      where.suggestedTier = query.tier;
    }
    if (query.sourceFile) {
      where.sourceFile = { contains: query.sourceFile };
    }

    const [questions, total] = await Promise.all([
      prisma.stagedQuestion.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: query.offset,
        take: query.limit,
      }),
      prisma.stagedQuestion.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.stagedQuestion.groupBy({
      by: ['status'],
      _count: true,
    });

    const statsByStatus = Object.fromEntries(
      stats.map(s => [s.status, s._count])
    );

    return NextResponse.json({
      questions,
      total,
      stats: {
        pending: statsByStatus.pending || 0,
        approved: statsByStatus.approved || 0,
        rejected: statsByStatus.rejected || 0,
        needs_edit: statsByStatus.needs_edit || 0,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching staged questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staged questions' },
      { status: 500 }
    );
  }
}
