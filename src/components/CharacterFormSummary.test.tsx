import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CharacterFormSummary } from './CharacterFormSummary';
import '@testing-library/jest-dom';

describe('CharacterFormSummary', () => {
  const defaultProps = {
    data: {},
    charName: 'Unknown Character',
    percent: 0,
    filled: 0,
    total: 100,
    isLore: false,
    onToggleLore: vi.fn(),
  };

  it('renders character name correctly', () => {
    render(<CharacterFormSummary {...defaultProps} charName="John Doe" />);
    const input = screen.getByDisplayValue('John Doe');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('readonly');
  });

  it('renders "Роль не указана" when role and significance are missing', () => {
    render(<CharacterFormSummary {...defaultProps} />);
    expect(screen.getByText('Роль не указана')).toBeInTheDocument();
  });

  it('renders character function and plot significance when present', () => {
    render(
      <CharacterFormSummary 
        {...defaultProps} 
        data={{ characterFunction: 'Протагонист', plotSignificance: 'Главный герой' }} 
      />
    );
    expect(screen.getByText('Протагонист')).toBeInTheDocument();
    expect(screen.getByText('Главный герой')).toBeInTheDocument();
    expect(screen.queryByText('Роль не указана')).not.toBeInTheDocument();
  });

  it('renders progress correctly', () => {
    render(<CharacterFormSummary {...defaultProps} percent={50} filled={50} total={100} />);
    expect(screen.getByText('Прогресс: 50/100 (50%)')).toBeInTheDocument();
  });
});
