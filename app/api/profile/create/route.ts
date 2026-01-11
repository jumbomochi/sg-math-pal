import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, avatar, color } = await request.json();

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Deactivate all existing profiles
    await prisma.student.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new profile
    const profile = await prisma.student.create({
      data: {
        name: name.trim(),
        avatar: avatar || 'rocket',
        color: color || '#7c3aed',
        isActive: true,
      },
    });

    // Get all topics to initialize progress
    const topics = await prisma.topic.findMany({
      where: { isActive: true },
    });

    // Initialize topic progress for the new profile
    await prisma.topicProgress.createMany({
      data: topics.map(topic => ({
        studentId: profile.id,
        topicId: topic.id,
        currentTier: 1,
        tierXp: 0,
        tierXpRequired: 100,
      })),
    });

    // Award welcome badge
    await prisma.badge.create({
      data: {
        studentId: profile.id,
        type: 'welcome',
        name: 'Space Cadet',
        description: 'Welcome to SG Math Pal! Your journey begins.',
        icon: 'rocket',
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        color: profile.color,
        totalXp: profile.totalXp,
        isActive: profile.isActive,
      },
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}
