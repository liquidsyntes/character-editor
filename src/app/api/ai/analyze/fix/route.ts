import { NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/ai/provider';
import { buildFixPrompt } from '@/lib/ai/prompt';
import { parseFillResponse } from '@/lib/ai/prompt-parser';
import { ProviderName } from '@/lib/ai/provider';
import { checkRateLimit } from '@/lib/rateLimit';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success } = checkRateLimit(ip, 10, 60000);
    if (!success) {
      return NextResponse.json({ error: 'Слишком много запросов. Подождите немного.' }, { status: 429 });
    }

    const body = await req.json();
    const { existingData, issues, provider = 'deepseek', model, temperature = 0.7, apiKey, context } = body;

    if (!existingData || !issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json({ error: 'Missing existingData or issues array' }, { status: 400 });
    }

    const { system, user } = await buildFixPrompt(issues, existingData, context);

    const messages = [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user }
    ];

    const options = {
      provider: provider as ProviderName,
      model,
      temperature,
      apiKey,
      maxTokens: 8192,
    };

    const aiRes = await chatCompletion(messages, options);
    const content = aiRes.content;
    
    let parsed;
    try {
      parsed = parseFillResponse(content);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI JSON response' }, { status: 500 });
    }

    return NextResponse.json({ data: parsed, usage: aiRes.usage });
  } catch (error: any) {
    console.error('AI Fix Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
