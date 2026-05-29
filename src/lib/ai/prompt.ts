/**
 * AI prompt for filling character fields.
 * Adapted from promt_1.md — outputs JSON instead of Markdown.
 */

import { CHARACTER_SCHEMA } from '@/lib/schema';
import { CharacterData } from '@/types/character';

const SYSTEM_PROMPT = `Ты опытный сценарист и писатель, специализирующийся на разработке глубоких, многогранных персонажей для кино, сериалов и литературы.

Твоя задача заполнить карточку персонажа. Ты получишь:
1. JSON-схему с секциями и полями
2. Уже заполненные поля персонажа

Ты должен вернуть ТОЛЬКО отсутствующие (пустые) поля в формате строгого JSON: {"fieldId": "значение", ...}.

## Жесткие правила формата:
- Верни только один валидный JSON-объект верхнего уровня.
- Никакого markdown, никаких пояснений, никакого текста до или после JSON.
- Не оборачивай ответ в \` \`\`\`json\` или другие кодовые блоки.
- Не добавляй комментарии в JSON.
- Не возвращай уже заполненные поля.
- Если поле невозможно логично заполнить по текущему контексту, просто не включай его в JSON.
- Все значения полей по умолчанию строки (если явно не указано иное в схеме).
- Отвечай строго на русском языке.
- Приоритет: сначала строгий формат и валидный JSON, потом креатив.

## Принципы заполнения:
- Не делай персонажа идеальным, противоречия, слепые зоны, парадоксы обязательны.
- Показывай через действия и детали, а не через абстрактные утверждения.
- Вместо "он боится предательства" лучше "по привычке проверяет телефоны близких после того, как друг однажды украл деньги и исчез".
- Добавляй сенсорные детали: запахи, звуки, пластика тела, тембр голоса, манера походки.
- Думай о противоречиях: внешность может конфликтовать с внутренним миром, поведение с желаниями, слова с поступками.
- Используй конкретику: не "любит музыку", а "засыпает под джаз 50-х, потому что так засыпал его отец".
- Сохраняй психологическую целостность: прошлое объясняет мотивы, слабости порождают конфликты, привычки отражают характер.
- Все новые поля должны логично соотноситься друг с другом и с уже существующими полями, усиливая общую драматургию персонажа.
- На одно поле 1–3 коротких, емких предложения без воды и общих фраз.

## Если информации недостаточно:
- Достраивай логически исходя из уже известных деталей и жанрового ощущения персонажа.
- Если значение поля принципиально непонятно без дополнительного контекста, не выдумывай абстракцию, просто не включай это поле в JSON.

## Формат ответа строго:
Верни ТОЛЬКО валидный JSON-объект верхнего уровня. Начни ответ сразу с символа { и закончи }. Никакого текста до или после JSON.

Пример правильного ответа:
{"weakness":"Не умеет отказывать, автоматически говорит «да» даже в ущерб себе","strength":"В кризисе становится холодным и сосредоточенным, словно переключает режим","angers":"Резко злится, когда его перебивают на полуслове"}

Неправильно:
- Не пиши "Вот заполненная карточка:" перед JSON.
- Не оборачивай JSON в \`\`\`json ... \`\`\`.
- Не добавляй комментарии или пояснения внутрь JSON.`;

interface FillRequest {
  existingData: CharacterData;
  sectionIds?: string[];
  context?: string;
}

export function buildFillPrompt(
  request: FillRequest
): { system: string; user: string } {
  const { existingData, sectionIds, context } = request;

  const schemaDesc = CHARACTER_SCHEMA
    .filter((s) => !sectionIds || sectionIds.includes(s.id))
    .map((section) => {
      const fields = section.fields
        .map((f) => {
          const existing = existingData[f.id]?.trim();
          return `  "${f.id}": ${
            existing ? `"${existing.replace(/"/g, '\\"')}"` : 'null'
          } // ${f.label}${
            f.placeholder ? ` (пример: ${f.placeholder})` : ''
          }`;
        })
        .join('\n');
      return `## ${section.icon} ${section.label}\n${fields}`;
    })
    .join('\n\n');

  const emptyFields: string[] = [];
  for (const section of CHARACTER_SCHEMA) {
    if (sectionIds && !sectionIds.includes(section.id)) continue;
    for (const field of section.fields) {
      if (!existingData[field.id] || !existingData[field.id].trim()) {
        emptyFields.push(field.id);
      }
    }
  }

  const userPrompt = `Заполни ВСЕ пустые поля (null) в карточке персонажа ниже.

${context ? `Дополнительный контекст от автора: ${context}\n` : ''}

Текущая карточка персонажа (поля с null нужно заполнить):

${schemaDesc}

Пустых полей для заполнения: ${emptyFields.length}.
Верни JSON-объект ТОЛЬКО с заполненными значениями для этих полей. Не включай уже заполненные поля и не добавляй новые ключи.
Начни ответ сразу с { и закончи }.`;

  return { system: SYSTEM_PROMPT, user: userPrompt };
}

