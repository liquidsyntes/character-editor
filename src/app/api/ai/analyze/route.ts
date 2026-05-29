import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, ProviderName } from '@/lib/ai/provider';
import { buildAnalyzePrompt, parseAnalyzeResponse } from '@/lib/ai/prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
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

    const { system, user } = buildAnalyzePrompt(existingData, context);

    const messages = [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ];

    const result = await chatCompletion(messages, {
      provider: provider as ProviderName,
      model,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      maxTokens: 4096,
      apiKey: typeof apiKey === 'string' ? apiKey : undefined,
    });

    console.log(`[AI Analyze] Provider: ${provider}, model: ${model || 'default'}, tokens: ${result.usage?.promptTokens}+${result.usage?.completionTokens}`);

    let analysis;
    try {
      analysis = parseAnalyzeResponse(result.content);
    } catch (parseErr) {
      console.error('Analyze parse error:', parseErr);
      return NextResponse.json(
        {
          error: 'Не удалось разобрать ответ AI. Попробуйте ещё раз.',
          rawPreview: result.content.slice(0, 500),
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ...analysis,
      usage: result.usage,
      provider,
      model: model || 'default',
    });
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
