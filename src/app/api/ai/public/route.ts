import { NextRequest } from 'next/server';
import { chatCompletionStream, AiProvider } from '@/lib/ai/provider';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, checkApiRateLimit, requireAuth } from '@/lib/ai/routeUtils';
import { getAppSetting } from '@/app/actions/settings';
import { DEFAULT_PUBLIC_SYSTEM_PROMPT } from '@/lib/ai/prompt-constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const rateLimitError = await checkApiRateLimit(req, 10);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const {
      existingData,
      narrative,
      provider = 'deepseek',
      model,
      temperature = 0.8,
      apiKey,
    } = body;

    const systemPrompt = await getAppSetting('PUBLIC_PROMPT') || DEFAULT_PUBLIC_SYSTEM_PROMPT;

    const userDataText = `
### РђРЅРєРµС‚Р° РїРµСЂСЃРѕРЅР°Р¶Р°
${JSON.stringify(existingData, null, 2)}

### РҐСѓРґРѕР¶РµСЃС‚РІРµРЅРЅРѕРµ РѕРїРёСЃР°РЅРёРµ РїРµСЂСЃРѕРЅР°Р¶Р°
${narrative || '(РћРїРёСЃР°РЅРёРµ РѕС‚СЃСѓС‚СЃС‚РІСѓРµС‚)'}
`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userDataText }
    ];

    const stream = await chatCompletionStream(messages, {
      model,
      temperature,
      provider: provider as AiProvider,
      apiKey,
    });

    return sseResponse(stream);
  } catch (err) {
    return handleAiError(err, 'AI Public Opinions Stream');
  }
}
