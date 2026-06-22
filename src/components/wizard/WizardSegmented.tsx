import { WizardQuestion } from '@/types/wizard';

interface WizardSegmentedProps {
  question: WizardQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function WizardSegmented({ question, value, onChange }: WizardSegmentedProps) {
  const options = question.options ?? [];

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-outline-variant bg-surface-container p-1">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-md px-4 py-2 font-body-md transition-colors ${
              selected
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
