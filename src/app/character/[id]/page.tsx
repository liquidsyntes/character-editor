import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getSiblingCharacters } from '@/lib/actions';
import CharacterForm from '@/components/CharacterForm';

export default async function CharacterEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) notFound();

  let data = {};
  try { data = JSON.parse(character.data); } catch {}

  const siblings = await getSiblingCharacters(character.projectId);

  // Get project info for breadcrumb
  let projectName: string | undefined;
  let projectId: string | undefined;
  if (character.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: character.projectId },
      select: { id: true, name: true },
    });
    if (project) {
      projectId = project.id;
      projectName = project.name || 'Новый проект';
    }
  }

  return (
    <CharacterForm
      characterId={character.id}
      initialData={data}
      siblings={siblings}
      projectId={projectId}
      projectName={projectName}
    />
  );
}
