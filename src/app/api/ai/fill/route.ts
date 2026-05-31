import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, chatCompletionStream, ProviderName } from '@/lib/ai/provider';
import { buildFillPrompt } from '@/lib/ai/prompt';
import { parseFillResponse } from '@/lib/ai/prompt-parser';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, validateExistingData, checkApiRateLimit } from '@/lib/ai/routeUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = checkApiRateLimit(req, 20); // allow more requests for fill
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const validationError = validateExistingData(body);
    if (validationError) return validationError;

    const {
      existingData,
      sectionIds,
      context,
      stream = false,
      provider = 'deepseek',
      model,
      temperature = 0.85,
      apiKey,
    } = body;

    const { system, user } = await buildFillPrompt({
      existingData,
      sectionIds,
      context,
    });

    const messages = [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ];

    const options = {
      provider: provider as ProviderName,
      model,
      temperature: typeof temperature === 'number' ? temperature : 0.85,
      maxTokens: 4096,
      apiKey: typeof apiKey === 'string' ? apiKey : undefined,
    };

    if (stream) {
      const aiStream = await chatCompletionStream(messages, options);
      return sseResponse(aiStream);
    }

    // Non-streaming
    const result = await chatCompletion(messages, options);

    console.log(`[AI Fill] Provider: ${provider}, model: ${options.model || 'default'}, tokens: ${result.usage?.promptTokens}+${result.usage?.completionTokens}`);

    let filledData;
    let parseWarning: string | undefined;
    try {
      filledData = parseFillResponse(result.content);
    } catch (parseErr) {
      console.error('Parse error:', parseErr);
      const partial = tryPartialParse(result.content);
      if (partial && Object.keys(partial).length > 0) {
        filledData = partial;
        parseWarning = `Ответ AI был не полностью валидным JSON, но удалось извлечь ${Object.keys(partial).length} полей.`;
      } else {
        return NextResponse.json(
          {
            error: `Не удалось разобрать ответ AI. Попробуйте ещё раз.`,
            rawPreview: result.content.slice(0, 500),
          },
          { status: 422 }
        );
      }
    }

    return NextResponse.json({
      data: filledData,
      filledCount: Object.keys(filledData).length,
      usage: result.usage,
      warning: parseWarning,
      provider,
      model: options.model,
    });
  } catch (err) {
    return handleAiError(err, 'AI Fill');
  }
}

function tryPartialParse(raw: string): Record<string, string> | null {
  const result: Record<string, string> = {};
  const kvPattern = /"([^"]+)"\s*:\s*"([^"]*)"/g;
  let match;
  while ((match = kvPattern.exec(raw)) !== null) {
    const key = match[1];
    const value = match[2];
    if (key && value && value.trim()) {
      result[key] = value.trim();
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}
