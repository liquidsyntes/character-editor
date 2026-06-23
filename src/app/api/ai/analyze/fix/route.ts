import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/ai/provider';
import { buildFixPrompt } from '@/lib/ai/prompt';
import { parseFillResponse } from '@/lib/ai/prompt-parser';
import { AiProvider } from '@/lib/ai/provider';
import { handleAiError, validateExistingData, withAiMiddleware } from '@/lib/ai/routeUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function generateHandler(req: NextRequest) {
  try {
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
      provider: provider as AiProvider,
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

export const POST = withAiMiddleware(generateHandler, { limit: 10 });
