import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream, ProviderName } from '@/lib/ai/provider';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, checkApiRateLimit, requireAuth } from '@/lib/ai/routeUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const rateLimitError = await checkApiRateLimit(req, 15);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const {
      title,
      category,
      currentContent = '',
      projectContext = '',
      isExpand = false,
      provider = 'deepseek',
      model,
      temperature = 0.85,
      apiKey,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Название записи лора обязательно' }, { status: 400 });
    }

    const categoryLabels: Record<string, string> = {
      location: '📍 Локация (город, планета, замок, географическая зона и т.д.)',
      faction: '🛡️ Фракция (организация, банда, орден, корпорация, гильдия и т.д.)',
      history: '⏳ Событие / История (историческое происшествие, битва, эпоха, инцидент и т.д.)',
      rule: '✨ Закон мира (принципы магии, работы технологий, социальные законы и табу и т.д.)',
      dictionary: '📖 Словарь (термины, названия, сленг, особые понятия и т.д.)',
      other: '📝 Прочее лор-описание',
    };

    const categoryLabel = categoryLabels[category] || category;

    const systemPrompt = `Ты — профессиональный писатель, редактор и эксперт по мироустройству (worldbuilding). Твоя задача — помочь автору детально расписать элемент лора для его художественного произведения (книги, кино или сериала).
Пиши в стиле качественной художественной прозы или подробной энциклопедии мира. Избегай банальностей, делай описание атмосферным, логичным и интересным. Отвечай строго на русском языке.`;

    let instruction = '';
    if (isExpand && currentContent.trim().length > 0) {
      instruction = `Автор уже набросал сырые факты или частичное описание лор-элемента:
«${currentContent}»
Твоя задача — развить эти наброски, сделать описание более художественным, связным, глубоким и атмосферным, сохранив все указанные автором факты. Напиши расширенную версию, продолжающую и углубляющую текущее содержание.`;
    } else {
      instruction = `Напиши с нуля развернутое, атмосферное и интересное описание для этого элемента мира. Оно должно идеально вписываться в жанр, формат и место действия проекта. Дай волю фантазии и детально проработай особенности этого лор-элемента.`;
    }

    const userPrompt = `У нас есть проект со следующими параметрами:
${projectContext}

Название элемента лора: «${title}»
Категория: ${categoryLabel}

Инструкция:
${instruction}

Ответ:`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const options = {
      provider: provider as ProviderName,
      model,
      temperature: typeof temperature === 'number' ? temperature : 0.85,
      maxTokens: 4096,
      apiKey: typeof apiKey === 'string' ? apiKey : undefined,
    };

    const aiStream = await chatCompletionStream(messages, options);
    return sseResponse(aiStream);
  } catch (err) {
    return handleAiError(err, 'AI World Element Generation');
  }
}
