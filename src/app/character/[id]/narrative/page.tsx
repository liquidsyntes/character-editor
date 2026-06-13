import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CharacterData } from '@/types/character';
import { NarrativeClient } from '@/components/NarrativeClient';

export default async function NarrativePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const character = await prisma.character.findFirst({
    where: { id, userId },
    include: {
      project: true
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

  return (
    <NarrativeClient
      characterId={character.id}
      characterName={character.name || 'Без имени'}
      initialData={data}
      initialNarrative={character.narrative}
      isLore={character.isLore}
      projectId={character.projectId || undefined}
      projectName={character.project?.name || undefined}
    />
  );
}
