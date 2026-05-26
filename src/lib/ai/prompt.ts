/**
 * AI prompt for filling character fields.
 * Adapted from promt_1.md — outputs JSON instead of Markdown.
 */

import { CHARACTER_SCHEMA } from '@/lib/schema';
import { CharacterData } from '@/types/character';

const SYSTEM_PROMPT = `Ты — опытный сценарист и писатель, специализирующийся на разработке глубоких, многогранных персонажей для кино, сериалов и литературы.

Твоя задача — заполнить карточку персонажа. Ты получишь:
1. JSON-схему с секциями и полями
2. Уже заполненные поля персонажа

Ты должен вернуть ТОЛЬКО заполненные поля (те, которые сейчас пусты), в формате строгого JSON: {"fieldId": "значение", ...}

## Принципы заполнения:
- Не делай персонажа идеальным — противоречия, слепые зоны, парадоксы обязательны
- Покажи, а не расскажи: вместо "он боится предательства" → "проверяет телефоны близких, потому что однажды друг украл деньги и исчез"
- Добавляй сенсорные детали: как пахнет, двигается, звучит голос, какая походка
- Думай о противоречиях: внешность может не совпадать с сутью, поведение — с желаниями
- Используй конкретику: не "любит музыку", а "засыпает под джаз 50-х, потому что так делал его отец"
- Сохраняй психологическую целостность: прошлое объясняет мотивы, слабости влияют на конфликты, привычки отражают характер
- Все заполненные поля должны быть связаны между собой и с уже существующими полями

## Если информации недостаточно:
- Заполни логически, опираясь на уже известные детали
- Если поле совсем непонятно без контекста — пропусти его (не включай в ответ)

## ФОРМАТ ОТВЕТА — СТРОГО:
Верни ТОЛЬКО валидный JSON-объект. Никакого markdown, никаких пояснений, никакого текста до или после JSON.
Начинай ответ сразу с символа { и заканчивай }.

Пример правильного ответа:
{"weakness":"Неумение отказывать — говорит «да» даже в ущерб себе","strength":"Холодный ум в кризисе","angers":"Когда перебивают на полуслове"}

НЕПРАВИЛЬНО:
- Не пиши "Вот заполненная карточка:" перед JSON
- Не оборачивай JSON в \`\`\`json ... \`\`\`
- Не добавляй комментарии в JSON`;

interface FillRequest {
  existingData: CharacterData;
  sectionIds?: string[];
  context?: string;
}

export function buildFillPrompt(request: FillRequest): { system: string; user: string } {
  const { existingData, sectionIds, context } = request;

  const schemaDesc = CHARACTER_SCHEMA
    .filter(s => !sectionIds || sectionIds.includes(s.id))
    .map(section => {
      const fields = section.fields.map(f => {
        const existing = existingData[f.id]?.trim();
        return `  "${f.id}": ${existing ? `"${existing.replace(/"/g, '\\"')}"` : 'null'}  // ${f.label}${f.placeholder ? ` (пример: ${f.placeholder})` : ''}`;
      }).join('\n');
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
Верни JSON-объект ТОЛЬКО с заполненными значениями для этих полей. Начни ответ сразу с {.`;

  return { system: SYSTEM_PROMPT, user: userPrompt };
}

export function buildRegeneratePrompt(data: CharacterData, context?: string): { system: string; user: string } {
  const schemaDesc = CHARACTER_SCHEMA
    .map(section => {
      const fields = section.fields.map(f => {
        const existing = data[f.id]?.trim();
        return `  "${f.id}": ${existing ? `"${existing.replace(/"/g, '\\"')}"` : 'null'}  // ${f.label}`;
      }).join('\n');
      return `## ${section.icon} ${section.label}\n${fields}`;
    })
    .join('\n\n');

  const userPrompt = `Пересоздай этого персонажа с нуля, углубив и усилив его. Можешь менять любые поля, включая уже заполненные. Сохрани общее направление, но сделай персонажа более живым, противоречивым и конкретным.

${context ? `Контекст от автора: ${context}\n` : ''}

Текущая карточка:

${schemaDesc}

Верни JSON-объект со ВСЕМИ полями (и изменёнными, и оставленными как есть). Начни ответ сразу с {.`;

  return { system: SYSTEM_PROMPT, user: userPrompt };
}


