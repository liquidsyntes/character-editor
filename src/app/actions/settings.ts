'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAppSetting(key: string) {
  const setting = await prisma.appSetting.findUnique({ where: { id: key } });
  return setting?.value || null;
}

export async function setAppSetting(key: string, value: string) {
  await prisma.appSetting.upsert({
    where: { id: key },
    update: { value },
    create: { id: key, value },
  });
  revalidatePath('/');
  return { success: true };
}
