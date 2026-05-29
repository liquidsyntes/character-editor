import { NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/ai/provider';
import { buildFixPrompt, parseFillResponse } from '@/lib/ai/prompt';
import { ProviderName } from '@/lib/ai/provider';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { existingData, issues, provider = 'deepseek', model, temperature = 0.7, apiKey } = body;

    if (!existingData || !issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json({ error: 'Missing existingData or issues array' }, { status: 400 });
    }

    const { system, user } = buildFixPrompt(issues, existingData);

    const messages = [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user }
    ];

    const options = {
      provider: provider as ProviderName,
      model,
      temperature,
      apiKey,
      maxTokens: 4096,
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
