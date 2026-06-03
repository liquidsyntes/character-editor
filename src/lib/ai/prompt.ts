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
  DEFAULT_FIX_SYSTEM_PROMPT,
  DEFAULT_USER_FILL_PROMPT,
  DEFAULT_USER_REGENERATE_PROMPT,
  DEFAULT_USER_ANALYZE_PROMPT,
  DEFAULT_USER_FIX_PROMPT,
  DEFAULT_SCRATCHPAD_SYSTEM_PROMPT,
  DEFAULT_USER_SCRATCHPAD_PROMPT,
  DEFAULT_QUICK_COMMAND_SYSTEM_PROMPT,
  DEFAULT_USER_QUICK_COMMAND_PROMPT
} from './prompt-constants';

interface FillRequest {
  existingData: CharacterData;
  sectionIds?: string[];
  fieldIds?: string[];
  context?: string;
}

export type PromptKey = 'FILL_PROMPT' | 'ANALYZE_PROMPT' | 'FIX_PROMPT' | 'USER_FILL_PROMPT' | 'USER_REGENERATE_PROMPT' | 'USER_ANALYZE_PROMPT' | 'USER_FIX_PROMPT' | 'SCRATCHPAD_PROMPT' | 'USER_SCRATCHPAD_PROMPT' | 'QUICK_COMMAND_PROMPT' | 'USER_QUICK_COMMAND_PROMPT';

export async function getPromptTemplate(key: PromptKey): Promise<string> {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { id: key } });
    if (setting?.value) return setting.value;
  } catch (err) {
    console.error('Error fetching prompt from DB', err);
  }
  
  switch(key) {
    case 'ANALYZE_PROMPT': return DEFAULT_ANALYZE_SYSTEM_PROMPT;
    case 'FIX_PROMPT': return DEFAULT_FIX_SYSTEM_PROMPT;
    case 'FILL_PROMPT': return DEFAULT_FILL_SYSTEM_PROMPT;
    case 'USER_FILL_PROMPT': return DEFAULT_USER_FILL_PROMPT;
    case 'USER_REGENERATE_PROMPT': return DEFAULT_USER_REGENERATE_PROMPT;
    case 'USER_ANALYZE_PROMPT': return DEFAULT_USER_ANALYZE_PROMPT;
    case 'USER_FIX_PROMPT': return DEFAULT_USER_FIX_PROMPT;
    case 'SCRATCHPAD_PROMPT': return DEFAULT_SCRATCHPAD_SYSTEM_PROMPT;
    case 'USER_SCRATCHPAD_PROMPT': return DEFAULT_USER_SCRATCHPAD_PROMPT;
    case 'QUICK_COMMAND_PROMPT': return DEFAULT_QUICK_COMMAND_SYSTEM_PROMPT;
    case 'USER_QUICK_COMMAND_PROMPT': return DEFAULT_USER_QUICK_COMMAND_PROMPT;
    default: return DEFAULT_FILL_SYSTEM_PROMPT;
  }
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
    
  const contextInstruction = context ? `Дополнительный контекст от автора: ${context}\n` : '';

  const userTemplate = await getPromptTemplate('USER_FILL_PROMPT');
  const userPrompt = userTemplate
    .replace('{{GENDER_INSTRUCTION}}', genderInstruction)
    .replace('{{CONTEXT}}', contextInstruction)
    .replace('{{SCHEMA_DESC}}', schemaDesc)
    .replace('{{FIELDS_TO_FILL_COUNT}}', String(fieldsToFill.length))
    .replace('{{FIELDS_TO_FILL}}', fieldsToFill.join(', '));

  const system = await getPromptTemplate('FILL_PROMPT');
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
    
  const contextInstruction = context ? `Контекст от автора: ${context}\n` : '';

  const userTemplate = await getPromptTemplate('USER_REGENERATE_PROMPT');
  const userPrompt = userTemplate
    .replace('{{GENDER_INSTRUCTION}}', genderInstruction)
    .replace('{{CONTEXT}}', contextInstruction)
    .replace('{{SCHEMA_DESC}}', schemaDesc);

  const system = await getPromptTemplate('FILL_PROMPT');
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

  const contextInstruction = context ? `Контекст проекта (лор, жанр, сеттинг): ${context}\n` : '';

  const userTemplate = await getPromptTemplate('USER_ANALYZE_PROMPT');
  const userPrompt = userTemplate
    .replace('{{CONTEXT}}', contextInstruction)
    .replace('{{FILLED_FIELDS_COUNT}}', String(filledFields.length))
    .replace('{{FILLED_FIELDS}}', filledFields.join('\n'));

  const system = await getPromptTemplate('ANALYZE_PROMPT');
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
    
  const contextInstruction = context ? `Контекст проекта (лор, жанр, сеттинг): ${context}\n` : '';
  
  const fieldsForRewrite = uniqueFieldIds
    .map((fid) => {
      const info = fieldMap.get(fid);
      return info ? `«${info.label}» (${fid})` : fid;
    })
    .join(', ');

  const userTemplate = await getPromptTemplate('USER_FIX_PROMPT');
  const userPrompt = userTemplate
    .replace('{{GENDER_INSTRUCTION}}', genderInstruction)
    .replace('{{CONTEXT}}', contextInstruction)
    .replace('{{ISSUE_DESCRIPTIONS}}', issueDescriptions)
    .replace('{{UNIQUE_FIELD_IDS}}', fieldsForRewrite);

  const system = (await getPromptTemplate('FIX_PROMPT')) || DEFAULT_FIX_SYSTEM_PROMPT;
  return { system, user: userPrompt };
}

