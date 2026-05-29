import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, chatCompletionStream, ProviderName } from '@/lib/ai/provider';
import { buildFillPrompt, parseFillResponse } from '@/lib/ai/prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    if (!existingData || typeof existingData !== 'object') {
      return NextResponse.json(
        { error: 'existingData is required' },
        { status: 400 }
      );
    }

    const { system, user } = buildFillPrompt({
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

      const encoder = new TextEncoder();
      const sseStream = new ReadableStream({
        async start(controller) {
          const reader = aiStream.getReader();
          let buffer = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                if (buffer.trim()) {
                  try {
                    const parsed = JSON.parse(buffer);
                    if (parsed.delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta })}\n\n`));
                  } catch (e) {}
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                break;
              }
              
              buffer += new TextDecoder().decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';
              
              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const parsed = JSON.parse(line);
                  if (parsed.delta) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta })}\n\n`));
                  }
                } catch (e) {}
              }
            }
          } catch (err) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
            );
          } finally {
            controller.close();
          }
        },
      });

      return new NextResponse(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
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
    console.error('AI fill error:', err);
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
