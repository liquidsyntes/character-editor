import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream, ProviderName } from '@/lib/ai/provider';
import { buildAnalyzePrompt } from '@/lib/ai/prompt';
import { checkRateLimit } from '@/lib/rateLimit';
import { sseResponse } from '@/lib/ai/streamUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success } = checkRateLimit(ip, 10, 60000);
    if (!success) {
      return NextResponse.json({ error: 'Слишком много запросов. Подождите немного.' }, { status: 429 });
    }

    const body = await req.json();
    const {
      existingData,
      provider = 'deepseek',
      model,
      temperature = 0.7,
      apiKey,
      context,
    } = body;

    if (!existingData || typeof existingData !== 'object') {
      return NextResponse.json(
        { error: 'existingData is required' },
        { status: 400 }
      );
    }

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
    console.error('AI analyze error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('timeout') || message.includes('abort')) {
      return NextResponse.json(
        { error: 'AI не успел ответить (таймаут). Попробуйте ещё раз.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

