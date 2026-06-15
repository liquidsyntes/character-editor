import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CharacterData } from '@/types/character';
import { VoiceClient } from '@/components/VoiceClient';

export default async function VoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const character = await prisma.character.findFirst({
    where: { id, userId },
    include: {
      project: {
        include: {
          worldElements: true
        }
      }
    }
  });

  if (!character) {
    notFound();
  }

  let data: CharacterData = {};
  try {
    data = JSON.parse(character.data);
  } catch {
    // skip error
  }

  // Generate project context for AI if available
  let projectContext: string | undefined;
  if (character.project) {
    const project = character.project;
    const loreSections = project.worldElements?.map(el => {
      const catName = el.category === 'location' ? 'Локация' :
                      el.category === 'faction' ? 'Фракция' :
                      el.category === 'history' ? 'История/Событие' :
                      el.category === 'rule' ? 'Закон мира' :
                      el.category === 'dictionary' ? 'Словарь' : 'Лор';
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

  return (
    <VoiceClient
      characterId={character.id}
      characterName={character.name || 'Без имени'}
      initialData={data}
      initialVoice={character.voice || ''}
      isLore={character.isLore}
      projectId={character.projectId || undefined}
      projectName={character.project?.name || undefined}
      projectContext={projectContext}
    />
  );
}
