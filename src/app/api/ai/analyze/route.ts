import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream, ProviderName } from '@/lib/ai/provider';
import { buildAnalyzePrompt } from '@/lib/ai/prompt';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, validateExistingData, checkApiRateLimit } from '@/lib/ai/routeUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = checkApiRateLimit(req, 10);
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
      provider: provider as ProviderName,
      model,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      maxTokens: 8192,
      apiKey: typeof apiKey === 'string' ? apiKey : undefined,
    });

    return sseResponse(aiStream);
  } catch (err) {
    return handleAiError(err, 'AI Analyze');
  }
}

