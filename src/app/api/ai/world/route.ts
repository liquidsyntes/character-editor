import { NextRequest, NextResponse } from 'next/server';
import { chatCompletionStream, AiProvider } from '@/lib/ai/provider';
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
      return NextResponse.json({ error: 'РќР°Р·РІР°РЅРёРµ Р·Р°РїРёСЃРё Р»РѕСЂР° РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ' }, { status: 400 });
    }

    const categoryLabels: Record<string, string> = {
      location: 'рџ“Ќ Р›РѕРєР°С†РёСЏ (РіРѕСЂРѕРґ, РїР»Р°РЅРµС‚Р°, Р·Р°РјРѕРє, РіРµРѕРіСЂР°С„РёС‡РµСЃРєР°СЏ Р·РѕРЅР° Рё С‚.Рґ.)',
      faction: 'рџ›ЎпёЏ Р¤СЂР°РєС†РёСЏ (РѕСЂРіР°РЅРёР·Р°С†РёСЏ, Р±Р°РЅРґР°, РѕСЂРґРµРЅ, РєРѕСЂРїРѕСЂР°С†РёСЏ, РіРёР»СЊРґРёСЏ Рё С‚.Рґ.)',
      history: 'вЏі РЎРѕР±С‹С‚РёРµ / РСЃС‚РѕСЂРёСЏ (РёСЃС‚РѕСЂРёС‡РµСЃРєРѕРµ РїСЂРѕРёСЃС€РµСЃС‚РІРёРµ, Р±РёС‚РІР°, СЌРїРѕС…Р°, РёРЅС†РёРґРµРЅС‚ Рё С‚.Рґ.)',
      rule: 'вњЁ Р—Р°РєРѕРЅ РјРёСЂР° (РїСЂРёРЅС†РёРїС‹ РјР°РіРёРё, СЂР°Р±РѕС‚С‹ С‚РµС…РЅРѕР»РѕРіРёР№, СЃРѕС†РёР°Р»СЊРЅС‹Рµ Р·Р°РєРѕРЅС‹ Рё С‚Р°Р±Сѓ Рё С‚.Рґ.)',
      dictionary: 'рџ“– РЎР»РѕРІР°СЂСЊ (С‚РµСЂРјРёРЅС‹, РЅР°Р·РІР°РЅРёСЏ, СЃР»РµРЅРі, РѕСЃРѕР±С‹Рµ РїРѕРЅСЏС‚РёСЏ Рё С‚.Рґ.)',
      other: 'рџ“ќ РџСЂРѕС‡РµРµ Р»РѕСЂ-РѕРїРёСЃР°РЅРёРµ',
    };

    const categoryLabel = categoryLabels[category] || category;

    const systemPrompt = `РўС‹ вЂ” РїСЂРѕС„РµСЃСЃРёРѕРЅР°Р»СЊРЅС‹Р№ РїРёСЃР°С‚РµР»СЊ, СЂРµРґР°РєС‚РѕСЂ Рё СЌРєСЃРїРµСЂС‚ РїРѕ РјРёСЂРѕСѓСЃС‚СЂРѕР№СЃС‚РІСѓ (worldbuilding). РўРІРѕСЏ Р·Р°РґР°С‡Р° вЂ” РїРѕРјРѕС‡СЊ Р°РІС‚РѕСЂСѓ РґРµС‚Р°Р»СЊРЅРѕ СЂР°СЃРїРёСЃР°С‚СЊ СЌР»РµРјРµРЅС‚ Р»РѕСЂР° РґР»СЏ РµРіРѕ С…СѓРґРѕР¶РµСЃС‚РІРµРЅРЅРѕРіРѕ РїСЂРѕРёР·РІРµРґРµРЅРёСЏ (РєРЅРёРіРё, РєРёРЅРѕ РёР»Рё СЃРµСЂРёР°Р»Р°).
РџРёС€Рё РІ СЃС‚РёР»Рµ РєР°С‡РµСЃС‚РІРµРЅРЅРѕР№ С…СѓРґРѕР¶РµСЃС‚РІРµРЅРЅРѕР№ РїСЂРѕР·С‹ РёР»Рё РїРѕРґСЂРѕР±РЅРѕР№ СЌРЅС†РёРєР»РѕРїРµРґРёРё РјРёСЂР°. РР·Р±РµРіР°Р№ Р±Р°РЅР°Р»СЊРЅРѕСЃС‚РµР№, РґРµР»Р°Р№ РѕРїРёСЃР°РЅРёРµ Р°С‚РјРѕСЃС„РµСЂРЅС‹Рј, Р»РѕРіРёС‡РЅС‹Рј Рё РёРЅС‚РµСЂРµСЃРЅС‹Рј. РћС‚РІРµС‡Р°Р№ СЃС‚СЂРѕРіРѕ РЅР° СЂСѓСЃСЃРєРѕРј СЏР·С‹РєРµ.`;

    let instruction = '';
    if (isExpand && currentContent.trim().length > 0) {
      instruction = `РђРІС‚РѕСЂ СѓР¶Рµ РЅР°Р±СЂРѕСЃР°Р» СЃС‹СЂС‹Рµ С„Р°РєС‚С‹ РёР»Рё С‡Р°СЃС‚РёС‡РЅРѕРµ РѕРїРёСЃР°РЅРёРµ Р»РѕСЂ-СЌР»РµРјРµРЅС‚Р°:
В«${currentContent}В»
РўРІРѕСЏ Р·Р°РґР°С‡Р° вЂ” СЂР°Р·РІРёС‚СЊ СЌС‚Рё РЅР°Р±СЂРѕСЃРєРё, СЃРґРµР»Р°С‚СЊ РѕРїРёСЃР°РЅРёРµ Р±РѕР»РµРµ С…СѓРґРѕР¶РµСЃС‚РІРµРЅРЅС‹Рј, СЃРІСЏР·РЅС‹Рј, РіР»СѓР±РѕРєРёРј Рё Р°С‚РјРѕСЃС„РµСЂРЅС‹Рј, СЃРѕС…СЂР°РЅРёРІ РІСЃРµ СѓРєР°Р·Р°РЅРЅС‹Рµ Р°РІС‚РѕСЂРѕРј С„Р°РєС‚С‹. РќР°РїРёС€Рё СЂР°СЃС€РёСЂРµРЅРЅСѓСЋ РІРµСЂСЃРёСЋ, РїСЂРѕРґРѕР»Р¶Р°СЋС‰СѓСЋ Рё СѓРіР»СѓР±Р»СЏСЋС‰СѓСЋ С‚РµРєСѓС‰РµРµ СЃРѕРґРµСЂР¶Р°РЅРёРµ.`;
    } else {
      instruction = `РќР°РїРёС€Рё СЃ РЅСѓР»СЏ СЂР°Р·РІРµСЂРЅСѓС‚РѕРµ, Р°С‚РјРѕСЃС„РµСЂРЅРѕРµ Рё РёРЅС‚РµСЂРµСЃРЅРѕРµ РѕРїРёСЃР°РЅРёРµ РґР»СЏ СЌС‚РѕРіРѕ СЌР»РµРјРµРЅС‚Р° РјРёСЂР°. РћРЅРѕ РґРѕР»Р¶РЅРѕ РёРґРµР°Р»СЊРЅРѕ РІРїРёСЃС‹РІР°С‚СЊСЃСЏ РІ Р¶Р°РЅСЂ, С„РѕСЂРјР°С‚ Рё РјРµСЃС‚Рѕ РґРµР№СЃС‚РІРёСЏ РїСЂРѕРµРєС‚Р°. Р”Р°Р№ РІРѕР»СЋ С„Р°РЅС‚Р°Р·РёРё Рё РґРµС‚Р°Р»СЊРЅРѕ РїСЂРѕСЂР°Р±РѕС‚Р°Р№ РѕСЃРѕР±РµРЅРЅРѕСЃС‚Рё СЌС‚РѕРіРѕ Р»РѕСЂ-СЌР»РµРјРµРЅС‚Р°.`;
    }

    const userPrompt = `РЈ РЅР°СЃ РµСЃС‚СЊ РїСЂРѕРµРєС‚ СЃРѕ СЃР»РµРґСѓСЋС‰РёРјРё РїР°СЂР°РјРµС‚СЂР°РјРё:
${projectContext}

РќР°Р·РІР°РЅРёРµ СЌР»РµРјРµРЅС‚Р° Р»РѕСЂР°: В«${title}В»
РљР°С‚РµРіРѕСЂРёСЏ: ${categoryLabel}

РРЅСЃС‚СЂСѓРєС†РёСЏ:
${instruction}

РћС‚РІРµС‚:`;

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
