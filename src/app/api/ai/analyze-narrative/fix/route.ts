import { NextRequest } from 'next/server';
import { chatCompletionStream, AiProvider } from '@/lib/ai/provider';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, withAiMiddleware } from '@/lib/ai/routeUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SYSTEM_PROMPT = `Ты — профессиональный литературный редактор и писатель. 
Твоя задача — переписать конкретный фрагмент текста (цитату), чтобы исправить стилистическую или смысловую ошибку.
Тебе будет дан оригинальный фрагмент, описание проблемы, и весь текст для контекста.

ТВОЙ ОТВЕТ ДОЛЖЕН СОДЕРЖАТЬ ТОЛЬКО ИСПРАВЛЕННЫЙ ТЕКСТ. Никаких вступлений ("Вот исправленный текст:"), никаких кавычек, никаких дополнительных пояснений.
Заменяй только то, что необходимо для решения проблемы, сохраняя общий смысл. Структура и длина текста должна гармонично вписываться в оригинальный нарратив.`;

async function fixHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      narrative,
      issue, // { quote, description, severity, title }
      provider = 'deepseek',
      model,
      temperature = 0.7,
      apiKey,
    } = body;

    if (!narrative || !issue || !issue.quote) {
      return new Response(JSON.stringify({ error: 'Narrative and issue with quote are required' }), { status: 400 });
    }

    const userPrompt = `КОНТЕКСТ (весь текст):
---
${narrative}
---

ОШИБКА ДЛЯ ИСПРАВЛЕНИЯ:
Проблема (${issue.severity}): ${issue.title}
Описание: ${issue.description}

ЦИТАТА, КОТОРУЮ НУЖНО ПЕРЕПИСАТЬ:
"${issue.quote}"

Напиши улучшенный вариант этой цитаты. ВЫВОДИ ТОЛЬКО НОВЫЙ ТЕКСТ.`;

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ];

    const aiStream = await chatCompletionStream(messages, {
      provider: provider as AiProvider,
      model,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      maxTokens: 2000,
      apiKey: typeof apiKey === 'string' ? apiKey : undefined,
    });

    return sseResponse(aiStream);
  } catch (err) {
    return handleAiError(err, 'AI Fix Narrative Fragment');
  }
}

export const POST = withAiMiddleware(fixHandler, { limit: 20 });
