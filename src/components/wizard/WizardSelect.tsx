import { WizardQuestion } from '@/types/wizard';

interface WizardSelectProps {
  question: WizardQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function WizardSelect({ question, value, onChange }: WizardSelectProps) {
  const options = question.options ?? [];

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-outline-variant bg-surface-container text-on-surface p-3 font-body-md focus:border-primary focus:outline-none"
    >
      <option value="" disabled>
        Выберите вариант
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
