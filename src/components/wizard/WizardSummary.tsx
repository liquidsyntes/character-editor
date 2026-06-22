import { WIZARD_STEPS } from '@/lib/wizard-config';
import { WizardAnswers, WizardQuestion } from '@/types/wizard';

interface WizardSummaryProps {
  answers: WizardAnswers;
}

function formatAnswer(question: WizardQuestion, value: WizardAnswers[string] | undefined): string | null {
  if (value === undefined || value === null) return null;

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : null;
  }

  if (typeof value === 'number') {
    if (question.scaleLabels) {
      return `${value}/${question.max ?? 10} (${question.scaleLabels.left} → ${question.scaleLabels.right})`;
    }
    return String(value);
  }

  const str = value.trim();
  return str.length > 0 ? str : null;
}

export function WizardSummary({ answers }: WizardSummaryProps) {
  // Group answers into blocks driven by the wizard config (skip the intro step).
  const blocks = WIZARD_STEPS.filter((step) => step.id !== 'intro').map((step) => ({
    title: step.title,
    rows: step.questions
      .map((question) => ({
        label: question.label,
        value: formatAnswer(question, answers[question.id]),
      }))
      .filter((row): row is { label: string; value: string } => row.value !== null),
  }));

  const intro = WIZARD_STEPS.find((step) => step.id === 'intro');
  const introRows = intro
    ? intro.questions
        .map((question) => ({
          label: question.label,
          value: formatAnswer(question, answers[question.id]),
        }))
        .filter((row): row is { label: string; value: string } => row.value !== null)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-display-sm text-on-surface">Сводка перед генерацией</h3>
        <p className="text-body-md text-on-surface-variant mt-1">
          Проверьте ответы. На их основе ИИ сгенерирует полную анкету персонажа.
        </p>
      </div>

      {introRows.length > 0 && (
        <div className="rounded-lg border border-outline-variant bg-surface-container p-4">
          <h4 className="font-label-caps text-label-caps uppercase tracking-widest text-primary mb-3">
            Стартовые данные
          </h4>
          <dl className="space-y-2">
            {introRows.map((row) => (
              <div key={row.label} className="flex flex-col sm:flex-row sm:gap-3">
                <dt className="text-body-md text-on-surface-variant sm:w-1/3 shrink-0">{row.label}</dt>
                <dd className="text-body-md text-on-surface">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {blocks.map((block) => (
        <div key={block.title} className="rounded-lg border border-outline-variant bg-surface-container p-4">
          <h4 className="font-label-caps text-label-caps uppercase tracking-widest text-primary mb-3">
            {block.title}
          </h4>
          {block.rows.length === 0 ? (
            <p className="text-body-md text-on-surface-variant/60">Не заполнено</p>
          ) : (
            <dl className="space-y-2">
              {block.rows.map((row) => (
                <div key={row.label} className="flex flex-col sm:flex-row sm:gap-3">
                  <dt className="text-body-md text-on-surface-variant sm:w-1/3 shrink-0">{row.label}</dt>
                  <dd className="text-body-md text-on-surface">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ))}
    </div>
  );
}
