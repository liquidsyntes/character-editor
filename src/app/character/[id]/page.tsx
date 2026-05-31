import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getSiblingCharacters } from '@/lib/actions';
import CharacterForm from '@/components/CharacterForm';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function CharacterEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const character = await prisma.character.findUnique({ where: { id } });
  if (!character || character.userId !== session.user.id) notFound();

  let data = {};
  try { data = JSON.parse(character.data); } catch {}

  const siblings = await getSiblingCharacters(character.projectId);

  // Get project info for breadcrumb and AI lore context
  let projectName: string | undefined;
  let projectId: string | undefined;
  let projectContext: string | undefined;
  
  if (character.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: character.projectId },
      select: { id: true, name: true, description: true },
    });
    if (project) {
      projectId = project.id;
      projectName = project.name || 'Новый проект';
      projectContext = project.description;
    }
  }

  return (
    <CharacterForm
      characterId={character.id}
      initialData={data}
      siblings={siblings}
      projectId={projectId}
      projectName={projectName}
      projectContext={projectContext}
    />
  );
}
