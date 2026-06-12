'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { CharacterData } from '@/types/character';
import { useAiSettings } from '@/lib/ai/useAiSettings';
import { updateCharacterNarrative, updateCharacterMeta } from '@/lib/actions';
import { getFilledFieldCount, getTotalFieldCount } from '@/lib/schema';
import { NarrativeHeader } from '@/components/NarrativeHeader';
import { CharacterFormSummary } from '@/components/CharacterFormSummary';
import { NarrativePromptsPanel } from '@/components/NarrativePromptsPanel';
import { NarrativeExportModal } from '@/components/NarrativeExportModal';
import TweaksPanel from '@/components/TweaksPanel';

interface NarrativeClientProps {
  characterId: string;
  characterName: string;
  initialData: CharacterData;
  initialNarrative: string;
  isLore: boolean;
  projectId?: string;
  projectName?: string;
}

export function NarrativeClient({ 
  characterId, 
  characterName, 
  initialData, 
  initialNarrative,
  isLore: initialIsLore,
  projectId,
  projectName
}: NarrativeClientProps) {
  const [narrative, setNarrative] = useState(initialNarrative);
  const [isLore, setIsLore] = useState(initialIsLore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<any>(null);
  
  const [showPrompts, setShowPrompts] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  const aiSettings = useAiSettings();
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      const scrollContainer = textareaRef.current.closest('main') || textareaRef.current.closest('.overflow-y-auto');
      const currentScroll = scrollContainer ? scrollContainer.scrollTop : 0;
      
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      
      if (scrollContainer) {
        scrollContainer.scrollTop = currentScroll;
      }
    }
  }, [narrative]);

  const filledFields = getFilledFieldCount(initialData);
  const totalFields = getTotalFieldCount();
  const percent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  const handleToggleLore = async (val: boolean) => {
    setIsLore(val);
    await updateCharacterMeta(characterId, { isLore: val });
  };

  const handleGenerate = async () => {
    if (loading) {
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    setLoading(true);
    setError(null);
    setNarrative('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/ai/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: initialData,
          provider: aiSettings.saved.provider,
          model: aiSettings.saved.model,
          temperature: aiSettings.saved.temperature || 0.8,
          apiKey: aiSettings.saved.apiKeys[aiSettings.saved.provider]
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMsg = `Ошибка сервера (HTTP ${res.status})`;
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch {}
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
                setNarrative(generatedText);
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

      // Окончательное сохранение в БД
      await updateCharacterNarrative(characterId, generatedText);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Генерация отменена');
      } else {
        setError(err.message || 'Ошибка генерации');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Левый сайдбар */}
      <aside className="hidden md:flex flex-col w-[320px] lg:w-[425px] h-full bg-primary text-white border-r border-white/10 select-none z-30 flex-shrink-0">
        <div className="p-4 border-b border-white/10 flex flex-col gap-2 bg-black/25">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="text-xl flex-shrink-0">{initialData.emoji || '👤'}</span>
            <div className="overflow-hidden">
              <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Описание</div>
              <div className="font-semibold text-white text-sm truncate">{characterName}</div>
            </div>
          </div>
        </div>
        
        <nav className="p-3 flex flex-col gap-1">
          <Link href={`/character/${characterId}`} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all hover:bg-white/5 text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span className="text-sm">Вернуться к анкете</span>
          </Link>

          <Link href={`/character/${characterId}/public`} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all hover:bg-white/5 text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">forum</span>
            <span className="text-sm">Мнение о персонаже</span>
          </Link>

          <Link href={projectId ? `/project/${projectId}` : "/"} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all hover:bg-white/5 text-white/70 hover:text-white mt-auto">
            <span className="material-symbols-outlined text-[16px]">dashboard</span>
            <span className="text-sm">Дашборд проекта</span>
          </Link>
        </nav>
      </aside>

      {/* Основной контент */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <NarrativeHeader 
          projectId={projectId}
          projectName={projectName}
          characterId={characterId}
          aiLoading={loading}
          handleGenerate={handleGenerate}
          setShowExport={setShowExport}
          showPrompts={showPrompts}
          setShowPrompts={setShowPrompts}
          showTweaks={showTweaks}
          setShowTweaks={setShowTweaks}
          hasNarrative={!!narrative}
        />

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-container-padding max-w-[1200px] mx-auto min-h-full pb-32 flex flex-col gap-8">
            
            <CharacterFormSummary 
              data={initialData}
              charName={characterName}
              percent={percent}
              filled={filledFields}
              total={totalFields}
              isLore={isLore}
              onToggleLore={handleToggleLore}
              subtitleOverride="Художественное описание"
            />

            {error && (
              <div className="p-4 bg-error/10 text-error rounded-lg border border-error/20 flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5">error</span>
                <div>{error}</div>
              </div>
            )}

            <div className="flex-1 pb-16">
              {narrative ? (
                <>
                  <textarea
                    ref={textareaRef}
                    className="w-full min-h-[600px] bg-surface-container-lowest border-[0.5px] border-outline-variant/30 rounded-xl p-8 shadow-sm text-[16px] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 overflow-hidden"
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    onBlur={() => updateCharacterNarrative(characterId, narrative)}
                    placeholder="Начните писать описание здесь..."
                  />
                  {usage && (
                    <div className="text-right text-[10px] text-on-surface-variant font-mono-data mt-3 opacity-70">
                      Сгенерировано с помощью {aiSettings.saved.model} • Промпт: {usage.prompt_tokens || usage.promptTokens} токенов, Ответ: {usage.completion_tokens || usage.completionTokens} токенов
                    </div>
                  )}

                  <div className="flex justify-center mt-12 border-t border-outline-variant pt-8">
                    <Link
                      href={`/character/${characterId}/public`}
                      className="px-6 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488] transition-colors flex items-center gap-3 shadow-sm font-label-caps uppercase tracking-wider text-sm"
                    >
                      <span>Мнение о персонаже</span>
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest/50">
                  <span className="material-symbols-outlined text-4xl mb-4 opacity-50">menu_book</span>
                  <p className="text-lg">Описание пока не сгенерировано</p>
                  <p className="text-sm opacity-70 mt-2 text-center max-w-md mb-6">
                    Нажмите кнопку в шапке окна «Сформировать описание», чтобы AI написал живой художественный текст на основе заполненной анкеты персонажа, или начните писать самостоятельно.
                  </p>
                  <button 
                    onClick={() => setNarrative(' ')} 
                    className="px-6 py-2 border border-outline-variant rounded-full hover:bg-surface-container-low transition-colors text-sm font-medium"
                  >
                    Написать вручную
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <NarrativePromptsPanel isOpen={showPrompts} onClose={() => setShowPrompts(false)} />
      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} aiState={aiSettings} />
      {showExport && <NarrativeExportModal narrative={narrative} name={characterName} onClose={() => setShowExport(false)} />}
    </div>
  );
}