// ── AI Scratchpad & Quick Commands ───────────────────────────────────

export async function buildScratchpadPrompt(
  existingData: CharacterData,
  scratchpadText: string,
  context?: string
): Promise<{ system: string; user: string }> {
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

  const gender = existingData.gender?.trim();
  const genderInstruction = gender 
    ? `\nКРИТИЧЕСКИ ВАЖНО: Пол персонажа — «${gender}». Строго следи за правильными окончаниями глаголов, прилагательных и местоимениями (он/она/оно) во всех генерируемых текстах.`
    : '';
    
  const contextInstruction = context ? `Дополнительный контекст от автора: ${context}\n` : '';

  const userTemplate = await getPromptTemplate('USER_SCRATCHPAD_PROMPT');
  const userPrompt = userTemplate
    .replace('{{SCRATCHPAD_TEXT}}', scratchpadText)
    .replace('{{GENDER_INSTRUCTION}}', genderInstruction)
    .replace('{{CONTEXT}}', contextInstruction)
    .replace('{{SCHEMA_DESC}}', schemaDesc);

  const system = await getPromptTemplate('SCRATCHPAD_PROMPT');
  return { system, user: userPrompt };
}

export async function buildQuickCommandPrompt(
  existingData: CharacterData,
  commandType: 'lifeEvent' | 'hiddenMotive' | 'innerConflict',
  context?: string
): Promise<{ system: string; user: string }> {
  const schemaDesc = CHARACTER_SCHEMA
    .map((section) => {
      const fields = section.fields
        .map((f) => {
          const existing = existingData[f.id]?.trim();
          return `  "${f.id}": ${
            existing ? `"${existing.replace(/"/g, '\\"')}"` : 'null'
          } // ${f.label}`;
        })
        .join('\n');
      return `## ${section.icon} ${section.label}\n${fields}`;
    })
    .join('\n\n');

  const gender = existingData.gender?.trim();
  const genderInstruction = gender 
    ? `\nКРИТИЧЕСКИ ВАЖНО: Пол персонажа — «${gender}». Строго следи за правильными окончаниями глаголов, прилагательных и местоимениями (он/она/оно) во всех генерируемых текстах.`
    : '';
    
  const contextInstruction = context ? `Дополнительный контекст от автора: ${context}\n` : '';

  let commandInstruction = '';
  if (commandType === 'lifeEvent') {
    commandInstruction = 'Сгенерируй случайное значимое событие из прошлого персонажа, которое оставило глубокий отпечаток на его характере и поведении. Обнови такие поля как: keyEvent (Ключевое событие), untoldPast (Что никогда не рассказывал о прошлом), innerPain (Внутренняя боль) или marks (Особые приметы - например, шрам).';
  } else if (commandType === 'hiddenMotive') {
    commandInstruction = 'Придумай скрытый мотив или тайную потребность, которая противоречит внешне заявленной цели персонажа. Обнови такие поля как: statedVsHiddenGoal (Заявленная цель vs скрытая потребность), maskedFear (Скрытый страх), selfDenial (В чём себе не признается).';
  } else if (commandType === 'innerConflict') {
    commandInstruction = 'Создай глубокий внутренний конфликт между убеждениями персонажа и его реальными поступками. Обнови такие поля как: conflictType (Тип конфликта), coreContradiction (Главное противоречие), hypocrisy (Лицемерие) или doubleStandard (Двойные стандарты).';
  }

  const userTemplate = await getPromptTemplate('USER_QUICK_COMMAND_PROMPT');
  const userPrompt = userTemplate
    .replace('{{COMMAND_INSTRUCTION}}', commandInstruction)
    .replace('{{GENDER_INSTRUCTION}}', genderInstruction)
    .replace('{{CONTEXT}}', contextInstruction)
    .replace('{{SCHEMA_DESC}}', schemaDesc);

  const system = await getPromptTemplate('QUICK_COMMAND_PROMPT');
  return { system, user: userPrompt };
}