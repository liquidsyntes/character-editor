import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { CharacterData } from '@/types/character';
import { PublicClient } from '@/components/PublicClient';

export default async function PublicOpinionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const character = await prisma.character.findFirst({
    where: {
      id,
      userId: session.user.id
    },
    include: {
      project: true
    }
  });

  if (!character) {
    redirect('/');
  }

  let data: CharacterData;
  try {
    data = JSON.parse(character.data);
  } catch {
    data = {} as CharacterData;
  }

  let opinions: Record<string, string> = {};
  try {
    opinions = JSON.parse(character.publicOpinions || "{}");
  } catch {
    //
  }

  const charName = [data.firstName, data.lastName].filter(Boolean).join(' ') || character.name;

  return (
    <PublicClient 
      characterId={character.id}
      characterName={charName}
      initialData={data}
      initialNarrative={character.narrative}
      initialOpinions={opinions}
      isLore={character.isLore}
      projectId={character.project?.id}
      projectName={character.project?.name}
    />
  );
}
