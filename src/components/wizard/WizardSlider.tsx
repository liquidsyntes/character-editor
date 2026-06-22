import { WizardQuestion } from '@/types/wizard';

interface WizardSliderProps {
  question: WizardQuestion;
  value: number | undefined;
  onChange: (value: number) => void;
}

export function WizardSlider({ question, value, onChange }: WizardSliderProps) {
  const min = question.min ?? 1;
  const max = question.max ?? 10;
  const current = typeof value === 'number' ? value : Math.round((min + max) / 2);

  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="font-label-caps text-[12px] text-on-surface-variant">
          {question.scaleLabels?.left ?? min}
        </span>
        <span className="font-mono text-[16px] font-bold text-primary">{current}</span>
        <span className="font-label-caps text-[12px] text-on-surface-variant text-right">
          {question.scaleLabels?.right ?? max}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary cursor-pointer"
      />
    </div>
  );
}
