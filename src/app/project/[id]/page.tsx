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

  const project = await prisma.project.findUnique({ 
    where: { id },
    include: {
      worldElements: {
        orderBy: { updatedAt: 'desc' },
      },
    },
  });
  if (!project || project.userId !== session.user.id) notFound();

  const characters = await prisma.character.findMany({
    where: { projectId: id },
    orderBy: { updatedAt: 'desc' },
  });

  const serializedChars = characters.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const serializedWorld = project.worldElements.map(w => ({
    ...w,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  }));

  return (
    <DashboardClient
      characters={serializedChars}
      worldElements={serializedWorld}
      projectId={id}
      projectName={project.name || ''}
      projectDescription={project.description || ''}
      projectEmoji={project.emoji}
      projectGenre={project.genre || ''}
      projectFormat={project.format || ''}
      projectSetting={project.setting || ''}
    />
  );
}