export function buildRegeneratePrompt(
  data: CharacterData,
  context?: string
): { system: string; user: string } {
  const schemaDesc = CHARACTER_SCHEMA
    .map((section) => {
      const fields = section.fields
        .map((f) => {
          const existing = data[f.id]?.trim();
          return `  "${f.id}": ${
            existing ? `"${existing.replace(/"/g, '\\"')}"` : 'null'
          } // ${f.label}`;
        })
        .join('\n');
      return `## ${section.icon} ${section.label}\n${fields}`;
    })
    .join('\n\n');

  const userPrompt = `Пересоздай этого персонажа с нуля, углубив и усилив его. Можешь менять любые поля, включая уже заполненные. Сохрани общее направление и базовую концепцию, но сделай персонажа более живым, противоречивым и конкретным.

${context ? `Контекст от автора: ${context}\n` : ''}

Текущая карточка:

${schemaDesc}

Верни один JSON-объект со ВСЕМИ полями карточки (и измененными, и оставленными как есть).
Каждое поле заполни конкретно, 1–3 емких предложения, без общих формулировок вроде "сложный человек" или "любит жизнь".
Начни ответ сразу с { и закончи }.`;

  return { system: SYSTEM_PROMPT, user: userPrompt };
}

// ── AI Character Analysis ────────────────────────────────────────

const ANALYZE_SYSTEM_PROMPT = `Ты опытный редактор и драматург. Ты анализируешь карточки персонажей на русском языке и отвечаешь только на русском.

Найди все проблемы в заполненных полях:
1. Противоречия, когда одно поле расходится по смыслу с другим.
2. Слепые зоны, когда важный аспект упомянут, но не раскрыт.
3. Клише, когда формулировка шаблонная и без конкретики.
4. Психологические нестыковки, когда поведение противоречит заявленной мотивации или прошлому.
5. Упущенные возможности, когда напрашивающиеся связи между полями не раскрыты.

## Жесткие правила:
- Все текстовые поля (summary, title, description, suggestion) строго на русском языке, без английских слов.
- Никогда не используй fieldId (strength, selfDestruct, weakness и т.п.) в человекочитаемом тексте.
  Вместо fieldId используй русское название поля, указанное в комментарии после //.
  Плохо: "Поле strength противоречит selfDestruct".
  Хорошо: "Главная сила противоречит склонности к самоуничтожению".
- Поле severity служебное, его значения только английские: "contradiction", "gap", "cliche", "inconsistency", "opportunity".
- В массиве fields указывай fieldId (английские ключи) это нужно системе.
- Анализируй только заполненные поля. Не комментируй пустые.
- Каждая проблема должна ссылаться на конкретные поля в массиве fields.
- Пиши конкретно: 2–4 предложения на одну проблему, без общей воды.
- Если в какой-то категории нет проблем, эту категорию в ответ не включай.

## Формат ответа строго JSON (без markdown-оберток):
{
  "summary": "Краткое общее резюме на русском, 1–2 предложения",
  "categories": [
    {
      "title": "Название категории на русском",
      "icon": "🔴",
      "severity": "contradiction",
      "issues": [
        {
          "title": "Краткий заголовок проблемы на русском",
          "fields": ["fieldId1", "fieldId2"],
          "severity": "contradiction",
          "description": "Подробное объяснение на русском, 2–4 предложения",
          "suggestion": "Совет по исправлению на русском (опционально)"
        }
      ]
    }
  ]
}

Начни ответ сразу с символа { и закончи }. Никакого текста до или после.`;

