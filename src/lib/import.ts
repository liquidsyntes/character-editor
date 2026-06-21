import { CHARACTER_SCHEMA } from './schema';
import { CharacterData } from '@/types/character';

export function parseImportedFile(fileText: string): Partial<CharacterData> {
  const result: Record<string, string> = {};

  // Try parsing as JSON first
  try {
    const parsed = JSON.parse(fileText);
    if (parsed && typeof parsed === 'object') {
      // Check if it's the export format (nested with 'sections')
      if (parsed.sections && typeof parsed.sections === 'object') {
        for (const section of CHARACTER_SCHEMA) {
          const sectionData = parsed.sections[section.label];
          if (!sectionData || typeof sectionData !== 'object') continue;

          for (const field of section.fields) {
            const val = sectionData[field.label];
            if (typeof val === 'string' && val.trim() !== '') {
              result[field.id] = val.trim();
            }
          }
        }
      } 
      // Check if it's a SillyTavern Character Card V2 format
      else if (parsed.spec === 'chara_card_v2' && parsed.data) {
        const cardData = parsed.data;
        if (typeof cardData.name === 'string') {
          result.firstName = cardData.name.split(' ')[0];
          result.lastName = cardData.name.split(' ').slice(1).join(' ');
        }
        
        if (typeof cardData.description === 'string' && cardData.description.trim()) {
          const lines = cardData.description.split('\n');
          let currentSection = '';
          
          for (const line of lines) {
            const sectionMatch = line.match(/^\[(.*?)\]$/);
            if (sectionMatch) {
              currentSection = sectionMatch[1];
              continue;
            }
            
            let matched = false;
            for (const sec of CHARACTER_SCHEMA) {
              if (sec.label === currentSection) {
                for (const field of sec.fields) {
                  if (line.startsWith(field.label + ': ')) {
                    result[field.id] = line.slice(field.label.length + 2).trim();
                    matched = true;
                    break;
                  }
                }
              }
              if (matched) break;
            }
          }
        }
        
        if (typeof cardData.personality === 'string' && cardData.personality.trim()) {
           const lines = cardData.personality.split('\n');
           for (const line of lines) {
              let matched = false;
              for (const sec of CHARACTER_SCHEMA) {
                for (const field of sec.fields) {
                  if (line.startsWith(field.label + ': ')) {
                    result[field.id] = line.slice(field.label.length + 2).trim();
                    matched = true;
                    break;
                  }
                }
                if (matched) break;
              }
           }
        }
      }
      // Otherwise, fallback to flat format
      else {
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string' && v.trim() && k !== 'characterId' && k !== 'projectId') {
            result[k] = v.trim();
          }
        }
      }
      return result as Partial<CharacterData>;
    }
  } catch {
    // Not a valid JSON, fall through to try parsing as Markdown
  }

  // Markdown parsing (handles standard Export and Obsidian Export)
  const lines = fileText.split('\n');
  let currentField: string | null = null;
  let currentFieldValue: string[] = [];

  const saveCurrentField = () => {
    if (currentField && currentFieldValue.length > 0) {
      // Find the field in schema
      for (const section of CHARACTER_SCHEMA) {
        for (const field of section.fields) {
          if (field.label === currentField) {
            result[field.id] = currentFieldValue.join('\n').trim();
            break;
          }
        }
      }
    }
  };

  for (const line of lines) {
    // Check for Obsidian inline field: **Field**:: Value
    const obsidianMatch = line.match(/^\*\*([^*]+)\*\*::\s*(.*)$/);
    if (obsidianMatch) {
      saveCurrentField();
      currentField = obsidianMatch[1].trim();
      currentFieldValue = [obsidianMatch[2].trim()];
      saveCurrentField(); // Single line value
      currentField = null;
      currentFieldValue = [];
      continue;
    }

    // Check for Markdown standard export field: **Field**
    const mdMatch = line.match(/^\*\*([^*]+)\*\*$/);
    if (mdMatch) {
      saveCurrentField();
      currentField = mdMatch[1].trim();
      currentFieldValue = [];
      continue;
    }

    if (currentField) {
      currentFieldValue.push(line);
    }
  }
  saveCurrentField();

  return result as Partial<CharacterData>;
}
