import { useEffect } from 'react';

interface KeyboardOptions {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onGenerate?: () => void;
}

export function useKeyboard({ onSave, onUndo, onRedo, onGenerate }: KeyboardOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Helper to check if user is typing in an input
      const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '') || 
                             (document.activeElement as HTMLElement)?.isContentEditable;

      // Ctrl+S / Cmd+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (onSave) onSave();
      }
      
      // Ctrl+Z / Cmd+Z (AI Undo)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (!isInputFocused && onUndo) {
          e.preventDefault();
          onUndo();
        }
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z (AI Redo)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        if (!isInputFocused && onRedo) {
          e.preventDefault();
          onRedo();
        }
      }
      
      // Ctrl+Enter / Cmd+Enter (Generate)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (onGenerate) {
          e.preventDefault();
          onGenerate();
        }
      }
    };
    
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onSave, onUndo, onRedo, onGenerate]);
}
