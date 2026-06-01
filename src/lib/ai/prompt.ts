/**
 * AI prompt for filling character fields.
 * Adapted from promt_1.md — outputs JSON instead of Markdown.
 */

import { CHARACTER_SCHEMA } from '@/lib/schema';
import { CharacterData } from '@/types/character';
import { prisma } from '@/lib/prisma';
import { 
  DEFAULT_FILL_SYSTEM_PROMPT, 
  DEFAULT_ANALYZE_SYSTEM_PROMPT, 
  DEFAULT_FIX_SYSTEM_PROMPT 
} from './prompt-constants';

interface FillRequest {
  existingData: CharacterData;
  sectionIds?: string[];
  fieldIds?: string[];
  context?: string;
}

export async function getSystemPrompt(key: 'FILL_PROMPT' | 'ANALYZE_PROMPT' | 'FIX_PROMPT'): Promise<string> {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { id: key } });
    if (setting?.value) return setting.value;
  } catch (err) {
    console.error('Error fetching system prompt from DB', err);
  }
  
  if (key === 'ANALYZE_PROMPT') return DEFAULT_ANALYZE_SYSTEM_PROMPT;
  return DEFAULT_FILL_SYSTEM_PROMPT;
}

export async function buildFillPrompt(
  request: FillRequest
): Promise<{ system: string; user: string }> {
  const { existingData, sectionIds, fieldIds, context } = request;

  // Always show the whole schema so the AI has full context of the character
  const schemaDesc = CHARACTER_SCHEMA
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

  const fieldsToFill: string[] = [];
  for (const section of CHARACTER_SCHEMA) {
    if (sectionIds && !sectionIds.includes(section.id) && !fieldIds) continue;
    for (const field of section.fields) {
      if (fieldIds) {
        if (fieldIds.includes(field.id)) {
          fieldsToFill.push(field.id);
        }
      } else {
        if (!existingData[field.id] || !existingData[field.id].trim()) {
          fieldsToFill.push(field.id);
        }
      }
    }
  }

  const gender = existingData.gender?.trim();
  const genderInstruction = gender 
    ? `\nКРИТИЧЕСКИ ВАЖНО: Пол персонажа — «${gender}». Строго следи за правильными окончаниями глаголов, прилагательных и местоимениями (он/она/оно) во всех генерируемых текстах.`
    : '';

  const userPrompt = `Заполни ВСЕ требуемые поля в карточке персонажа ниже.${genderInstruction}

${context ? `Дополнительный контекст от автора: ${context}\n` : ''}

Текущая карточка персонажа (вся анкета для полного понимания контекста):

${schemaDesc}

ТЕБЕ НУЖНО ЗАПОЛНИТЬ ИЛИ ПЕРЕПИСАТЬ ТОЛЬКО ЭТИ ПОЛЯ (${fieldsToFill.length} шт): 
${fieldsToFill.join(', ')}

Если целевое поле уже содержит какой-то набросок (например, "боится пауков"), разверни это в красивый, подробный текст в соответствии с остальной карточкой и лором проекта.
Верни JSON-объект ТОЛЬКО с указанными целевыми полями. Не возвращай остальные поля.
Начни ответ сразу с { и закончи }.`;

  const system = await getSystemPrompt('FILL_PROMPT');
  return { system, user: userPrompt };
}

export async function buildRegeneratePrompt(
  data: CharacterData,
  context?: string
): Promise<{ system: string; user: string }> {
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

  const gender = data.gender?.trim();
  const genderInstruction = gender 
    ? `\nКРИТИЧЕСКИ ВАЖНО: Пол персонажа — «${gender}». Строго следи за правильными окончаниями глаголов, прилагательных и местоимениями (он/она/оно) во всех генерируемых текстах.`
    : '';

  const userPrompt = `Пересоздай этого персонажа с нуля, углубив и усилив его. Можешь менять любые поля, включая уже заполненные. Сохрани общее направление и базовую концепцию, но сделай персонажа более живым, противоречивым и конкретным.${genderInstruction}

${context ? `Контекст от автора: ${context}\n` : ''}

Текущая карточка:

${schemaDesc}

Верни один JSON-объект со ВСЕМИ полями карточки (и измененными, и оставленными как есть).
Каждое поле заполни конкретно, 1–3 емких предложения, без общих формулировок вроде "сложный человек" или "любит жизнь".
Начни ответ сразу с { и закончи }.`;

  const system = await getSystemPrompt('FILL_PROMPT');
  return { system, user: userPrompt };
}

// ── AI Character Analysis ────────────────────────────────────────

export async function buildAnalyzePrompt(
  data: import('@/types/character').CharacterData,
  context?: string
): Promise<{ system: string; user: string }> {
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

${context ? `Контекст проекта (лор, жанр, сеттинг): ${context}\n` : ''}
Важно: в текстовых полях ответа (summary, title, description, suggestion) используй только русские названия полей из комментариев (после //). fieldId указывай только внутри массива fields.

Заполненные поля (${filledFields.length}):
${filledFields.join('\n')}

Найди все проблемы, но не выдумывай надуманные, если текста мало. Верни JSON строго по описанной схеме, без markdown и пояснений.`;

  const system = await getSystemPrompt('ANALYZE_PROMPT');
  return { system, user: userPrompt };
}



// ── AI Fix Issues Prompt ────────────────────────────────────────

export async function buildFixPrompt(
  issues: import('@/types/character').AnalyzeIssue[],
  data: import('@/types/character').CharacterData,
  context?: string
): Promise<{ system: string; user: string }> {
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

  const gender = data.gender?.trim();
  const genderInstruction = gender 
    ? `\nКРИТИЧЕСКИ ВАЖНО: Пол персонажа — «${gender}». Строго следи за правильными окончаниями глаголов, прилагательных и местоимениями (он/она/оно) при переписывании полей.`
    : '';

  const userPrompt = `Инструкция по исправлению противоречий и проблем в карточке персонажа.${genderInstruction}

${context ? `Контекст проекта (лор, жанр, сеттинг): ${context}\n` : ''}
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

  const system = await getSystemPrompt('FIX_PROMPT') || DEFAULT_FIX_SYSTEM_PROMPT;
  return { system, user: userPrompt };
}