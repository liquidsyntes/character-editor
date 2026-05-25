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
