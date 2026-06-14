import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream, AiProvider } from '@/lib/ai/provider';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, checkApiRateLimit, requireAuth } from '@/lib/ai/routeUtils';
import { getAppSetting } from '@/app/actions/settings';
import { 
  DEFAULT_WORLD_SYSTEM_PROMPT, 
  DEFAULT_WORLD_GENERATE_PROMPT, 
  DEFAULT_WORLD_EXPAND_PROMPT 
} from '@/lib/ai/prompt-constants';

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

    const [sysPrompt, genPrompt, expPrompt] = await Promise.all([
      getAppSetting('WORLD_SYSTEM_PROMPT'),
      getAppSetting('WORLD_GENERATE_PROMPT'),
      getAppSetting('WORLD_EXPAND_PROMPT')
    ]);

    const systemPrompt = sysPrompt || DEFAULT_WORLD_SYSTEM_PROMPT;

    let instruction = '';
    if (isExpand && currentContent.trim().length > 0) {
      const expandTemplate = expPrompt || DEFAULT_WORLD_EXPAND_PROMPT;
      instruction = expandTemplate.replace('{{CURRENT_CONTENT}}', currentContent);
    } else {
      instruction = genPrompt || DEFAULT_WORLD_GENERATE_PROMPT;
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
      provider: provider as AiProvider,
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