// ── AI Character Analysis ────────────────────────────────────────

const ANALYZE_SYSTEM_PROMPT = `Ты — опытный редактор и драматург. Ты анализируешь карточки персонажей на русском языке и отвечаешь ТОЛЬКО на русском.

Найди ВСЕ проблемы в заполненных полях:
1. **Противоречия** — поле А и поле Б утверждают противоположное
2. **Слепые зоны** — важный аспект упомянут, но не раскрыт
3. **Клише** — шаблонная формулировка без конкретики
4. **Психологические нестыковки** — поведение противоречит заявленной мотивации
5. **Упущенные возможности** — напрашивающиеся связи между полями не раскрыты

## ЖЁСТКИЕ ПРАВИЛА:
- ВСЕ текстовые поля (title, description, suggestion, summary) ТОЛЬКО на русском. Ни одного английского слова.
- НИКОГДА не пиши fieldId в тексте (strength, selfDestruct, weakness и т.д.). Вместо fieldId используй РУССКОЕ НАЗВАНИЕ поля, которое указано в комментарии после //.
  * ПЛОХО: «Поле strength противоречит selfDestruct»
  * ХОРОШО: «Главная сила противоречит склонности к самоуничтожению»
- Поле severity — служебное, его значения ТОЛЬКО английские: "contradiction", "gap", "cliche", "inconsistency", "opportunity".
- В массиве fields указывай fieldId (английские ключи) — это для системы.
- Анализируй ТОЛЬКО заполненные поля. Не комментируй пустые.
- Каждая проблема ссылается на КОНКРЕТНЫЕ поля.
- Пиши конкретно. 2-4 предложения на проблему.
- Если в категории нет проблем — не включай её в ответ.

## Формат ответа — СТРОГО JSON (без markdown-обёрток):

{
  "summary": "Общее резюме на русском, 1-2 предложения",
  "categories": [
    {
      "title": "Название категории на русском",
      "icon": "🔴",
      "severity": "contradiction",
      "issues": [
        {
          "title": "Краткий заголовок на русском",
          "fields": ["fieldId1", "fieldId2"],
          "severity": "contradiction",
          "description": "Подробное объяснение на русском, 2-4 предложения",
          "suggestion": "Совет по исправлению на русском (опционально)"
        }
      ]
    }
  ]
}

Начни ответ сразу с символа { и закончи }. Никакого текста до или после.`;

export function buildAnalyzePrompt(data: import('@/types/character').CharacterData): { system: string; user: string } {
  // Build a compact representation of filled fields
  const filledFields: string[] = [];
  for (const section of CHARACTER_SCHEMA) {
    for (const field of section.fields) {
      const value = data[field.id]?.trim();
      if (value) {
        filledFields.push(`${field.label} (id: ${field.id}): "${value.replace(/"/g, '\\"')}"`);
      }
    }
  }

  const userPrompt = `Проанализируй персонажа на противоречия, слепые зоны, клише и психологические нестыковки.

ВАЖНО: в тексте ответа (title, description, suggestion) используй РУССКИЕ названия полей из комментариев (после //). fieldId только в массиве fields.

Заполненные поля (${filledFields.length}):
${filledFields.join('\n')}

Найди ВСЕ проблемы. Верни JSON строго по схеме.`;

  return { system: ANALYZE_SYSTEM_PROMPT, user: userPrompt };
}

