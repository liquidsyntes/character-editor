import { prisma } from '@/lib/prisma';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const characters = await prisma.character.findMany({
    orderBy: { updatedAt: 'desc' },
  });

  const serialized = characters.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <DashboardClient characters={serialized} />;
}
