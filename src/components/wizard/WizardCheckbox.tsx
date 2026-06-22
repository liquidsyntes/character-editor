import { WizardQuestion } from '@/types/wizard';

interface WizardCheckboxProps {
  question: WizardQuestion;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}

export function WizardCheckbox({ question, value, onChange }: WizardCheckboxProps) {
  const options = question.options ?? [];
  const selectedValues = value ?? [];
  const max = question.max;
  const limitReached = typeof max === 'number' && selectedValues.length >= max;

  const toggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v) => v !== option));
    } else {
      if (limitReached) return;
      onChange([...selectedValues, option]);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const selected = selectedValues.includes(option);
          const disabled = !selected && limitReached;
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              disabled={disabled}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left font-body-md transition-colors ${
                selected
                  ? 'border-primary bg-primary/10 text-on-surface'
                  : 'border-outline-variant bg-surface-container text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
              } ${disabled ? 'opacity-40 cursor-not-allowed hover:border-outline-variant hover:text-on-surface-variant' : ''}`}
            >
              <span
                className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selected ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant'
                }`}
              >
                {selected && <span className="material-symbols-outlined text-[12px]">check</span>}
              </span>
              {option}
            </button>
          );
        })}
      </div>
      {typeof max === 'number' && (
        <div className="mt-2 text-[12px] font-label-caps text-on-surface-variant">
          Выбрано {selectedValues.length}/{max}
        </div>
      )}
    </div>
  );
}
