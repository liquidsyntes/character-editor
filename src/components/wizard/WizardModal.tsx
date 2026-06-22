'use client';

import { useState } from 'react';
import { WIZARD_STEPS } from '@/lib/wizard-config';
import { WizardAnswers, WizardStep } from '@/types/wizard';
import { WizardStepView } from './WizardStepView';
import { WizardSummary } from './WizardSummary';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (answers: WizardAnswers) => void;
}

function isStepComplete(step: WizardStep, answers: WizardAnswers): boolean {
  return step.questions.every((question) => {
    if (question.optional) return true;
    // Sliders always carry a sensible default value.
    if (question.type === 'slider') return true;
    const value = answers[question.id];
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  });
}

export function WizardModal({ isOpen, onClose, onGenerate }: WizardModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [showSummary, setShowSummary] = useState(false);

  if (!isOpen) return null;

  const step = WIZARD_STEPS[currentStep];
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const canProceed = isStepComplete(step, answers);

  const handleAnswer = (questionId: string, value: string | string[] | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (showSummary) return;
    if (isLastStep) {
      setShowSummary(true);
    } else {
      setCurrentStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
    }
  };

  const handleBack = () => {
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleGenerate = () => {
    onGenerate(answers);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-outline-variant rounded-xl shadow-lg w-[900px] max-w-[92vw] max-h-[88vh] flex flex-col">
        {/* Header + progress */}
        <div className="p-6 border-b border-outline-variant shrink-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-display-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined">auto_fix_high</span>
              Wizard генерации
            </h2>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Закрыть"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex gap-1.5">
            {WIZARD_STEPS.map((s, idx) => {
              const active = !showSummary && idx === currentStep;
              const done = showSummary || idx < currentStep;
              return (
                <div
                  key={s.id}
                  title={s.title}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    active ? 'bg-primary' : done ? 'bg-primary/50' : 'bg-surface-container'
                  }`}
                />
              );
            })}
          </div>
          <div className="mt-2 text-[12px] font-label-caps text-on-surface-variant">
            {showSummary ? 'Сводка' : `Шаг ${currentStep + 1} из ${WIZARD_STEPS.length}`}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {showSummary ? (
            <WizardSummary answers={answers} />
          ) : (
            <WizardStepView step={step} answers={answers} onAnswer={handleAnswer} />
          )}
        </div>

        {/* Navigation */}
        <div className="p-6 border-t border-outline-variant flex justify-between items-center shrink-0 bg-surface-container">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 && !showSummary}
            className="px-4 py-2 rounded text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Назад
          </button>

          {showSummary ? (
            <button
              onClick={handleGenerate}
              className="px-5 py-2 rounded bg-primary text-on-primary font-label-caps text-label-caps hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Сгенерировать анкету
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="px-5 py-2 rounded bg-primary text-on-primary font-label-caps text-label-caps hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastStep ? 'К сводке' : 'Далее'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
