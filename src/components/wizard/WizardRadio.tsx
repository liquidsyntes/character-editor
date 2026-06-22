import { WizardQuestion } from '@/types/wizard';

interface WizardRadioProps {
  question: WizardQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function WizardRadio({ question, value, onChange }: WizardRadioProps) {
  const options = question.options ?? [];

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left font-body-md transition-colors ${
              selected
                ? 'border-primary bg-primary/10 text-on-surface'
                : 'border-outline-variant bg-surface-container text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
            }`}
          >
            <span
              className={`shrink-0 w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                selected ? 'border-primary' : 'border-outline-variant'
              }`}
            >
              {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
}
