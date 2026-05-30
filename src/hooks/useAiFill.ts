import { useState, useRef, useCallback } from 'react';
import { CharacterData } from '@/types/character';
import { CHARACTER_SCHEMA } from '@/lib/schema';
import { AiSettings } from '@/lib/ai/useAiSettings';

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
  const [aiProgress, setAiProgress] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSectionLoading, setAiSectionLoading] = useState<string | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);

  const parsePartialJson = (raw: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const kvPattern = /"([^"]+)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/g;
    let match;
    while ((match = kvPattern.exec(raw)) !== null) {
      if (match[1] && match[2] !== undefined) {
        try {
          result[match[1]] = match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
        } catch {}
      }
    }
    return result;
  };

  const handleAiFill = useCallback(async () => {
    if (aiAbortRef.current) aiAbortRef.current.abort();
    setAiLoading(true); setAiError(null); setAiProgress('Думаю над персонажем...');
    const controller = new AbortController(); aiAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const contextParts: string[] = [];
      if (data.firstName) contextParts.push(`Имя: ${data.firstName}`);
      if (data.lastName) contextParts.push(`Фамилия: ${data.lastName}`);
      if (data.gender) contextParts.push(`Пол: ${data.gender}`);
      if (data.age) contextParts.push(`Возраст: ${data.age}`);
      if (data.oneLiner) contextParts.push(`Суть: ${data.oneLiner}`);
      if (data.characterFunction) contextParts.push(`Функция: ${data.characterFunction}`);

      const context = contextParts.filter(Boolean).join('; ') || undefined;

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
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch(e){}
        throw new Error(errMsg);
      }
      if (!res.body) throw new Error('No body');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawJson = '';
      let finalParsed: Record<string, string> = {};
      let pushedUndo = false;
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const parsedChunk = JSON.parse(dataStr);
              if (parsedChunk.error) throw new Error(parsedChunk.error);
              if (parsedChunk.text) {
                rawJson += parsedChunk.text;
                const partial = parsePartialJson(rawJson);
                finalParsed = partial;
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
          }
          boundary = buffer.indexOf('\n\n');
        }
      }

      setData(prev => {
         if (saveTimer.current) clearTimeout(saveTimer.current);
         saveTimer.current = setTimeout(() => doSave(prev), 800);
         return prev;
      });

      if (Object.keys(finalParsed).length > 0) {
        setFixedFields(Object.keys(finalParsed));
        setTimeout(() => setFixedFields([]), 5000);
      }

      setAiProgress(`✓ Заполнено ${Object.keys(finalParsed).length} полей`);
      setOpenSections(new Set(CHARACTER_SCHEMA.map(s => s.id)));
      setTimeout(() => { setAiLoading(false); setAiProgress(''); }, 4000);
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setAiError('Запрос отменён');
      } else {
        setAiError(err.message || 'Ошибка');
      }
      setAiProgress('');
      setAiLoading(false);
    }
  }, [data, doSave, aiSettings, projectContext, pushUndo, setData, setFixedFields, setOpenSections, saveTimer]);

  const handleAiFillSection = useCallback(async (sectionId: string) => {
    if (aiSectionLoading) return;
    setAiSectionLoading(sectionId);
    setAiError(null);
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
      if (!res.body) throw new Error('No body');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawJson = '';
      let finalParsed: Record<string, string> = {};
      let pushedUndo = false;
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const parsedChunk = JSON.parse(dataStr);
              if (parsedChunk.error) throw new Error(parsedChunk.error);
              if (parsedChunk.text) {
                rawJson += parsedChunk.text;
                const partial = parsePartialJson(rawJson);
                finalParsed = partial;
                setData(prev => {
                  if (!pushedUndo) { pushUndo(prev); pushedUndo = true; }
                  return { ...prev, ...partial };
                });
              }
            } catch (e) {}
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
      
      setData(prev => {
         if (saveTimer.current) clearTimeout(saveTimer.current);
         saveTimer.current = setTimeout(() => doSave(prev), 800);
         return prev;
      });
      
      if (Object.keys(finalParsed).length > 0) {
        setFixedFields(Object.keys(finalParsed));
        setTimeout(() => setFixedFields([]), 5000);
      }
      
      setOpenSections(prev => new Set(prev).add(sectionId));
      setTimeout(() => setAiSectionLoading(null), 2000);
    } catch (err: any) {
      clearTimeout(timeoutId); 
      setAiSectionLoading(null);
      if (err.name === 'AbortError') {
        setAiError('Запрос отменён');
      } else {
        setAiError(err.message || 'Ошибка при заполнении секции');
      }
    }
  }, [data, doSave, aiSectionLoading, aiSettings, projectContext, pushUndo, setData, setFixedFields, setOpenSections, saveTimer]);

  return {
    aiLoading,
    aiProgress,
    aiError,
    aiSectionLoading,
    aiAbortRef,
    handleAiFill,
    handleAiFillSection,
  };
}
