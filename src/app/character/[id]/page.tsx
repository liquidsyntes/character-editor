import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
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

  return <CharacterForm characterId={character.id} initialData={data} />;
}
