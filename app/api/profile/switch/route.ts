import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { profileId } = await request.json();

    // Deactivate all profiles
    await prisma.student.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate the selected profile
    const profile = await prisma.student.update({
      where: { id: profileId },
      data: {
        isActive: true,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Error switching profile:', error);
    return NextResponse.json(
      { error: 'Failed to switch profile' },
      { status: 500 }
    );
  }
}
