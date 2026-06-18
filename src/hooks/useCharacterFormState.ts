import { useState, useCallback, useRef, useTransition } from 'react';
import { CharacterData } from '@/types/character';
import { updateCharacter } from '@/lib/actions';

export function useCharacterFormState(characterId: string, initialData: CharacterData) {
  const [data, setData] = useState<CharacterData>(initialData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [, startTransition] = useTransition();
  const [aiUndoStack, setAiUndoStack] = useState<CharacterData[]>([]);
  const [aiRedoStack, setAiRedoStack] = useState<CharacterData[]>([]);
  const [fixedFields, setFixedFields] = useState<string[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushUndo = useCallback((stateToSave: CharacterData) => {
    setAiUndoStack(prev => [...prev, stateToSave].slice(-10)); // Keep last 10 states
    setAiRedoStack([]); // Clear redo stack on new action
  }, []);

  const doSave = useCallback((newData: CharacterData) => {
    setSaveStatus('saving');
    startTransition(async () => {
      try {
        await updateCharacter(characterId, newData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    });
  }, [characterId]);

  const handleUndo = useCallback(() => {
    if (aiUndoStack.length === 0) return;
    const previous = aiUndoStack[aiUndoStack.length - 1];
    setAiUndoStack(prev => prev.slice(0, -1));
    setData(current => {
      setAiRedoStack(prev => [...prev, current]);
      return previous;
    });
    doSave(previous);
  }, [aiUndoStack, doSave]);

  const handleRedo = useCallback(() => {
    if (aiRedoStack.length === 0) return;
    const nextState = aiRedoStack[aiRedoStack.length - 1];
    setAiRedoStack(prev => prev.slice(0, -1));
    setData(current => {
      setAiUndoStack(prev => [...prev, current]);
      return nextState;
    });
    doSave(nextState);
  }, [aiRedoStack, doSave]);

  const handleChange = useCallback((fieldId: string, value: string) => {
    setData(prev => {
      const next = { ...prev, [fieldId]: value };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(next), 1500);
      return next;
    });
  }, [doSave]);

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const importedData = JSON.parse(text);
        if (typeof importedData !== 'object' || !importedData) throw new Error("Неверный формат JSON");
        
        const newRecord: Record<string, string> = {};
        for (const [k, v] of Object.entries(importedData)) {
          if (typeof v === 'string' && v.trim() && k !== 'characterId' && k !== 'projectId') {
            newRecord[k] = v.trim();
          }
        }
        
        setData(prev => {
          const next = { ...prev, ...newRecord };
          doSave(next);
          return next;
        });
        
        e.target.value = '';
      } catch (err) {
        alert("Ошибка импорта: " + (err as Error).message);
      }
    };
    reader.readAsText(file);
  }, [doSave]);

  return {
    data,
    setData,
    saveStatus,
    doSave,
    aiUndoStack,
    aiRedoStack,
    pushUndo,
    handleUndo,
    handleRedo,
    handleChange,
    handleImport,
    fixedFields,
    setFixedFields,
    saveTimer,
  };
}
