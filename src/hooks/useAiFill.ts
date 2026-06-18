import { useState, useRef, useCallback } from 'react';
import { CharacterData } from '@/types/character';
import { CHARACTER_SCHEMA, getTotalFieldCount } from '@/lib/schema';
import { AiSettings } from '@/lib/ai/useAiSettings';
import { fetchSseStream, parsePartialJson } from '@/lib/ai/prompt-parser';

export interface AiProgressData {
  isVisible: boolean;
  current: number;
  total: number;
  label: string;
}

interface UseAiFillProps {
  data: CharacterData;
  setData: React.Dispatch<React.SetStateAction<CharacterData>>;
  doSave: (newData: CharacterData) => void;
  pushUndo: (stateToSave: CharacterData) => void;
  setFixedFields: (fields: string[]) => void;
  setOpenSections: React.Dispatch<React.SetStateAction<Set<string>>>;
  aiSettings: AiSettings;
  projectContext?: string;
  saveTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export function useAiFill({
  data,
  setData,
  doSave,
  pushUndo,
  setFixedFields,
  setOpenSections,
  aiSettings,
  projectContext,
  saveTimer
}: UseAiFillProps) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState<AiProgressData | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSectionLoading, setAiSectionLoading] = useState<string | null>(null);
  const [aiFieldLoading, setAiFieldLoading] = useState<string | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  const handleAiFill = useCallback(async () => {
    if (aiAbortRef.current) aiAbortRef.current.abort();
    setAiLoading(true); setAiError(null); 
    const totalFields = getTotalFieldCount();
    setAiProgress({ isVisible: true, current: 0, total: totalFields, label: 'Думаю...' });
    const controller = new AbortController(); aiAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {

      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data, 
          context: projectContext,
          stream: true,
          provider: aiSettings.provider,
          model: aiSettings.model, 
          temperature: aiSettings.temperature,
          apiKey: aiSettings.apiKeys[aiSettings.provider],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!res.ok) {
        let errMsg = `Ошибка сервера (HTTP ${res.status})`;
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch{}
        throw new Error(errMsg);
      }
      let rawJson = '';
      let finalParsed: Record<string, string> = {};
      let pushedUndo = false;
      let usageData = null as { promptTokens: number; completionTokens: number } | null;
      
      await fetchSseStream(res, (dataStr) => {
        try {
          const parsedChunk = JSON.parse(dataStr);
          if (parsedChunk.usage) usageData = parsedChunk.usage;
          if (parsedChunk.error) throw new Error(parsedChunk.error);
          if (parsedChunk.text) {
            rawJson += parsedChunk.text;
            const partial = parsePartialJson(rawJson);
            finalParsed = partial;
            setAiProgress(prev => prev ? { ...prev, current: Object.keys(partial).length, label: 'Генерация...' } : prev);
            setData(prev => {
              if (!pushedUndo) { pushUndo(prev); pushedUndo = true; }
              return { ...prev, ...partial };
            });
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
             console.error(e);
          }
        }
      });

      setData(prev => {
         if (saveTimer.current) clearTimeout(saveTimer.current);
         saveTimer.current = setTimeout(() => doSave(prev), 800);
         return prev;
      });

      if (Object.keys(finalParsed).length > 0) {
        setFixedFields(Object.keys(finalParsed));
        setTimeout(() => setFixedFields([]), 5000);
      }

      const modelInfo = (aiSettings.model || aiSettings.provider).toUpperCase();
      const usage = usageData as { promptTokens: number; completionTokens: number } | null;
      const usageStr = usage ? ` • ${usage.promptTokens + usage.completionTokens} токенов` : '';
      setAiProgress(prev => prev ? { ...prev, isVisible: false, current: Object.keys(finalParsed).length, label: `✓ ${modelInfo}${usageStr}` } : null);
      
      setOpenSections(new Set(CHARACTER_SCHEMA.map(s => s.id)));
      setTimeout(() => { setAiLoading(false); setAiProgress(null); }, 6000);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isAbort) {
        setAiError('Запрос отменён');
      } else {
        setAiError(errMsg || 'Ошибка');
      }
      setAiProgress(null);
      setAiLoading(false);
    }
  }, [data, doSave, aiSettings, projectContext, pushUndo, setData, setFixedFields, setOpenSections, saveTimer]);

  const handleAiFillSection = useCallback(async (sectionId: string) => {
    if (aiSectionLoading) return;
    setAiSectionLoading(sectionId);
    setAiError(null);
    const section = CHARACTER_SCHEMA.find(s => s.id === sectionId);
    const totalFields = section ? section.fields.length : 1;
    setAiProgress({ isVisible: true, current: 0, total: totalFields, label: 'Анализ секции...' });
    const controller = new AbortController();
    aiAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch('/api/ai/fill', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          existingData: data, 
          sectionIds: [sectionId], 
          context: projectContext,
          stream: true,
          provider: aiSettings.provider, 
          model: aiSettings.model, 
          apiKey: aiSettings.apiKeys[aiSettings.provider] 
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Ошибка сервера');
      let rawJson = '';
      let finalParsed: Record<string, string> = {};
      let pushedUndo = false;
      let usageData = null as { promptTokens: number; completionTokens: number } | null;
      
      await fetchSseStream(res, (dataStr) => {
        try {
          const parsedChunk = JSON.parse(dataStr);
          if (parsedChunk.usage) usageData = parsedChunk.usage;
          if (parsedChunk.error) throw new Error(parsedChunk.error);
          if (parsedChunk.text) {
            rawJson += parsedChunk.text;
            const partial = parsePartialJson(rawJson);
            finalParsed = partial;
            setAiProgress(prev => prev ? { ...prev, current: Object.keys(partial).length, label: 'Генерация...' } : prev);
            setData(prev => {
              if (!pushedUndo) { pushUndo(prev); pushedUndo = true; }
              return { ...prev, ...partial };
            });
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
             console.error(e);
          }
        }
      });
      
      setData(prev => {
         if (saveTimer.current) clearTimeout(saveTimer.current);
         saveTimer.current = setTimeout(() => doSave(prev), 800);
         return prev;
      });
      
      if (Object.keys(finalParsed).length > 0) {
        setFixedFields(Object.keys(finalParsed));
        setTimeout(() => setFixedFields([]), 5000);
      }
      
      const modelInfo = (aiSettings.model || aiSettings.provider).toUpperCase();
      const usage = usageData as { promptTokens: number; completionTokens: number } | null;
      const usageStr = usage ? ` • ${usage.promptTokens + usage.completionTokens} токенов` : '';
      setAiProgress(prev => prev ? { ...prev, isVisible: false, current: Object.keys(finalParsed).length, label: `✓ ${modelInfo}${usageStr}` } : null);
      
      setOpenSections(prev => new Set(prev).add(sectionId));
      setTimeout(() => { setAiSectionLoading(null); setAiProgress(null); }, 6000);
    } catch (err: unknown) {
      clearTimeout(timeoutId); 
      setAiSectionLoading(null);
      setAiProgress(null);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isAbort) {
        setAiError('Запрос отменён');
      } else {
        setAiError(errMsg || 'Ошибка при заполнении секции');
      }
    }
  }, [data, doSave, aiSectionLoading, aiSettings, projectContext, pushUndo, setData, setFixedFields, setOpenSections, saveTimer]);

  const handleAiFillField = useCallback(async (fieldId: string) => {
    if (aiFieldLoading || aiSectionLoading || aiLoading) return;
    setAiFieldLoading(fieldId);
    setAiError(null);
    setAiProgress({ isVisible: true, current: 0, total: 1, label: 'Генерация...' });
    const controller = new AbortController();
    aiAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch('/api/ai/fill', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          existingData: data, 
          fieldIds: [fieldId], 
          context: projectContext,
          stream: true,
          provider: aiSettings.provider, 
          model: aiSettings.model, 
          apiKey: aiSettings.apiKeys[aiSettings.provider] 
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Ошибка сервера');
      let rawJson = '';
      let finalParsed: Record<string, string> = {};
      let pushedUndo = false;
      let usageData = null as { promptTokens: number; completionTokens: number } | null;
      
      await fetchSseStream(res, (dataStr) => {
        try {
          const parsedChunk = JSON.parse(dataStr);
          if (parsedChunk.usage) usageData = parsedChunk.usage;
          if (parsedChunk.error) throw new Error(parsedChunk.error);
          if (parsedChunk.text) {
            rawJson += parsedChunk.text;
            const partial = parsePartialJson(rawJson);
            finalParsed = partial;
            setAiProgress(prev => prev ? { ...prev, current: 1, label: 'Генерация...' } : prev);
            setData(prev => {
              if (!pushedUndo) { pushUndo(prev); pushedUndo = true; }
              return { ...prev, ...partial };
            });
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
             console.error(e);
          }
        }
      });
      
      setData(prev => {
         if (saveTimer.current) clearTimeout(saveTimer.current);
         saveTimer.current = setTimeout(() => doSave(prev), 800);
         return prev;
      });
      
      if (Object.keys(finalParsed).length > 0) {
        setFixedFields(Object.keys(finalParsed));
        setTimeout(() => setFixedFields([]), 5000);
      }
      
      const modelInfo = (aiSettings.model || aiSettings.provider).toUpperCase();
      const usage = usageData as { promptTokens: number; completionTokens: number } | null;
      const usageStr = usage ? ` • ${usage.promptTokens + usage.completionTokens} токенов` : '';
      setAiProgress(prev => prev ? { ...prev, isVisible: false, current: 1, label: `✓ ${modelInfo}${usageStr}` } : null);
      
      setTimeout(() => { setAiFieldLoading(null); setAiProgress(null); }, 6000);
    } catch (err: unknown) {
      clearTimeout(timeoutId); 
      setAiFieldLoading(null);
      setAiProgress(null);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isAbort) {
        setAiError('Запрос отменён');
      } else {
        setAiError(errMsg || 'Ошибка при заполнении поля');
      }
    }
  }, [data, doSave, aiFieldLoading, aiSectionLoading, aiLoading, aiSettings, projectContext, pushUndo, setData, setFixedFields, saveTimer]);

  const handleAiScratchpad = useCallback(async (scratchpadText: string): Promise<Record<string, string>> => {
    if (aiLoading) return {};
    setAiLoading(true);
    setAiError(null);
    setAiProgress({ isVisible: true, current: 0, total: 1, label: 'Анализ мыслей...' });
    const controller = new AbortController();
    aiAbortRef.current = controller;

    try {
      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data,
          context: projectContext,
          stream: false,
          scratchpadText,
          provider: aiSettings.provider,
          model: aiSettings.model,
          apiKey: aiSettings.apiKeys[aiSettings.provider],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMsg = `Ошибка сервера (HTTP ${res.status})`;
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch{}
        throw new Error(errMsg);
      }

      const result = await res.json();
      setAiProgress(null);
      setAiLoading(false);
      return result.data || {};
    } catch (err) {
      setAiProgress(null);
      setAiLoading(false);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiError(isAbort ? 'Запрос отменён' : errMsg);
      throw err;
    }
  }, [data, aiLoading, aiSettings, projectContext]);

  const handleQuickCommand = useCallback(async (commandType: 'lifeEvent' | 'hiddenMotive' | 'innerConflict'): Promise<Record<string, string>> => {
    if (aiLoading) return {};
    setAiLoading(true);
    setAiError(null);
    setAiProgress({ isVisible: true, current: 0, total: 1, label: 'Генерация идеи...' });
    const controller = new AbortController();
    aiAbortRef.current = controller;

    try {
      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data,
          context: projectContext,
          stream: false,
          quickCommand: commandType,
          provider: aiSettings.provider,
          model: aiSettings.model,
          apiKey: aiSettings.apiKeys[aiSettings.provider],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMsg = `Ошибка сервера (HTTP ${res.status})`;
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch{}
        throw new Error(errMsg);
      }

      const result = await res.json();
      setAiProgress(null);
      setAiLoading(false);
      return result.data || {};
    } catch (err) {
      setAiProgress(null);
      setAiLoading(false);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiError(isAbort ? 'Запрос отменён' : errMsg);
      throw err;
    }
  }, [data, aiLoading, aiSettings, projectContext]);

  return {
    aiLoading,
    aiProgress,
    aiError,
    aiSectionLoading,
    aiFieldLoading,
    aiAbortRef,
    handleAiFill,
    handleAiFillSection,
    handleAiFillField,
    handleAiScratchpad,
    handleQuickCommand,
  };
}
