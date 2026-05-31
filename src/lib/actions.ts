'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CharacterData } from '@/types/character';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

// ── Project Actions ──────────────────────

export async function createProject() {
  const userId = await getUserId();
  const project = await prisma.project.create({
    data: { userId },
  });
  redirect(`/project/${project.id}`);
}

export async function updateProject(id: string, data: { name?: string; description?: string; emoji?: string; color?: string }) {
  const userId = await getUserId();
  const project = await prisma.project.findUnique({ where: { id } });
  if (project?.userId !== userId) throw new Error('Unauthorized');

  await prisma.project.update({
    where: { id },
    data,
  });
  revalidatePath(`/project/${id}`);
  revalidatePath('/');
}

export async function deleteProject(id: string) {
  const userId = await getUserId();
  const project = await prisma.project.findUnique({ where: { id } });
  if (project?.userId !== userId) throw new Error('Unauthorized');

  await prisma.$transaction([
    prisma.character.updateMany({
      where: { projectId: id, userId },
      data: { projectId: null },
    }),
    prisma.project.delete({
      where: { id },
    })
  ]);
  
  revalidatePath('/');
}

export async function archiveProject(id: string) {
  const userId = await getUserId();
  const project = await prisma.project.findUnique({ where: { id } });
  if (project?.userId !== userId) return;

  await prisma.project.update({
    where: { id },
    data: { isArchived: !project.isArchived },
  });
  revalidatePath('/');
}

export async function listProjects() {
  const userId = await getUserId();
  return prisma.project.findMany({
    where: { isArchived: false, userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { characters: true },
      },
    },
  });
}

// ── Character Actions ────────────────────

export async function createCharacter(projectId?: string | null) {
  const userId = await getUserId();
  
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project?.userId !== userId) throw new Error('Unauthorized');
  }

  const character = await prisma.character.create({
    data: {
      projectId: projectId || null,
      userId,
    },
  });
  redirect(`/character/${character.id}`);
}

export async function updateCharacter(id: string, formData: CharacterData) {
  const userId = await getUserId();
  const character = await prisma.character.findUnique({ where: { id } });
  if (character?.userId !== userId) throw new Error('Unauthorized');

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
  const userId = await getUserId();
  const character = await prisma.character.findUnique({ where: { id } });
  if (character?.userId !== userId) throw new Error('Unauthorized');

  await prisma.character.update({
    where: { id },
    data: meta,
  });
  revalidatePath(`/character/${id}`);
  revalidatePath('/');
}

export async function deleteCharacter(id: string) {
  const userId = await getUserId();
  const char = await prisma.character.findUnique({ where: { id } });
  if (char?.userId !== userId) throw new Error('Unauthorized');

  await prisma.character.delete({
    where: { id },
  });
  revalidatePath('/');
  if (char?.projectId) revalidatePath(`/project/${char.projectId}`);
}

export async function archiveCharacter(id: string) {
  const userId = await getUserId();
  const character = await prisma.character.findUnique({ where: { id } });
  if (character?.userId !== userId) return;

  await prisma.character.update({
    where: { id },
    data: { isArchived: !character.isArchived },
  });
  revalidatePath('/');
  if (character.projectId) revalidatePath(`/project/${character.projectId}`);
}

export async function duplicateCharacter(id: string) {
  const userId = await getUserId();
  const original = await prisma.character.findUnique({ where: { id } });
  if (original?.userId !== userId) return;

  const copy = await prisma.character.create({
    data: {
      name: original.name ? `${original.name} (копия)` : '',
      data: original.data,
      emoji: original.emoji,
      color: original.color,
      summary: original.summary,
      isDraft: true,
      projectId: original.projectId,
      userId,
    },
  });

  redirect(`/character/${copy.id}`);
}

export async function listCharacters(query?: string, filter?: 'all' | 'drafts' | 'archived') {
  const userId = await getUserId();
  const where: Record<string, unknown> = { userId };

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

export async function getSiblingCharacters(projectId?: string | null) {
  const userId = await getUserId();
  return prisma.character.findMany({
    where: {
      isArchived: false,
      projectId: projectId || null,
      userId,
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      emoji: true,
      color: true,
    },
  });
}

export async function getUnassignedCharacterCount() {
  const userId = await getUserId();
  return prisma.character.count({
    where: {
      projectId: null,
      isArchived: false,
      userId,
    },
  });
}
