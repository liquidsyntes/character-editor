import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { getSiblingCharacters } from '@/lib/actions';
import CharacterForm from '@/components/CharacterForm';
import { parseCharacterData } from '@/lib/schema';
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

  let data: Record<string, string> = {};
  try { data = parseCharacterData(character.data); } catch {}

  const siblings = await getSiblingCharacters(character.projectId);

  // Get project info for breadcrumb and AI lore context
  let projectName: string | undefined;
  let projectId: string | undefined;
  let projectContext: string | undefined;
  
  if (character.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: character.projectId },
      include: {
        worldElements: true
      }
    });
    if (project) {
      projectId = project.id;
      projectName = project.name || 'Новый проект';
      
      const loreSections = project.worldElements?.map(el => {
        const catName = el.category === 'location' ? 'Локация' :
                        el.category === 'faction' ? 'Фракция' :
                        el.category === 'history' ? 'История/Событие' :
                        el.category === 'rule' ? 'Закон мира' : 'Лор';
        return `[${catName}] ${el.title}: ${el.content}`;
      }).join('\n');

      projectContext = [
        project.description ? `Описание проекта: ${project.description}` : '',
        project.genre ? `Жанр: ${project.genre}` : '',
        project.format ? `Формат: ${project.format}` : '',
        project.setting ? `Основное место действия: ${project.setting}` : '',
        loreSections ? `\nЭлементы мира и лора:\n${loreSections}` : '',
      ].filter(Boolean).join('\n');
    }
  }

  return (
    <CharacterForm
      key={character.id}
      characterId={character.id}
      initialData={data}
      siblings={siblings}
      projectId={projectId}
      projectName={projectName}
      projectContext={projectContext}
    />
  );
}
