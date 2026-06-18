import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream, AiProvider } from '@/lib/ai/provider';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, withAiMiddleware } from '@/lib/ai/routeUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function generateHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fieldId,
      text,
      provider = 'deepseek',
      model,
      temperature = 0.5,
      apiKey,
    } = body;

    if (!fieldId || !text) {
      return NextResponse.json({ error: 'Missing fieldId or text' }, { status: 400 });
    }

    const systemPrompt = `Твоя задача — сжать (ужать) переданный текст, убрав лишнюю воду, но максимально сохранив смысл, ключевые факты и важные детали. Сделай текст более ёмким, но без фанатизма (не превращай абзац в одно слово).
Отвечай строго в формате JSON, где ключ — это переданный ID поля, а значение — ужатый текст. 
Пример: {"${fieldId}": "Сжатый текст здесь"}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: text },
    ];

    const options = {
      provider: provider as AiProvider,
      model,
      temperature,
      apiKey,
      maxTokens: 4096,
    };

    const aiStream = await chatCompletionStream(messages, options);
    
    return sseResponse(aiStream);
  } catch (err) {
    return handleAiError(err, 'AI Condense');
  }
}

export const POST = withAiMiddleware(generateHandler, { limit: 20 });
