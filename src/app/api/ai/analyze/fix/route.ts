import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/ai/provider';
import { buildFixPrompt } from '@/lib/ai/prompt';
import { parseFillResponse } from '@/lib/ai/prompt-parser';
import { ProviderName } from '@/lib/ai/provider';
import { handleAiError, validateExistingData, checkApiRateLimit, requireAuth } from '@/lib/ai/routeUtils';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const rateLimitError = await checkApiRateLimit(req, 10);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const validationError = validateExistingData(body);
    if (validationError) return validationError;
    
    const { existingData, issues, provider = 'deepseek', model, temperature = 0.7, apiKey, context } = body;

    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json({ error: 'Missing issues array' }, { status: 400 });
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
      maxTokens: 16384,
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
  } catch (err) {
    return handleAiError(err, 'AI Fix');
  }
}
