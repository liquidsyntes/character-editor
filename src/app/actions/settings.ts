'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { clearPromptCache } from '@/lib/ai/prompt';

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
  clearPromptCache(key);
  revalidatePath('/');
  return { success: true };
}

export async function getDefaultVoicePrompt() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const promptPath = path.join(process.cwd(), 'promt', 'promt_dialog.md');
    return fs.readFileSync(promptPath, 'utf8');
  } catch (err) {
    return 'Вы сценарист. Ваша задача написать 8-10 диалоговых сцен...';
  }
}
