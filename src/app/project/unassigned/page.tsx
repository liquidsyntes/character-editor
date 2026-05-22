import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function UnassignedPage() {
  const characters = await prisma.character.findMany({
    where: { projectId: null },
    orderBy: { updatedAt: 'desc' },
  });

  const serialized = characters.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient
      characters={serialized}
      projectId={null}
      projectName="Без проекта"
      projectEmoji="📂"
    />
  );
}
