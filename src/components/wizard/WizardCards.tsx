import { WizardQuestion } from '@/types/wizard';

interface WizardCardsProps {
  question: WizardQuestion;
  value: string | undefined;
  onChange: (value: string) => void;
}

export function WizardCards({ question, value, onChange }: WizardCardsProps) {
  const options = question.options ?? [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`text-left rounded-lg border p-3 min-h-[64px] flex items-center font-body-md transition-colors ${
              selected
                ? 'border-primary bg-primary/10 text-on-surface'
                : 'border-outline-variant bg-surface-container text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
