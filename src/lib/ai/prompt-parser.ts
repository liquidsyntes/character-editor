import { CHARACTER_SCHEMA } from '@/lib/schema';
import { CharacterData, AnalyzeResult, AnalyzeIssue } from '@/types/character';

export function parseAnalyzeResponse(raw: string): AnalyzeResult {
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

function validateAnalyzeResult(raw: Record<string, any>): AnalyzeResult {
  const severities = [
    'contradiction',
    'gap',
    'cliche',
    'inconsistency',
    'opportunity'
  ];

  const replaceEnglishFields = (text: string): string => {
    if (!text) return text;
    let res = text;
    for (const section of CHARACTER_SCHEMA) {
      for (const field of section.fields) {
        const regex = new RegExp(`\\b${field.id}\\b`, 'g');
        res = res.replace(regex, `**${field.label}**`);
      }
    }
    return res;
  };

  const categories =
    (raw.categories as any[])?.map((cat: any) => ({
      title: String(cat.title || ''),
      icon: String(cat.icon || ''),
      severity: (severities.includes(cat.severity)
        ? cat.severity
        : 'gap') as AnalyzeIssue['severity'],
      issues:
        (cat.issues as any[])?.map((iss: any) => ({
          title: String(iss.title || ''),
          fields: Array.isArray(iss.fields) ? iss.fields.map(String) : [],
          severity: (severities.includes(iss.severity)
            ? iss.severity
            : (severities.includes(cat.severity) ? cat.severity : 'gap')) as AnalyzeIssue['severity'],
          description: replaceEnglishFields(String(iss.description || '')),
          suggestion: iss.suggestion ? replaceEnglishFields(String(iss.suggestion)) : undefined
        })) || []
    })) || [];

  const totalIssues = categories.reduce((sum, c) => sum + c.issues.length, 0);

  return {
    categories,
    totalIssues,
    summary: String(raw.summary || '')
  };
}

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
