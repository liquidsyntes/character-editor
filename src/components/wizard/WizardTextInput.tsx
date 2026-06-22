import { WizardQuestion } from '@/types/wizard';

interface WizardTextInputProps {
  question: WizardQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function WizardTextInput({ question, value, onChange }: WizardTextInputProps) {
  const commonClass =
    'w-full rounded-lg border border-outline-variant bg-surface-container text-on-surface p-3 font-body-md placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none';

  if (question.multiline) {
    return (
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={3}
        className={`${commonClass} resize-y`}
      />
    );
  }

  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={question.placeholder}
      className={commonClass}
    />
  );
}
