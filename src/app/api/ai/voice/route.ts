import { NextRequest } from 'next/server';
import { chatCompletionStream, AiProvider } from '@/lib/ai/provider';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, validateExistingData, checkApiRateLimit, requireAuth } from '@/lib/ai/routeUtils';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const rateLimitError = await checkApiRateLimit(req, 10);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const validationError = validateExistingData(body);
    if (validationError) return validationError;

    const {
      existingData,
      provider = 'deepseek',
      model,
      temperature = 0.8,
      apiKey,
      projectContext,
    } = body;

    let systemPrompt = '';
    const { getAppSetting } = await import('@/app/actions/settings');
    const savedPrompt = await getAppSetting('VOICE_PROMPT');
    
    if (savedPrompt) {
      systemPrompt = savedPrompt;
    } else {
      try {
        const promptPath = path.join(process.cwd(), 'promt', 'promt_dialog.md');
        systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      } catch (err) {
        console.warn('Could not read promt_dialog.md, using minimal fallback', err);
        systemPrompt = 'Вы сценарист. Ваша задача написать 8-10 диалоговых сцен, показывающих манеру общения персонажа в разных ситуациях (спокойствие, раздражение, ложь и т.д.).';
      }
    }

    if (projectContext) {
      systemPrompt += `\n\nКонтекст проекта/мира:\n${projectContext}`;
    }

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: typeof existingData === 'string' ? existingData : JSON.stringify(existingData, null, 2) },
    ];

    const aiStream = await chatCompletionStream(messages, {
      provider: provider as AiProvider,
      model,
      temperature: typeof temperature === 'number' ? temperature : 0.8,
      maxTokens: 16384,
      apiKey: typeof apiKey === 'string' ? apiKey : undefined,
    });

    return sseResponse(aiStream);
  } catch (err) {
    return handleAiError(err, 'AI Voice');
  }
}
