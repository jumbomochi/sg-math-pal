import { prisma } from '@/lib/db';
import { ProfilesClient } from './ProfilesClient';

async function getProfiles() {
  const profiles = await prisma.student.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      avatar: true,
      color: true,
      totalXp: true,
      isActive: true,
    },
  });
  return profiles;
}

export default async function ProfilesPage() {
  const profiles = await getProfiles();

  return <ProfilesClient initialProfiles={profiles} />;
}
