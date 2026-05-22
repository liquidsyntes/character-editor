export interface FieldDef {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  row?: number;
  span?: number;
}

export interface SectionDef {
  id: string;
  icon: string;
  label: string;
  fieldCount: number;
  fields: FieldDef[];
}

export interface CharacterData {
  [key: string]: string;
}

export interface CharacterRecord {
  id: string;
  name: string;
  data: CharacterData;
  emoji: string;
  color: string;
  summary: string;
  isDraft: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
