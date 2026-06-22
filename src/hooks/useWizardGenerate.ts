import { useState, useRef, useCallback } from 'react';
import { getTotalFieldCount } from '@/lib/schema';
import { AiSettings } from '@/lib/ai/useAiSettings';
import { fetchSseStream, parsePartialJson } from '@/lib/ai/prompt-parser';
import { WizardAnswers } from '@/types/wizard';
import { AiProgressData } from './useAiFill';

interface UseWizardGenerateProps {
  aiSettings: AiSettings;
  projectContext?: string;
}

export function useWizardGenerate({ aiSettings, projectContext }: UseWizardGenerateProps) {
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardProgress, setWizardProgress] = useState<AiProgressData | null>(null);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const wizardAbortRef = useRef<AbortController | null>(null);

  const generateFromWizard = useCallback(
    async (answers: WizardAnswers): Promise<Record<string, string>> => {
      if (wizardAbortRef.current) wizardAbortRef.current.abort();
      setWizardLoading(true);
      setWizardError(null);
      const totalFields = getTotalFieldCount();
      setWizardProgress({ isVisible: true, current: 0, total: totalFields, label: 'Собираю персонажа...' });
      const controller = new AbortController();
      wizardAbortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      try {
        const res = await fetch('/api/ai/fill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wizardAnswers: answers,
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
          try {
            const errData = await res.json();
            if (errData.error) errMsg = errData.error;
          } catch {}
          throw new Error(errMsg);
        }

        let rawJson = '';
        let finalParsed: Record<string, string> = {};
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
              setWizardProgress((prev) =>
                prev ? { ...prev, current: Object.keys(partial).length, label: 'Генерация...' } : prev
              );
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
              console.error(e);
            }
          }
        });

        const modelInfo = (aiSettings.model || aiSettings.provider).toUpperCase();
        const usageStr = usageData ? ` • ${usageData.promptTokens + usageData.completionTokens} токенов` : '';
        setWizardProgress((prev) =>
          prev
            ? { ...prev, isVisible: false, current: Object.keys(finalParsed).length, label: `✓ ${modelInfo}${usageStr}` }
            : null
        );
        setTimeout(() => {
          setWizardLoading(false);
          setWizardProgress(null);
        }, 4000);

        return finalParsed;
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        setWizardProgress(null);
        setWizardLoading(false);
        const isAbort = err instanceof Error && err.name === 'AbortError';
        const errMsg = err instanceof Error ? err.message : String(err);
        setWizardError(isAbort ? 'Запрос отменён' : errMsg || 'Ошибка');
        return {};
      }
    },
    [aiSettings, projectContext]
  );

  return {
    wizardLoading,
    wizardProgress,
    wizardError,
    wizardAbortRef,
    generateFromWizard,
  };
}
