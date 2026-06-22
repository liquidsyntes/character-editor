import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion, chatCompletionStream, AiProvider } from '@/lib/ai/provider';
import { buildFillPrompt, buildScratchpadPrompt, buildQuickCommandPrompt, buildWizardPrompt } from '@/lib/ai/prompt';
import { parseFillResponse, parsePartialJson } from '@/lib/ai/prompt-parser';
import { sseResponse } from '@/lib/ai/streamUtils';
import { handleAiError, validateExistingData, withAiMiddleware } from '@/lib/ai/routeUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

async function generateHandler(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      existingData,
      sectionIds,
      fieldIds,
      context,
      stream = false,
      provider = 'deepseek',
      model,
      temperature = 0.85,
      apiKey,
      scratchpadText,
      quickCommand,
      wizardAnswers,
    } = body;

    // Wizard requests build a character from scratch and don't carry existingData.
    if (!wizardAnswers) {
      const validationError = validateExistingData(body);
      if (validationError) return validationError;
    }

    let promptResult;
    if (scratchpadText) {
      promptResult = await buildScratchpadPrompt(existingData, scratchpadText, context);
    } else if (quickCommand) {
      promptResult = await buildQuickCommandPrompt(existingData, quickCommand, context);
    } else if (wizardAnswers) {
      promptResult = await buildWizardPrompt(wizardAnswers, context);
    } else {
      promptResult = await buildFillPrompt({
        existingData,
        sectionIds,
        fieldIds,
        context,
      });
    }

    const { system, user } = promptResult;

    const messages = [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ];

    const options = {
      provider: provider as AiProvider,
      model,
      temperature: typeof temperature === 'number' ? temperature : 0.85,
      maxTokens: 16384,
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
      const partial = parsePartialJson(result.content);
      if (Object.keys(partial).length > 0) {
        filledData = partial;
        parseWarning = `РћС‚РІРµС‚ AI Р±С‹Р» РЅРµ РїРѕР»РЅРѕСЃС‚СЊСЋ РІР°Р»РёРґРЅС‹Рј JSON, РЅРѕ СѓРґР°Р»РѕСЃСЊ РёР·РІР»РµС‡СЊ ${Object.keys(partial).length} РїРѕР»РµР№.`;
      } else {
        return NextResponse.json(
          {
            error: `РќРµ СѓРґР°Р»РѕСЃСЊ СЂР°Р·РѕР±СЂР°С‚СЊ РѕС‚РІРµС‚ AI. РџРѕРїСЂРѕР±СѓР№С‚Рµ РµС‰С‘ СЂР°Р·.`,
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

export const POST = withAiMiddleware(generateHandler, { limit: 20 });
