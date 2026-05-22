import { CHARACTER_SCHEMA } from '@/lib/schema';
import { CharacterData } from '@/types/character';

export function exportToMarkdown(data: CharacterData, name?: string): string {
  const lines: string[] = [];

  const charName = name || data.name || 'Безымянный персонаж';
  lines.push(`# ${charName}`);
  lines.push('');

  for (const section of CHARACTER_SCHEMA) {
    const filledFields = section.fields.filter(
      f => data[f.id] && data[f.id].trim() !== ''
    );

    if (filledFields.length === 0) continue;

    lines.push(`## ${section.icon} ${section.label}`);
    lines.push('');

    for (const field of filledFields) {
      lines.push(`**${field.label}**`);
      lines.push(data[field.id]);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function exportToJSON(data: CharacterData, name?: string): string {
  const structured: Record<string, Record<string, string>> = {};

  for (const section of CHARACTER_SCHEMA) {
    const sectionData: Record<string, string> = {};
    for (const field of section.fields) {
      if (data[field.id] && data[field.id].trim() !== '') {
        sectionData[field.label] = data[field.id];
      }
    }
    if (Object.keys(sectionData).length > 0) {
      structured[section.label] = sectionData;
    }
  }

  return JSON.stringify(
    { name: name || data.name || 'Безымянный персонаж', sections: structured },
    null,
    2
  );
}

export function exportToPlainText(data: CharacterData, name?: string): string {
  const lines: string[] = [];

  const charName = name || data.name || 'Безымянный персонаж';
  lines.push(charName.toUpperCase());
  lines.push('═'.repeat(charName.length + 4));
  lines.push('');

  for (const section of CHARACTER_SCHEMA) {
    const filledFields = section.fields.filter(
      f => data[f.id] && data[f.id].trim() !== ''
    );

    if (filledFields.length === 0) continue;

    lines.push(`── ${section.label} ──`);
    lines.push('');

    for (const field of filledFields) {
      lines.push(`${field.label}: ${data[field.id]}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
