import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WizardModal } from './WizardModal';
import { WIZARD_STEPS } from '@/lib/wizard-config';
import { WizardStep } from '@/types/wizard';
import '@testing-library/jest-dom';

function answerStep(step: WizardStep) {
  for (const q of step.questions) {
    if (q.optional || q.type === 'slider' || q.type === 'text') continue;
    if (q.type === 'select') {
      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: q.options![0] } });
    } else {
      fireEvent.click(screen.getByText(q.options![0]));
    }
  }
}

describe('WizardModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not render when closed', () => {
    const { container } = render(
      <WizardModal isOpen={false} onClose={vi.fn()} onGenerate={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the intro step first and disables Next until required answers given', () => {
    render(<WizardModal isOpen onClose={vi.fn()} onGenerate={vi.fn()} />);
    expect(screen.getByText(WIZARD_STEPS[0].title)).toBeInTheDocument();
    const next = screen.getByText('Далее');
    expect(next).toBeDisabled();

    answerStep(WIZARD_STEPS[0]);
    expect(screen.getByText('Далее')).toBeEnabled();
  });

  it('navigates forward and back between steps', () => {
    render(<WizardModal isOpen onClose={vi.fn()} onGenerate={vi.fn()} />);
    answerStep(WIZARD_STEPS[0]);
    fireEvent.click(screen.getByText('Далее'));
    expect(screen.getByText(WIZARD_STEPS[1].title)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Назад'));
    expect(screen.getByText(WIZARD_STEPS[0].title)).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(<WizardModal isOpen onClose={onClose} onGenerate={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Закрыть'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('steps through all questions to the summary and generates', () => {
    const onGenerate = vi.fn();
    render(<WizardModal isOpen onClose={vi.fn()} onGenerate={onGenerate} />);

    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      answerStep(WIZARD_STEPS[i]);
      const lastStep = i === WIZARD_STEPS.length - 1;
      fireEvent.click(screen.getByText(lastStep ? 'К сводке' : 'Далее'));
    }

    const generateBtn = screen.getByText('Сгенерировать анкету');
    fireEvent.click(generateBtn);

    expect(onGenerate).toHaveBeenCalledTimes(1);
    const answers = onGenerate.mock.calls[0][0];
    expect(answers.w_role).toBe(WIZARD_STEPS[1].questions[0].options![0]);
    expect(answers.w_gender).toBe(WIZARD_STEPS[0].questions[1].options![0]);
  });
});
