import { useState, useCallback, useRef, useEffect } from 'react';
import { CharacterData } from '@/types/character';
import { AnalysisRecord } from '@/components/AnalyzeHistorySidebar';
import { AiSettings } from '@/lib/ai/useAiSettings';
import { fetchSseStream } from '@/lib/ai/prompt-parser';
import { getAnalysisHistory, saveAnalysis, deleteAnalysis, bulkMigrateLocalAnalyses } from '@/lib/analysisActions';

interface UseCharacterAnalysisProps {
  characterId: string;
  data: CharacterData;
  setData: React.Dispatch<React.SetStateAction<CharacterData>>;
  doSave: (newData: CharacterData) => void;
  pushUndo: (stateToSave: CharacterData) => void;
  setFixedFields: (fields: string[]) => void;
  aiSettings: AiSettings;
  projectContext?: string;
  saveTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

export function useCharacterAnalysis({
  characterId,
  data,
  setData,
  doSave,
  pushUndo,
  setFixedFields,
  aiSettings,
  projectContext,
  saveTimer
}: UseCharacterAnalysisProps) {
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState<string>('');
  const [fixLoading, setFixLoading] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<Record<string, string> | null>(null);
  
  const analyzeAbortRef = useRef<AbortController | null>(null);

  // Load analyses from DB and migrate localStorage if needed
  useEffect(() => {
    let isMounted = true;
    
    async function loadHistory() {
      try {
        const savedLocal = localStorage.getItem(`analyses_${characterId}`);
        if (savedLocal) {
          const parsed = JSON.parse(savedLocal);
          if (parsed && parsed.length > 0) {
            await bulkMigrateLocalAnalyses(characterId, parsed);
          }
          localStorage.removeItem(`analyses_${characterId}`);
        }

        const history = await getAnalysisHistory(characterId);
        if (isMounted) setAnalyses(history as unknown as AnalysisRecord[]);
      } catch (err) {
        console.error('Failed to load analysis history:', err);
      }
    }

    loadHistory();

    return () => { isMounted = false; };
  }, [characterId]);

  const handleAnalyze = useCallback(async () => {
    // Simple caching: don't analyze if we already have an analysis for this exact data and provider
    const existingRecord = analyses.find(a => 
      a.provider === aiSettings.provider && 
      JSON.stringify(a.dataSnapshot) === JSON.stringify(data)
    );

    if (existingRecord) {
      setActiveAnalysisId(existingRecord.id);
      return;
    }

    setAnalyzeLoading(true); setAnalyzeError(null); setAnalyzeProgress('');
    const controller = new AbortController();
    analyzeAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          existingData: data, 
          context: projectContext,
          provider: aiSettings.provider, 
          model: aiSettings.model, 
          temperature: 0.7, 
          apiKey: aiSettings.apiKeys[aiSettings.provider] 
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        let errMsg = `Ошибка сервера (HTTP ${res.status})`;
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch {}
        throw new Error(errMsg);
      }
      let rawJson = '';
      
      await fetchSseStream(res, (dataStr) => {
        try {
          const parsedChunk = JSON.parse(dataStr);
          if (parsedChunk.error) throw new Error(parsedChunk.error);
          if (parsedChunk.text) {
            rawJson += parsedChunk.text;
            // Optional: update some UI loading state here if desired
            setAnalyzeProgress(prev => (prev + parsedChunk.text).slice(-150));
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
             console.error(e);
          }
        }
      });

      // Try to parse the complete JSON response
      let result;
      try {
        console.log('RAW JSON BEFORE PARSE:', rawJson);
        const { parseAnalyzeResponse } = await import('@/lib/ai/prompt-parser');
        result = parseAnalyzeResponse(rawJson);
      } catch (parseErr) {
        console.error('Analyze parse error:', parseErr);
        throw new Error(parseErr instanceof Error ? parseErr.message : 'Не удалось разобрать ответ AI. Попробуйте ещё раз.');
      }

      const savedRecord = await saveAnalysis(
        characterId,
        { categories: result.categories, totalIssues: result.totalIssues, summary: result.summary },
        aiSettings.provider,
        { ...data }
      );
      
      setAnalyses(prev => {
        const next = [savedRecord as unknown as AnalysisRecord, ...prev];
        return next;
      });
      setActiveAnalysisId(savedRecord.id);
    } catch (err) {
      clearTimeout(timeoutId); 
      if (err instanceof Error && err.name === 'AbortError') {
        setAnalyzeError('Запрос отменён');
      } else {
        setAnalyzeError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setAnalyzeLoading(false);
    }
  }, [data, aiSettings, projectContext, analyses, characterId]);

  const handleFixIssues = useCallback(async (issuesToFix: import('@/types/character').AnalyzeIssue[]) => {
    if (!issuesToFix || issuesToFix.length === 0) return;
    
    setFixLoading(true);
    setAnalyzeError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch('/api/ai/analyze/fix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data,
          issues: issuesToFix,
          provider: aiSettings.provider,
          model: aiSettings.model,
          temperature: 0.7,
          apiKey: aiSettings.apiKeys[aiSettings.provider],
          context: projectContext
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        let errMsg = `Ошибка сервера (HTTP ${res.status})`;
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch {}
        throw new Error(errMsg);
      }
      const result = await res.json();
      if (!result.data || Object.keys(result.data).length === 0) throw new Error('Нейросеть не вернула данные');

      setPendingDiff(result.data);
      
    } catch (err) {
      clearTimeout(timeoutId);
      setAnalyzeError(err instanceof Error ? err.message : 'Ошибка авто-исправления');
    } finally {
      setFixLoading(false);
    }
  }, [data, aiSettings, projectContext]);

  const handleAcceptDiff = useCallback((acceptedData: Record<string, string>) => {
    setData(prev => {
      pushUndo(prev);
      const next = { ...prev, ...acceptedData };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(next), 800);
      return next;
    });
    setFixedFields(Object.keys(acceptedData));
    setTimeout(() => setFixedFields([]), 5000);
    setPendingDiff(null);
  }, [pushUndo, doSave, setData, setFixedFields, saveTimer]);

  const handleRejectDiff = useCallback(() => {
    setPendingDiff(null);
  }, []);

  const handleDeleteAnalysis = useCallback(async (id: string) => {
    try {
      await deleteAnalysis(id, characterId);
      setAnalyses(prev => prev.filter(a => a.id !== id));
      if (activeAnalysisId === id) {
        setActiveAnalysisId(null);
      }
    } catch (e) {
      console.error('Failed to delete analysis', e);
    }
  }, [characterId, activeAnalysisId]);

  return {
    analyzeLoading,
    analyses,
    setAnalyses,
    activeAnalysisId,
    setActiveAnalysisId,
    analyzeError,
    analyzeProgress,
    fixLoading,
    pendingDiff,
    setPendingDiff,
    analyzeAbortRef,
    handleAnalyze,
    handleFixIssues,
    handleAcceptDiff,
    handleRejectDiff,
    handleDeleteAnalysis,
  };
}