export function buildAnalyzePrompt(
  data: import('@/types/character').CharacterData
): { system: string; user: string } {
  // Build a compact representation of filled fields
  const filledFields: string[] = [];
  for (const section of CHARACTER_SCHEMA) {
    for (const field of section.fields) {
      const value = data[field.id]?.trim();
      if (value) {
        filledFields.push(
          `${field.label} (id: ${field.id}): "${value.replace(/"/g, '\\"')}"`
        );
      }
    }
  }

  const userPrompt = `Проанализируй персонажа на противоречия, слепые зоны, клише, психологические нестыковки и упущенные возможности.

Важно: в текстовых полях ответа (summary, title, description, suggestion) используй только русские названия полей из комментариев (после //). fieldId указывай только внутри массива fields.

Заполненные поля (${filledFields.length}):
${filledFields.join('\n')}

Найди все проблемы, но не выдумывай надуманные, если текста мало. Верни JSON строго по описанной схеме, без markdown и пояснений.`;

  return { system: ANALYZE_SYSTEM_PROMPT, user: userPrompt };
}

export function parseAnalyzeResponse(
  raw: string
): import('@/types/character').AnalyzeResult {
  const json = raw.trim();

  // Strategy 1: direct parse
  try {
    const parsed = JSON.parse(json);
    if (parsed.categories && Array.isArray(parsed.categories)) {
      return validateAnalyzeResult(parsed);
    }
  } catch {}

  // Strategy 2: remove code fences
  const fenceMatch = json.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (parsed.categories && Array.isArray(parsed.categories)) {
        return validateAnalyzeResult(parsed);
      }
    } catch {}
  }

  // Strategy 3: find JSON object
  const objStart = json.indexOf('{');
  if (objStart >= 0) {
    let depth = 0;
    let objEnd = -1;
    for (let i = objStart; i < json.length; i++) {
      if (json[i] === '{') depth++;
      if (json[i] === '}') {
        depth--;
        if (depth === 0) {
          objEnd = i;
          break;
        }
      }
    }
    if (objEnd > objStart) {
      try {
        const parsed = JSON.parse(json.slice(objStart, objEnd + 1));
        if (parsed.categories && Array.isArray(parsed.categories)) {
          return validateAnalyzeResult(parsed);
        }
      } catch {}
    }
  }

  throw new Error('Не удалось разобрать ответ AI — невалидный JSON');
}

function validateAnalyzeResult(
  raw: Record<string, any>
): import('@/types/character').AnalyzeResult {
  const severities = [
    'contradiction',
    'gap',
    'cliche',
    'inconsistency',
    'opportunity'
  ];

  const categories =
    (raw.categories as any[])?.map((cat: any) => ({
      title: String(cat.title || ''),
      icon: String(cat.icon || ''),
      severity: (severities.includes(cat.severity)
        ? cat.severity
        : 'gap') as import('@/types/character').AnalyzeIssue['severity'],
      issues:
        (cat.issues as any[])?.map((iss: any) => ({
          title: String(iss.title || ''),
          fields: Array.isArray(iss.fields)
            ? iss.fields.map(String)
            : [],
          severity: (severities.includes(iss.severity)
            ? iss.severity
            : cat.severity || 'gap') as import('@/types/character').AnalyzeIssue['severity'],
          description: String(iss.description || ''),
          suggestion: iss.suggestion ? String(iss.suggestion) : undefined
        })) || []
    })) || [];

  const totalIssues = categories.reduce(
    (sum, c) => sum + c.issues.length,
    0
  );

  return {
    categories,
    totalIssues,
    summary: String(raw.summary || '')
  };
}

/**
 * Parse LLM JSON response with multiple fallback strategies.
 */
