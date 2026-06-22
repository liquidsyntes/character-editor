'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}

export async function getAnalysisHistory(characterId: string) {
  const userId = await getUserId();
  
  const records = await prisma.analysisRecord.findMany({
    where: { characterId, userId },
    orderBy: { createdAt: 'desc' },
  });

  return records.map(r => ({
    id: r.id,
    timestamp: r.createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + ' · ' + r.createdAt.toLocaleDateString('ru-RU'),
    result: JSON.parse(r.result),
    provider: r.provider || undefined,
    dataSnapshot: r.dataSnapshot ? JSON.parse(r.dataSnapshot) : undefined,
  }));
}

export async function saveAnalysis(
  characterId: string, 
  result: unknown, 
  provider: string, 
  dataSnapshot: Record<string, string>
) {
  const userId = await getUserId();

  const record = await prisma.analysisRecord.create({
    data: {
      characterId,
      userId,
      provider,
      result: JSON.stringify(result),
      dataSnapshot: JSON.stringify(dataSnapshot),
    }
  });

  revalidatePath(`/character/${characterId}`);
  
  return {
    id: record.id,
    timestamp: record.createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + ' · ' + record.createdAt.toLocaleDateString('ru-RU'),
    result,
    provider: record.provider || undefined,
    dataSnapshot,
  };
}

export async function deleteAnalysis(id: string, characterId: string) {
  const userId = await getUserId();

  await prisma.analysisRecord.deleteMany({
    where: { id, userId },
  });

  revalidatePath(`/character/${characterId}`);
}

export async function bulkMigrateLocalAnalyses(characterId: string, analyses: Record<string, unknown>[]) {
  const userId = await getUserId();
  
  if (!analyses || !Array.isArray(analyses) || analyses.length === 0) return;

  const dataToInsert = analyses.map(a => ({
    characterId,
    userId,
    provider: a.provider ? String(a.provider) : null,
    result: JSON.stringify(a.result || {}),
    dataSnapshot: a.dataSnapshot ? JSON.stringify(a.dataSnapshot) : null,
    createdAt: new Date(), // We could parse a.timestamp but Date.now() is safer to avoid invalid dates
  }));

  await prisma.analysisRecord.createMany({
    data: dataToInsert,
  });

  revalidatePath(`/character/${characterId}`);
}
