import { WizardAnswers, WizardQuestion, WizardStep } from '@/types/wizard';
import { WizardCards } from './WizardCards';
import { WizardRadio } from './WizardRadio';
import { WizardCheckbox } from './WizardCheckbox';
import { WizardSlider } from './WizardSlider';
import { WizardSegmented } from './WizardSegmented';
import { WizardSelect } from './WizardSelect';
import { WizardTextInput } from './WizardTextInput';

interface WizardStepViewProps {
  step: WizardStep;
  answers: WizardAnswers;
  onAnswer: (questionId: string, value: string | string[] | number) => void;
}

function asString(value: string | string[] | number | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asStringArray(value: string | string[] | number | undefined): string[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

function asNumber(value: string | string[] | number | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function renderControl(
  question: WizardQuestion,
  value: string | string[] | number | undefined,
  onAnswer: (questionId: string, value: string | string[] | number) => void
) {
  const set = (v: string | string[] | number) => onAnswer(question.id, v);

  switch (question.type) {
    case 'cards':
      return <WizardCards question={question} value={asString(value)} onChange={set} />;
    case 'radio':
      return <WizardRadio question={question} value={asString(value)} onChange={set} />;
    case 'checkbox':
      return <WizardCheckbox question={question} value={asStringArray(value)} onChange={set} />;
    case 'slider':
      return <WizardSlider question={question} value={asNumber(value)} onChange={set} />;
    case 'segmented':
      return <WizardSegmented question={question} value={asString(value)} onChange={set} />;
    case 'select':
      return <WizardSelect question={question} value={asString(value)} onChange={set} />;
    case 'text':
      return <WizardTextInput question={question} value={asString(value)} onChange={set} />;
    default:
      return null;
  }
}

export function WizardStepView({ step, answers, onAnswer }: WizardStepViewProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-display-sm text-on-surface">{step.title}</h3>
        <p className="text-body-md text-on-surface-variant mt-1">{step.description}</p>
      </div>

      <div className="space-y-7">
        {step.questions.map((question) => (
          <div key={question.id} className="space-y-3">
            <label className="block font-label-caps text-label-caps uppercase tracking-widest text-primary">
              {question.label}
              {question.optional && (
                <span className="ml-2 text-on-surface-variant/60 normal-case tracking-normal">
                  (необязательно)
                </span>
              )}
            </label>
            {renderControl(question, answers[question.id], onAnswer)}
          </div>
        ))}
      </div>
    </div>
  );
}
