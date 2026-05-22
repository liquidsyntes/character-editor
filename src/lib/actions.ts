'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CharacterData } from '@/types/character';

export async function createCharacter() {
  const character = await prisma.character.create({
    data: {},
  });
  redirect(`/character/${character.id}`);
}

export async function updateCharacter(id: string, formData: CharacterData) {
  const firstName = formData.firstName || '';
  const lastName = formData.lastName || '';
  const name = [firstName, lastName].filter(Boolean).join(' ');
  const summary = formData.oneLiner || '';

  await prisma.character.update({
    where: { id },
    data: {
      name,
      summary,
      data: JSON.stringify(formData),
      isDraft: false,
    },
  });

  revalidatePath(`/character/${id}`);
  revalidatePath('/');
}

export async function updateCharacterMeta(id: string, meta: { emoji?: string; color?: string }) {
  await prisma.character.update({
    where: { id },
    data: meta,
  });
  revalidatePath(`/character/${id}`);
  revalidatePath('/');
}

export async function deleteCharacter(id: string) {
  await prisma.character.delete({
    where: { id },
  });
  revalidatePath('/');
}

export async function archiveCharacter(id: string) {
  const character = await prisma.character.findUnique({ where: { id } });
  if (!character) return;

  await prisma.character.update({
    where: { id },
    data: { isArchived: !character.isArchived },
  });
  revalidatePath('/');
}

export async function duplicateCharacter(id: string) {
  const original = await prisma.character.findUnique({ where: { id } });
  if (!original) return;

  const copy = await prisma.character.create({
    data: {
      name: original.name ? `${original.name} (копия)` : '',
      data: original.data,
      emoji: original.emoji,
      color: original.color,
      summary: original.summary,
      isDraft: true,
    },
  });

  redirect(`/character/${copy.id}`);
}

export async function listCharacters(query?: string, filter?: 'all' | 'drafts' | 'archived') {
  const where: Record<string, unknown> = {};

  if (filter === 'archived') {
    where.isArchived = true;
  } else if (filter === 'drafts') {
    where.isDraft = true;
    where.isArchived = false;
  } else {
    where.isArchived = false;
  }

  if (query && query.trim()) {
    where.OR = [
      { name: { contains: query.trim() } },
      { summary: { contains: query.trim() } },
      { data: { contains: query.trim() } },
    ];
  }

  return prisma.character.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  });
}
