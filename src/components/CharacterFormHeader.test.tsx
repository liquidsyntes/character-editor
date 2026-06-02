import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CharacterFormHeader } from './CharacterFormHeader';
import '@testing-library/jest-dom';

describe('CharacterFormHeader', () => {
  const defaultProps = {
    projectId: 'test-project-123',
    projectName: 'Test Project',
    characterId: 'char-123',
    aiProgress: '',
    analyzeProgress: '',
    aiError: null,
    analyzeError: null,
    aiUndoStackLength: 0,
    handleUndo: vi.fn(),
    setShowAnalyzeHistory: vi.fn(),
    handleAnalyze: vi.fn(),
    analyzeLoading: false,
    handleImport: vi.fn(),
    setShowExport: vi.fn(),
    aiLoading: false,
    aiAbortRef: { current: null },
    handleAiFill: vi.fn(),
    showPrompts: false,
    setShowPrompts: vi.fn(),
    showTweaks: false,
    setShowTweaks: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project name correctly', () => {
    render(<CharacterFormHeader {...defaultProps} />);
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders "Без проекта" if projectName is empty', () => {
    render(<CharacterFormHeader {...defaultProps} projectName="" projectId="" />);
    expect(screen.getByText('Без проекта')).toBeInTheDocument();
  });

  it('calls handleAnalyze when Analyze button is clicked', () => {
    render(<CharacterFormHeader {...defaultProps} />);
    const analyzeButton = screen.getByTitle('Анализ');
    fireEvent.click(analyzeButton);
    expect(defaultProps.handleAnalyze).toHaveBeenCalledTimes(1);
  });

  it('shows undo button if aiUndoStackLength > 0', () => {
    const { rerender } = render(<CharacterFormHeader {...defaultProps} />);
    expect(screen.queryByTitle('Отменить изменения ИИ')).not.toBeInTheDocument();

    rerender(<CharacterFormHeader {...defaultProps} aiUndoStackLength={1} />);
    const undoButton = screen.getByTitle('Отменить изменения ИИ');
    expect(undoButton).toBeInTheDocument();
    
    fireEvent.click(undoButton);
    expect(defaultProps.handleUndo).toHaveBeenCalledTimes(1);
  });

  it('toggles prompts and tweaks modals', () => {
    render(<CharacterFormHeader {...defaultProps} />);
    const promptsButton = screen.getByTitle('Системные промпты');
    const tweaksButton = screen.getByTitle('Настройки');

    fireEvent.click(promptsButton);
    expect(defaultProps.setShowPrompts).toHaveBeenCalledWith(true);

    fireEvent.click(tweaksButton);
    expect(defaultProps.setShowTweaks).toHaveBeenCalledWith(true);
  });
});
