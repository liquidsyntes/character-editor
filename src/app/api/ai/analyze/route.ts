import { NextRequest } from 'next/server';
import { chatCompletionStream, AiProvider } from '@/lib/ai/provider';
import { buildAnalyzePrompt } from '@/lib/ai/prompt';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, validateExistingData, checkApiRateLimit, requireAuth } from '@/lib/ai/routeUtils';

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
      context,
    } = body;

    const { system, user } = await buildAnalyzePrompt(existingData, context);

    const messages = [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
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
    return handleAiError(err, 'AI Analyze');
  }
}

