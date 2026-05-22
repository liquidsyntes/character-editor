import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import DashboardClient from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  const characters = await prisma.character.findMany({
    where: { projectId: id },
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
      projectId={id}
      projectName={project.name || 'Новый проект'}
      projectEmoji={project.emoji}
    />
  );
}
