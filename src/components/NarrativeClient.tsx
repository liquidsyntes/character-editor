'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { CharacterData } from '@/types/character';
import { useAiSettings } from '@/lib/ai/useAiSettings';
import { updateCharacterNarrative, updateCharacterMeta } from '@/lib/actions';
import { useStreamingTextGenerator } from '@/hooks/useStreamingTextGenerator';
import { getFilledFieldCount, getTotalFieldCount } from '@/lib/schema';
import { NarrativeHeader } from '@/components/NarrativeHeader';
import { CharacterFormSummary } from '@/components/CharacterFormSummary';
import { NarrativePromptsPanel } from '@/components/NarrativePromptsPanel';
import { NarrativeExportModal } from '@/components/NarrativeExportModal';
import TweaksPanel from '@/components/TweaksPanel';
import NarrativeAnalyzePanel from '@/components/NarrativeAnalyzePanel';
import { NarrativeAnalyzeResult, NarrativeAnalyzeIssue } from '@/types/character';
import { fetchSseStream, parseNarrativeAnalyzeResponse } from '@/lib/ai/prompt-parser';

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
  const [showPrompts, setShowPrompts] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  // Analyze state
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<NarrativeAnalyzeResult | null>(null);
  const [showAnalyzePanel, setShowAnalyzePanel] = useState(false);
  const [fixingIssueTitle, setFixingIssueTitle] = useState<string | null>(null);
  const analyzeAbortRef = useRef<AbortController | null>(null);

  const aiSettings = useAiSettings();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { generate, stop, loading, error, usage } = useStreamingTextGenerator({
    endpoint: '/api/ai/narrative',
    onChunk: setNarrative,
    onFinish: async (text) => {
      await updateCharacterNarrative(characterId, text);
    }
  });

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

  const handleGenerate = () => {
    if (loading) {
      stop();
      return;
    }
    setNarrative('');
    generate({
      existingData: initialData,
      provider: aiSettings.saved.provider,
      model: aiSettings.saved.model,
      temperature: aiSettings.saved.temperature || 0.8,
      apiKey: aiSettings.saved.apiKeys[aiSettings.saved.provider]
    });
  };

  const handleAnalyzeNarrative = async () => {
    if (!narrative.trim()) return;
    setAnalyzeLoading(true);
    setShowAnalyzePanel(true);
    
    const controller = new AbortController();
    analyzeAbortRef.current = controller;
    
    try {
      const res = await fetch('/api/ai/analyze-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          narrative,
          provider: aiSettings.saved.provider,
          model: aiSettings.saved.model,
          apiKey: aiSettings.saved.apiKeys[aiSettings.saved.provider]
        }),
        signal: controller.signal
      });
      
      if (!res.ok) throw new Error('Ошибка сервера');
      
      let rawJson = '';
      await fetchSseStream(res, (data) => { rawJson += JSON.parse(data).delta || ''; });
      
      const result = parseNarrativeAnalyzeResponse(rawJson);
      setAnalyzeResult(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error(err);
        alert('Не удалось проанализировать текст: ' + err.message);
      }
    } finally {
      setAnalyzeLoading(false);
      analyzeAbortRef.current = null;
    }
  };

  const handleFixNarrativeFragment = async (issue: NarrativeAnalyzeIssue) => {
    if (!narrative.includes(issue.quote)) {
      alert('Цитата не найдена в тексте. Возможно, текст уже был изменен вручную.');
      return;
    }
    
    setFixingIssueTitle(issue.title);
    
    try {
      const res = await fetch('/api/ai/analyze-narrative/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          narrative,
          issue,
          provider: aiSettings.saved.provider,
          model: aiSettings.saved.model,
          apiKey: aiSettings.saved.apiKeys[aiSettings.saved.provider]
        })
      });
      
      if (!res.ok) throw new Error('Ошибка сервера');
      
      let newText = '';
      await fetchSseStream(res, (data) => { newText += JSON.parse(data).delta || ''; });
      
      newText = newText.trim();
      if (newText) {
        const updatedNarrative = narrative.replace(issue.quote, newText);
        setNarrative(updatedNarrative);
        await updateCharacterNarrative(characterId, updatedNarrative);
        
        // Remove issue from the panel
        setAnalyzeResult(prev => {
          if (!prev) return prev;
          const newCategories = prev.categories.map(c => ({
            ...c,
            issues: c.issues.filter(i => i.title !== issue.title)
          })).filter(c => c.issues.length > 0);
          return { ...prev, categories: newCategories, totalIssues: prev.totalIssues - 1 };
        });
      }
    } catch (err: unknown) {
      console.error(err);
      alert('Ошибка при исправлении текста: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setFixingIssueTitle(null);
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

          <Link href={`/character/${characterId}/voice`} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all hover:bg-white/5 text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
            <span className="text-sm">Голос персонажа</span>
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
          onAnalyze={handleAnalyzeNarrative}
        />

        <main className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
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
          </div>
          
          {/* Analyze Sidebar */}
          {showAnalyzePanel && analyzeLoading ? (
            <div className="w-[400px] border-l border-outline-variant bg-surface flex flex-col items-center justify-center p-8 shrink-0">
              <span className="material-symbols-outlined animate-spin text-[32px] text-primary mb-4">refresh</span>
              <div className="text-center">
                <div className="font-semibold text-on-surface mb-2">Нейросеть читает ваш текст...</div>
                <div className="text-sm text-on-surface-variant mb-6 text-center max-w-[250px]">
                  Мы ищем стилистические огрехи, клише и возможности сделать описание ярче. Это может занять около 30 секунд.
                </div>
                <button 
                  onClick={() => {
                    analyzeAbortRef.current?.abort();
                    setShowAnalyzePanel(false);
                    setAnalyzeLoading(false);
                  }}
                  className="px-4 py-2 border border-outline-variant rounded font-label-caps text-[12px] uppercase tracking-wider hover:bg-surface-container transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : showAnalyzePanel && analyzeResult ? (
            <NarrativeAnalyzePanel
              result={analyzeResult}
              fixingIssueTitle={fixingIssueTitle}
              onClose={() => setShowAnalyzePanel(false)}
              onFixIssue={handleFixNarrativeFragment}
            />
          ) : null}
        </main>
      </div>

      <NarrativePromptsPanel isOpen={showPrompts} onClose={() => setShowPrompts(false)} />
      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} aiState={aiSettings} />
      {showExport && <NarrativeExportModal narrative={narrative} name={characterName} onClose={() => setShowExport(false)} />}
    </div>
  );
}
