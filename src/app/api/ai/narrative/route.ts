import { NextRequest } from 'next/server';
import { chatCompletionStream, AiProvider } from '@/lib/ai/provider';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, validateExistingData, checkApiRateLimit, requireAuth } from '@/lib/ai/routeUtils';
import { getAppSetting } from '@/app/actions/settings';
import { DEFAULT_NARRATIVE_SYSTEM_PROMPT } from '@/lib/ai/prompt-constants';

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
      temperature = 0.7,
      apiKey,
    } = body;

    const systemPrompt = await getAppSetting('NARRATIVE_PROMPT') || DEFAULT_NARRATIVE_SYSTEM_PROMPT;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: typeof existingData === 'string' ? existingData : JSON.stringify(existingData, null, 2) },
    ];

    const aiStream = await chatCompletionStream(messages, {
      provider: provider as AiProvider,
      model,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      maxTokens: 16384,
      apiKey: typeof apiKey === 'string' ? apiKey : undefined,
    });

    return sseResponse(aiStream);
  } catch (err) {
    return handleAiError(err, 'AI Narrative');
  }
}
