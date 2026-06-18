import { CHARACTER_SCHEMA } from '@/lib/schema';
import { CharacterData, AnalyzeResult, AnalyzeIssue } from '@/types/character';

export function removeThinking(text: string): string {
  // First remove all closed <think> blocks
  let result = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  // Then remove any unclosed <think> block at the end (e.g. if generation hit max tokens)
  result = result.replace(/<think>[\s\S]*$/g, '');
  return result.trim();
}

export function extractFirstJsonObject(text: string): string | null {
  const objStart = text.indexOf('{');
  if (objStart < 0) return null;

  let depth = 0;
  let objEnd = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = objStart; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') {
        depth--;
        if (depth === 0) {
          objEnd = i;
          break;
        }
      }
    }
  }

  return objEnd > objStart ? text.slice(objStart, objEnd + 1) : null;
}


export function parseAnalyzeResponse(raw: string): AnalyzeResult {
  const json = removeThinking(raw);

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

  // Strategy 3: find JSON object (ignoring braces inside strings)
  const extracted = extractFirstJsonObject(json);
  if (extracted) {
    try {
      const parsed = JSON.parse(extracted);
      if (parsed.categories && Array.isArray(parsed.categories)) {
        return validateAnalyzeResult(parsed);
      }
    } catch {}
  }

  throw new Error(`Не удалось разобрать ответ AI — невалидный JSON. Вывод: ${json.slice(0, 100)}...`);
}

function validateAnalyzeResult(raw: Record<string, unknown>): AnalyzeResult {
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
    (Array.isArray(raw.categories) ? raw.categories : []).map((catItem) => {
      const cat = catItem as Record<string, unknown>;
      const issuesRaw = Array.isArray(cat.issues) ? cat.issues : [];
      return {
        title: String(cat.title || ''),
        icon: String(cat.icon || ''),
        severity: (severities.includes(String(cat.severity))
          ? cat.severity
          : 'gap') as AnalyzeIssue['severity'],
        issues: issuesRaw.map((issItem) => {
          const iss = issItem as Record<string, unknown>;
          return {
            title: String(iss.title || ''),
            fields: Array.isArray(iss.fields) ? iss.fields.map(String) : [],
            severity: (severities.includes(String(iss.severity))
              ? iss.severity
              : (severities.includes(String(cat.severity)) ? cat.severity : 'gap')) as AnalyzeIssue['severity'],
            description: replaceEnglishFields(String(iss.description || '')),
            suggestion: iss.suggestion ? replaceEnglishFields(String(iss.suggestion)) : undefined
          };
        })
      };
    });

  const totalIssues = categories.reduce((sum, c) => sum + c.issues.length, 0);

  return {
    categories,
    totalIssues,
    summary: String(raw.summary || '')
  };
}

export function parseFillResponse(raw: string): CharacterData {
  const json = removeThinking(raw);

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

  // Strategy 3: Find JSON object by scanning for { } boundaries (ignoring braces inside strings)
  const extracted = extractFirstJsonObject(cleaned);
  if (extracted) {
    try {
      const parsed = JSON.parse(extracted);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return validateAndClean(parsed);
      }
    } catch {
      // last resort below
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

export async function fetchSseStream(
  response: Response,
  onData: (dataStr: string) => void
) {
  if (!response.body) throw new Error('No body in response');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const line = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') return;
          onData(dataStr);
        }
        boundary = buffer.indexOf('\n\n');
      }
    }
  } finally {
    reader.releaseLock();
  }
}