export function parseFillResponse(raw: string): CharacterData {
  let json = raw.trim();

  // Strategy 1: Direct JSON parse
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      return validateAndClean(parsed);
    }
  } catch {
    // continue to next strategy
  }

  // Strategy 2: Remove markdown code fences
  let cleaned = json;
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
    try {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return validateAndClean(parsed);
      }
    } catch {
      // continue
    }
  }

  // Strategy 3: Find JSON object by scanning for { } boundaries
  const objStart = cleaned.indexOf('{');
  if (objStart >= 0) {
    let depth = 0;
    let objEnd = -1;
    for (let i = objStart; i < cleaned.length; i++) {
      if (cleaned[i] === '{') depth++;
      if (cleaned[i] === '}') {
        depth--;
        if (depth === 0) {
          objEnd = i;
          break;
        }
      }
    }

    if (objEnd > objStart) {
      const extracted = cleaned.slice(objStart, objEnd + 1);
      try {
        const parsed = JSON.parse(extracted);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          return validateAndClean(parsed);
        }
      } catch {
        // last resort below
      }
    }
  }

  // Strategy 4: Try to fix common JSON issues and retry
  const fixed = cleaned
    .replace(/[“”«»]/g, '"')
    .replace(/\n/g, '\\n');

  try {
    const parsed = JSON.parse(fixed);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      return validateAndClean(parsed);
    }
  } catch {
    // give up
  }

  throw new Error('No JSON object found in AI response');
}

function validateAndClean(parsed: Record<string, any>): CharacterData {
  const validIds = new Set<string>();
  for (const section of CHARACTER_SCHEMA) {
    for (const field of section.fields) {
      validIds.add(field.id);
    }
  }

  const result: CharacterData = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (!validIds.has(key)) {
      console.warn(`Unknown field ID in AI response: "${key}", skipping`);
      continue;
    }
    if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim();
    }
  }

  return result;
}

// ── AI Fix Issues Prompt ────────────────────────────────────────

const FIX_SYSTEM_PROMPT = `Ты — опытный сценарист-редактор. Твоя задача — исправить указанные проблемы в карточке персонажа, переписав конкретные поля.
Верни ТОЛЬКО валидный JSON-объект, содержащий исправленные значения полей. Ключами должны быть ID полей, значениями — новый текст. Никакого markdown, никаких комментариев до или после JSON. Начинай ответ сразу с { и заканчивай }.`;

export function buildFixPrompt(
  issues: import('@/types/character').AnalyzeIssue[],
  data: import('@/types/character').CharacterData
): { system: string; user: string } {
  // Build a map of fieldId → current value + label
  const fieldInfo: { id: string; label: string; current: string }[] = [];
  for (const section of CHARACTER_SCHEMA) {
    for (const field of section.fields) {
      if (data[field.id]?.trim()) {
        fieldInfo.push({
          id: field.id,
          label: field.label,
          current: data[field.id].trim()
        });
      }
    }
  }

  const fieldMap = new Map(fieldInfo.map((f) => [f.id, f]));

  const issueDescriptions = issues
    .map((iss, i) => {
      const fieldsDesc = iss.fields
        .map((fid) => {
          const info = fieldMap.get(fid);
          return info
            ? `«${info.label}» (сейчас: «${info.current.slice(0, 80)}»)`
            : fid;
        })
        .join(', ');
      return `${i + 1}. ${iss.title} (${iss.severity})
${iss.description}
Затронутые поля: ${fieldsDesc}${
        iss.suggestion ? `\nСовет: ${iss.suggestion}` : ''
      }`;
    })
    .join('\n\n');

  const uniqueFieldIds = [...new Set(issues.flatMap((i) => i.fields))];

  const userPrompt = `Инструкция по исправлению противоречий и проблем в карточке персонажа.

Ниже перечислены проблемы, найденные в описании. Перепиши только указанные поля так, чтобы устранить эти проблемы. Остальные поля не трогай.

Проблемы:
${issueDescriptions}

Что нужно исправить:
Поля для перезаписи: ${uniqueFieldIds
    .map((fid) => {
      const info = fieldMap.get(fid);
      return info ? `«${info.label}» (${fid})` : fid;
    })
    .join(', ')}

Важно:
- Перепиши только эти поля. Не добавляй новые.
- Сохрани общий характер и основную линию персонажа, но устрани противоречия и клише.
- Пиши конкретно, живым русским языком, 1–3 предложения на поле.
- Показывай изменения через детали и поведение, а не через абстрактные ярлыки.`;

  return { system: FIX_SYSTEM_PROMPT, user: userPrompt };
}