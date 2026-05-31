import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import DashboardClient from '@/components/DashboardClient';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== session.user.id) notFound();

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
      projectName={project.name || ''}
      projectDescription={project.description || ''}
      projectEmoji={project.emoji}
    />
  );
}
