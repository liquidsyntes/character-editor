import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import WorldElementForm from '@/components/WorldElementForm';
import { getSiblingCharacters } from '@/lib/actions';

export default async function WorldElementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const worldElement = await prisma.worldElement.findUnique({ 
    where: { id },
    include: { project: true }
  });

  if (!worldElement || worldElement.project.userId !== session.user.id) notFound();

  const siblingCharacters = await getSiblingCharacters(worldElement.projectId);
  const siblingElements = await prisma.worldElement.findMany({
    where: { projectId: worldElement.projectId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      category: true,
    }
  });

  return (
    <WorldElementForm
      elementId={worldElement.id}
      initialTitle={worldElement.title}
      initialContent={worldElement.content || ''}
      category={worldElement.category}
      projectId={worldElement.projectId}
      projectName={worldElement.project.name || 'Проект'}
      projectEmoji={worldElement.project.emoji || '📁'}
      siblingCharacters={siblingCharacters}
      siblingElements={siblingElements}
    />
  );
}
