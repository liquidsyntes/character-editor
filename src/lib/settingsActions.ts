'use server';

import { cookies } from 'next/headers';

type AiProvider = 'deepseek' | 'xai' | 'openai' | 'anthropic' | 'gemini' | 'openrouter';

export async function saveApiKeysToCookie(newKeys: Partial<Record<AiProvider, string>>) {
  const cookieStore = await cookies();
  const existingStr = cookieStore.get('cc_api_keys')?.value;
  let existingKeys: Record<string, string> = {};
  
  try {
    if (existingStr) existingKeys = JSON.parse(existingStr);
  } catch {}

  const merged = { ...existingKeys };
  
  for (const [k, v] of Object.entries(newKeys)) {
    if (v === '********') {
      // Unchanged masked key, keep existing
      continue;
    }
    if (v === '' || v === undefined || v === null) {
      delete merged[k];
    } else {
      merged[k] = v as string;
    }
  }

  cookieStore.set('cc_api_keys', JSON.stringify(merged), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function getMaskedApiKeysFromCookie(): Promise<Partial<Record<AiProvider, string>>> {
  const cookieStore = await cookies();
  const keysStr = cookieStore.get('cc_api_keys')?.value;
  if (!keysStr) return {};
  try {
    const keys = JSON.parse(keysStr);
    const masked: Partial<Record<AiProvider, string>> = {};
    for (const [k, v] of Object.entries(keys)) {
      if (v) masked[k as AiProvider] = '********';
    }
    return masked;
  } catch {
    return {};
  }
}

export async function getServerSideApiKeys(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const keysStr = cookieStore.get('cc_api_keys')?.value;
  if (!keysStr) return {};
  try {
    return JSON.parse(keysStr);
  } catch {
    return {};
  }
}