export function parseAnalyzeResponse(raw: string): import('@/types/character').AnalyzeResult {
  const json = raw.trim();

  // Strategy 1: direct parse
  try {
    const parsed = JSON.parse(json);
    if (parsed.categories && Array.isArray(parsed.categories)) {
      return validateAnalyzeResult(parsed);
    }
  } catch {}

  // Strategy 2: remove code fences
  const fenceMatch = json.match(/\`\`\`(?:json)?\s*([\s\S]*?)\s*\`\`\`/);
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
      if (json[i] === '}') { depth--; if (depth === 0) { objEnd = i; break; } }
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

function validateAnalyzeResult(raw: Record<string, unknown>): import('@/types/character').AnalyzeResult {
  const categories = (raw.categories as any[])?.map((cat: any) => ({
    title: String(cat.title || ''),
    icon: String(cat.icon || ''),
    severity: (['contradiction', 'gap', 'cliche', 'inconsistency', 'opportunity'].includes(cat.severity) ? cat.severity : 'gap') as import('@/types/character').AnalyzeIssue['severity'],
    issues: (cat.issues as any[])?.map((iss: any) => ({
      title: String(iss.title || ''),
      fields: Array.isArray(iss.fields) ? iss.fields.map(String) : [],
      severity: (['contradiction', 'gap', 'cliche', 'inconsistency', 'opportunity'].includes(iss.severity) ? iss.severity : cat.severity || 'gap') as import('@/types/character').AnalyzeIssue['severity'],
      description: String(iss.description || ''),
      suggestion: iss.suggestion ? String(iss.suggestion) : undefined,
    })) || [],
  })) || [];

  const totalIssues = categories.reduce((sum, c) => sum + c.issues.length, 0);

  return {
    categories,
    totalIssues,
    summary: String(raw.summary || ''),
  };
}

/**
 * Parse LLM JSON response with multiple fallback strategies.
 */
export function parseFillResponse(raw: string): CharacterData {
  let json = raw.trim();

  // Strategy 1: Direct JSON parse (DeepSeek often returns clean JSON)
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
  // Remove ```json ... ``` or ``` ... ```
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
    // Find matching closing brace
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
    .replace(/['']/g, '"')     // smart quotes → straight quotes
    .replace(/\n/g, '\\n')     // literal 
    .replace(/\n/g, '\\n')     // literal \n in values
    .replace(/“/g, '"').replace(/”/g, '"')
    .replace(/«/g, '"').replace(/»/g, '"');

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

function validateAndClean(parsed: Record<string, unknown>): CharacterData {
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

export function buildFixContext(
  issues: import('@/types/character').AnalyzeIssue[],
  data: import('@/types/character').CharacterData
): string {
  // Build a map of fieldId → current value + label
  const fieldInfo: { id: string; label: string; current: string }[] = [];
  for (const section of CHARACTER_SCHEMA) {
    for (const field of section.fields) {
      if (data[field.id]?.trim()) {
        fieldInfo.push({ id: field.id, label: field.label, current: data[field.id].trim() });
      }
    }
  }
  const fieldMap = new Map(fieldInfo.map(f => [f.id, f]));

  const issueDescriptions = issues.map((iss, i) => {
    const fieldsDesc = iss.fields
      .map(fid => {
        const info = fieldMap.get(fid);
        return info
          ? `«${info.label}» (сейчас: «${info.current.slice(0, 80)}»)`
          : fid;
      })
      .join(', ');
    return `${i + 1}. **${iss.title}** (${iss.severity})\n   ${iss.description}\n   Затронутые поля: ${fieldsDesc}${iss.suggestion ? `\n   Совет: ${iss.suggestion}` : ''}`;
  }).join('\n\n');

  const uniqueFieldIds = [...new Set(issues.flatMap(i => i.fields))];

  return `## Инструкция по исправлению противоречий

Ниже — список проблем, найденных в карточке персонажа. Перепиши ТОЛЬКО указанные поля так, чтобы устранить эти проблемы. Остальные поля не трогай.

### Проблемы:
${issueDescriptions}

### Что нужно исправить:
Поля для перезаписи: ${uniqueFieldIds.map(fid => {
  const info = fieldMap.get(fid);
  return info ? `«${info.label}» (${fid})` : fid;
}).join(', ')}

ВАЖНО:
- Перепиши ТОЛЬКО эти поля. Не добавляй другие.
- Сохрани общий характер персонажа, но устрани противоречия.
- Используй конкретные, живые формулировки на русском.
- Если поле участвует в противоречии с другим — выбери одну линию и приведи поле к ней.`;
}
