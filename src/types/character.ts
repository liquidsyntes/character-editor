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
  isLore: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyzeIssue {
  /** Short title (1 line) */
  title: string;
  /** Which field IDs are involved */
  fields: string[];
  /** Severity: 'contradiction' | 'gap' | 'cliche' | 'inconsistency' | 'opportunity' */
  severity: 'contradiction' | 'gap' | 'cliche' | 'inconsistency' | 'opportunity';
  /** Detailed explanation (2-4 sentences, Russian) */
  description: string;
  /** Optional suggestion for fixing */
  suggestion?: string;
}

export interface AnalyzeCategory {
  title: string;
  icon: string;
  severity: AnalyzeIssue['severity'];
  issues: AnalyzeIssue[];
}

export interface AnalyzeResult {
  categories: AnalyzeCategory[];
  totalIssues: number;
  summary: string;
}
