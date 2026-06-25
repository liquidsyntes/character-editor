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

interface ExecuteStreamConfig {
  url: string;
  body: Record<string, unknown>;
  progressLabel: string;
  progressTotal: number;
  errorLabelFallback: string;
  onStart: () => void;
  onSuccess: () => void;
  onFinish: () => void;
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
  const [aiThoughts, setAiThoughts] = useState<string>('');
  const aiAbortRef = useRef<AbortController | null>(null);

  const executeAiStreamRequest = useCallback(async (config: ExecuteStreamConfig) => {
    config.onStart();
    setAiError(null);
    setAiThoughts('');
    setAiProgress({ isVisible: true, current: 0, total: config.progressTotal, label: config.progressLabel });
    
    const controller = new AbortController();
    aiAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch(config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!res.ok) {
        let errMsg = `Ошибка сервера (HTTP ${res.status})`;
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch {}
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
            
            const thinkMatch = rawJson.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
            if (thinkMatch && thinkMatch[1].trim()) {
              setAiThoughts(thinkMatch[1].trim());
            }

            const processedJson = rawJson.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '');
            const partial = parsePartialJson(processedJson);
            finalParsed = partial;
            
            const curLength = config.progressTotal > 1 ? Object.keys(partial).length : 1;
            setAiProgress(prev => prev ? { ...prev, current: curLength, label: 'Генерация...' } : prev);
            
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
      const usageStr = usageData ? ` • ${usageData.promptTokens + usageData.completionTokens} токенов` : '';
      const finalLength = config.progressTotal > 1 ? Object.keys(finalParsed).length : 1;
      setAiProgress(prev => prev ? { ...prev, isVisible: false, current: finalLength, label: `✓ ${modelInfo}${usageStr}` } : null);

      config.onSuccess();
      setTimeout(() => { config.onFinish(); setAiProgress(null); }, 6000);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      config.onFinish();
      setAiProgress(null);
      const isAbort = err instanceof Error && err.name === 'AbortError';
      const errMsg = err instanceof Error ? err.message : String(err);
      if (isAbort) {
        setAiError('Запрос отменён');
      } else {
        setAiError(errMsg || config.errorLabelFallback);
      }
    }
  }, [aiSettings.model, aiSettings.provider, doSave, pushUndo, saveTimer, setData, setFixedFields]);

  const handleAiFill = useCallback(async () => {
    if (aiAbortRef.current) aiAbortRef.current.abort();
    
    await executeAiStreamRequest({
      url: '/api/ai/fill',
      body: {
        existingData: data,
        context: projectContext,
        stream: true,
        provider: aiSettings.provider,
        model: aiSettings.model,
        temperature: aiSettings.temperature,
        apiKey: aiSettings.apiKeys[aiSettings.provider],
      },
      progressLabel: 'Думаю...',
      progressTotal: getTotalFieldCount(),
      errorLabelFallback: 'Ошибка',
      onStart: () => setAiLoading(true),
      onSuccess: () => setOpenSections(new Set(CHARACTER_SCHEMA.map(s => s.id))),
      onFinish: () => setAiLoading(false),
    });
  }, [data, projectContext, aiSettings, executeAiStreamRequest, setOpenSections]);

  const handleAiFillSection = useCallback(async (sectionId: string) => {
    if (aiSectionLoading) return;
    const section = CHARACTER_SCHEMA.find(s => s.id === sectionId);
    
    await executeAiStreamRequest({
      url: '/api/ai/fill',
      body: {
        existingData: data,
        sectionIds: [sectionId],
        context: projectContext,
        stream: true,
        provider: aiSettings.provider,
        model: aiSettings.model,
        apiKey: aiSettings.apiKeys[aiSettings.provider]
      },
      progressLabel: 'Анализ секции...',
      progressTotal: section ? section.fields.length : 1,
      errorLabelFallback: 'Ошибка при заполнении секции',
      onStart: () => setAiSectionLoading(sectionId),
      onSuccess: () => setOpenSections(prev => new Set(prev).add(sectionId)),
      onFinish: () => setAiSectionLoading(null),
    });
  }, [aiSectionLoading, data, projectContext, aiSettings, executeAiStreamRequest, setOpenSections]);

  const handleAiFillField = useCallback(async (fieldId: string) => {
    if (aiFieldLoading || aiSectionLoading || aiLoading) return;
    
    await executeAiStreamRequest({
      url: '/api/ai/fill',
      body: {
        existingData: data,
        fieldIds: [fieldId],
        context: projectContext,
        stream: true,
        provider: aiSettings.provider,
        model: aiSettings.model,
        apiKey: aiSettings.apiKeys[aiSettings.provider]
      },
      progressLabel: 'Генерация...',
      progressTotal: 1,
      errorLabelFallback: 'Ошибка при заполнении поля',
      onStart: () => setAiFieldLoading(fieldId),
      onSuccess: () => {},
      onFinish: () => setAiFieldLoading(null),
    });
  }, [aiFieldLoading, aiSectionLoading, aiLoading, data, projectContext, aiSettings, executeAiStreamRequest]);

  const handleAiCondenseField = useCallback(async (fieldId: string, text: string) => {
    if (aiFieldLoading || aiSectionLoading || aiLoading) return;
    
    await executeAiStreamRequest({
      url: '/api/ai/condense',
      body: {
        fieldId,
        text,
        provider: aiSettings.provider,
        model: aiSettings.model,
        apiKey: aiSettings.apiKeys[aiSettings.provider]
      },
      progressLabel: 'Ужатие...',
      progressTotal: 1,
      errorLabelFallback: 'Ошибка при ужатии текста',
      onStart: () => setAiFieldLoading(fieldId + '-condense'),
      onSuccess: () => {},
      onFinish: () => setAiFieldLoading(null),
    });
  }, [aiFieldLoading, aiSectionLoading, aiLoading, aiSettings, executeAiStreamRequest]);

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
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data,
          context: projectContext,
          stream: true,
          quickCommand: commandType,
          provider: aiSettings.provider,
          model: aiSettings.model,
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

      await fetchSseStream(res, (dataStr) => {
        try {
          const parsedChunk = JSON.parse(dataStr);
          if (parsedChunk.error) throw new Error(parsedChunk.error);
          if (parsedChunk.text) {
            rawJson += parsedChunk.text;
            
            const thinkMatch = rawJson.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
            if (thinkMatch && thinkMatch[1].trim()) {
              setAiThoughts(thinkMatch[1].trim());
            }

            const processedJson = rawJson.replace(/<think>[\s\S]*?(?:<\/think>|$)/g, '');
            const partial = parsePartialJson(processedJson);
            finalParsed = partial;
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
            console.error(e);
          }
        }
      });

      setAiProgress(null);
      setAiLoading(false);
      return finalParsed;
    } catch (err) {
      clearTimeout(timeoutId);
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
    aiThoughts,
    aiAbortRef,
    handleAiFill,
    handleAiFillSection,
    handleAiFillField,
    handleAiCondenseField,
    handleAiScratchpad,
    handleQuickCommand,
  };
}
