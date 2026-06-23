import { NextRequest } from 'next/server';
import { chatCompletionStream, AiProvider } from '@/lib/ai/provider';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, withAiMiddleware } from '@/lib/ai/routeUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SYSTEM_PROMPT = `Ты — профессиональный литературный редактор. Твоя задача: провести анализ художественного текста (нарратива) персонажа.

ВЫВОД СТРОГО В ФОРМАТЕ JSON, без Markdown-блоков.

Формат JSON:
{
  "summary": "Краткое резюме по тексту (1-2 предложения)",
  "totalIssues": 2,
  "categories": [
    {
      "title": "Стиль и подача",
      "icon": "edit",
      "severity": "style",
      "issues": [
        {
          "title": "Канцелярит",
          "quote": "Она осуществляла контроль за процессом",
          "severity": "style",
          "description": "Использование сухого канцелярского языка в художественном тексте убивает атмосферу."
        }
      ]
    }
  ]
}

ПРАВИЛА ПОИСКА ЦИТАТ (quote):
- "quote" ДОЛЖЕН быть абсолютно точной, непрерывной подстрокой из текста пользователя (скопированной слово в слово, с теми же знаками препинания). Не меняй ни буквы!
- Длина цитаты: от 3 до 15 слов. Если проблема касается большого абзаца, выбери наиболее показательное предложение в качестве "quote".

Доступные значения severity (для issue):
- 'style': Стилистика (канцелярит, тавтология, шероховатости)
- 'show-dont-tell': Правило "Показывай, а не рассказывай" (вместо "он был злой" лучше "он сжал кулаки")
- 'pacing': Темп (слишком затянуто или слишком быстро)
- 'cliche': Клише и штампы
- 'opportunity': Упущенная возможность (например, добавить звуки или запахи для атмосферы)

Если проблем нет, верни пустые categories и totalIssues: 0.`;

async function generateHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      narrative,
      provider = 'deepseek',
      model,
      temperature = 0.7,
      apiKey,
    } = body;

    if (!narrative || typeof narrative !== 'string') {
      return new Response(JSON.stringify({ error: 'Narrative text is required' }), { status: 400 });
    }

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: `Текст для анализа:\n\n${narrative}` },
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
    return handleAiError(err, 'AI Analyze Narrative');
  }
}

export const POST = withAiMiddleware(generateHandler, { limit: 10 });
