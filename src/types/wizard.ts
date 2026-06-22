export type WizardStepId =
  | 'intro'
  | 'role'
  | 'core'
  | 'pain'
  | 'goal'
  | 'relations'
  | 'past'
  | 'vibe'
  | 'arc';

export type WizardControlType =
  | 'cards'
  | 'radio'
  | 'checkbox'
  | 'slider'
  | 'select'
  | 'segmented'
  | 'text';

export interface WizardQuestion {
  id: string;
  label: string;
  type: WizardControlType;
  options?: string[];
  max?: number;
  min?: number;
  scaleLabels?: { left: string; right: string };
  /** Optional fields (e.g. intro text inputs) don't block step navigation. */
  optional?: boolean;
  /** Hint for text inputs: render a multi-line textarea instead of a single line. */
  multiline?: boolean;
  placeholder?: string;
}

export interface WizardStep {
  id: WizardStepId;
  title: string;
  description: string;
  questions: WizardQuestion[];
}

export type WizardAnswers = Record<string, string | string[] | number>;
