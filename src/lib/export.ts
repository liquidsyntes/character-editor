import { CHARACTER_SCHEMA } from '@/lib/schema';
import { CharacterData } from '@/types/character';

function deriveName(data: CharacterData, name?: string): string {
  return name || [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Безымянный персонаж';
}

export function exportToMarkdown(data: CharacterData, name?: string): string {
  const lines: string[] = [];

  const charName = deriveName(data, name);
  lines.push(`# ${charName}`);
  lines.push('');

  for (const section of CHARACTER_SCHEMA) {
    lines.push(`## ${section.icon} ${section.label}`);
    lines.push('');

    for (const field of section.fields) {
      const value = data[field.id]?.trim();
      lines.push(`**${field.label}**`);
      lines.push(value ? data[field.id] : '*[не заполнено]*');
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
    { name: deriveName(data, name), sections: structured },
    null,
    2
  );
}

export function exportToPlainText(data: CharacterData, name?: string): string {
  const lines: string[] = [];

  const charName = deriveName(data, name);
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

export function exportToObsidian(data: CharacterData, name?: string): string {
  const lines: string[] = [];
  const charName = deriveName(data, name);
  
  lines.push('---');
  lines.push(`name: ${charName}`);
  lines.push(`tags: [character]`);
  if (data.nickname) {
    lines.push(`aliases: [${data.nickname}]`);
  }
  lines.push('---');
  lines.push('');
  lines.push(`# ${charName}`);
  lines.push('');

  for (const section of CHARACTER_SCHEMA) {
    const filledFields = section.fields.filter(
      f => data[f.id] && data[f.id].trim() !== ''
    );
    if (filledFields.length === 0) continue;
    
    lines.push(`## ${section.label}`);
    lines.push('');
    
    for (const field of filledFields) {
      // Obsidian inline field format
      lines.push(`**${field.label}**:: ${data[field.id]}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function exportToSillyTavern(data: CharacterData, name?: string): string {
  const charName = deriveName(data, name);
  
  const descLines: string[] = [];
  const personalityLines: string[] = [];
  const mesExampleLines: string[] = [];
  
  for (const section of CHARACTER_SCHEMA) {
    const filledFields = section.fields.filter(
      f => data[f.id] && data[f.id].trim() !== ''
    );
    if (filledFields.length === 0) continue;
    
    // Route psychology fields to personality
    if (section.id === 'psychology' || section.id === 'fears' || section.id === 'motivation') {
       for (const field of filledFields) {
          personalityLines.push(`${field.label}: ${data[field.id]}`);
       }
       continue;
    }
    
    // Route voice fields to mes_example
    if (section.id === 'voice') {
      for (const field of filledFields) {
        mesExampleLines.push(`${field.label}: ${data[field.id]}`);
      }
      continue;
    }
    
    descLines.push(`[${section.label}]`);
    for (const field of filledFields) {
      descLines.push(`${field.label}: ${data[field.id]}`);
    }
    descLines.push('');
  }

  const v2Card = {
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: {
      name: charName,
      description: descLines.join('\n').trim(),
      personality: personalityLines.join('\n').trim(),
      scenario: "",
      first_mes: "",
      mes_example: mesExampleLines.join('\n').trim(),
      creator_notes: "Экспортировано из Character Card Editor",
      system_prompt: "",
      post_history_instructions: "",
      tags: [],
      creator: "",
      character_version: "1.0",
      extensions: {}
    }
  };

  return JSON.stringify(v2Card, null, 2);
}
