import { useState, useRef, useCallback } from 'react';

export interface UsageStats {
  prompt_tokens?: number;
  promptTokens?: number;
  completion_tokens?: number;
  completionTokens?: number;
}

interface UseStreamingGeneratorProps {
  endpoint: string;
  onChunk: (text: string) => void;
  onFinish?: (text: string) => Promise<void>;
  onError?: (err: Error) => void;
}

export function useStreamingTextGenerator({ endpoint, onChunk, onFinish, onError }: UseStreamingGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const generate = useCallback(async (bodyPayload: Record<string, unknown>) => {
    if (loading) {
      stop();
      return;
    }

    setLoading(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMsg = `Ошибка сервера (HTTP ${res.status})`;
        try { 
          const errData = await res.json(); 
          if (errData.error) errMsg = errData.error; 
        } catch {}
        throw new Error(errMsg);
      }
      if (!res.body) throw new Error('No body in response');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let generatedText = '';

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
                generatedText += parsedChunk.text;
                onChunk(generatedText);
              }
              if (parsedChunk.usage) {
                setUsage(parsedChunk.usage);
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

      if (onFinish) {
        await onFinish(generatedText);
      }

    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === 'AbortError') {
        setError('Генерация отменена');
      } else {
        console.error('Error generating text:', e);
        setError(e.message || 'Произошла ошибка при генерации');
        if (onError) onError(e);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [endpoint, loading, onChunk, onFinish, onError, stop]);

  return { generate, stop, loading, error, usage };
}
