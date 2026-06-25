'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { CharacterData } from '@/types/character';
import { useAiSettings } from '@/lib/ai/useAiSettings';
import { updateCharacterPublicOpinions, updateCharacterMeta } from '@/lib/actions';
import { useStreamingTextGenerator } from '@/hooks/useStreamingTextGenerator';
import { getFilledFieldCount, getTotalFieldCount } from '@/lib/schema';
import { PublicHeader } from '@/components/PublicHeader';
import { CharacterFormSummary } from '@/components/CharacterFormSummary';
import { PublicPromptsPanel } from '@/components/PublicPromptsPanel';
import { PublicExportModal } from '@/components/PublicExportModal';
import TweaksPanel from '@/components/TweaksPanel';

interface PublicClientProps {
  characterId: string;
  characterName: string;
  initialData: CharacterData;
  initialNarrative: string;
  initialOpinions: Record<string, string>;
  isLore: boolean;
  projectId?: string;
  projectName?: string;
}

const LABELS: Record<string, string> = {
  friend: 'Хороший друг',
  acquaintance: 'Знакомый',
  colleague: 'Коллега или деловой партнер',
  partner: 'Нынешний партнер',
  ex: 'Бывший партнер'
};

const DEFAULT_OPINIONS = {
  friend: '',
  acquaintance: '',
  colleague: '',
  partner: '',
  ex: ''
};

function parseMarkdownToOpinions(markdown: string) {
  const result = { ...DEFAULT_OPINIONS };
  
  const lines = markdown.split('\n');
  let currentRole: string | null = null;
  
  for (const line of lines) {
    const lowerLine = line.trim().toLowerCase();
    
    // Check if this line is a header
    let isHeader = false;
    let matchedRole: string | null = null;
    
    if (lowerLine.startsWith('#') || lowerLine.startsWith('*') || lowerLine.match(/^\d+\./) || lowerLine.endsWith(':')) {
      if (lowerLine.includes('друг')) { isHeader = true; matchedRole = 'friend'; }
      else if (lowerLine.includes('знаком')) { isHeader = true; matchedRole = 'acquaintance'; }
      else if (lowerLine.includes('коллег')) { isHeader = true; matchedRole = 'colleague'; }
      else if (lowerLine.includes('нынешн') || (lowerLine.includes('партнер') && !lowerLine.includes('бывш'))) { isHeader = true; matchedRole = 'partner'; }
      else if (lowerLine.includes('бывш')) { isHeader = true; matchedRole = 'ex'; }
    } else if (lowerLine.length < 50 && lowerLine.length > 0) { 
      if (lowerLine === 'хороший друг' || lowerLine === 'друг') { isHeader = true; matchedRole = 'friend'; }
      else if (lowerLine === 'знакомый') { isHeader = true; matchedRole = 'acquaintance'; }
      else if (lowerLine === 'коллега' || lowerLine === 'коллега или деловой партнер') { isHeader = true; matchedRole = 'colleague'; }
      else if (lowerLine === 'нынешний партнер' || lowerLine === 'партнер') { isHeader = true; matchedRole = 'partner'; }
      else if (lowerLine === 'бывший партнер' || lowerLine === 'бывший') { isHeader = true; matchedRole = 'ex'; }
    }

    if (isHeader && matchedRole) {
      currentRole = matchedRole;
    } else if (currentRole) {
      result[currentRole as keyof typeof result] += (result[currentRole as keyof typeof result] ? '\n' : '') + line;
    } else {
      if (line.trim().length > 0 && !lowerLine.includes('вот ') && !lowerLine.includes('свидетельств') && !lowerLine.includes('мнения')) {
         currentRole = 'friend';
         result[currentRole as keyof typeof result] += line;
      }
    }
  }

  Object.keys(result).forEach(k => {
    const key = k as keyof typeof result;
    result[key] = result[key].trim().replace(/^[\*\-:]\s*/, '');
  });
  
  return result;
}

interface AutoResizeTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  title: string;
  onBlur?: () => void;
}

function AutoResizeTextarea({ value, onChange, placeholder, title, onBlur }: AutoResizeTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    if (ref.current) {
      const scrollContainer = ref.current.closest('.custom-scrollbar');
      const currentScroll = scrollContainer ? scrollContainer.scrollTop : 0;
      
      ref.current.style.height = 'auto';
      ref.current.style.height = `${Math.max(ref.current.scrollHeight, 120)}px`;
      
      if (scrollContainer) {
        scrollContainer.scrollTop = currentScroll;
      }
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-label-caps text-[14px] font-bold tracking-wider text-on-surface uppercase">{title}</h3>
      <textarea
        ref={ref}
        className="w-full bg-surface-container-lowest border-[0.5px] border-outline-variant/30 rounded-xl p-6 shadow-sm text-[16px] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 overflow-hidden"
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
      />
    </div>
  );
}

export function PublicClient({ 
  characterId, 
  characterName, 
  initialData, 
  initialNarrative,
  initialOpinions,
  isLore: initialIsLore,
  projectId,
  projectName
}: PublicClientProps) {
  const [opinions, setOpinions] = useState<Record<string, string>>({ ...DEFAULT_OPINIONS, ...initialOpinions });
  const [isLore, setIsLore] = useState(initialIsLore);
  
  const [showPrompts, setShowPrompts] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  const aiSettings = useAiSettings();

  const { generate, stop, loading, error, usage, thoughts } = useStreamingTextGenerator({
    endpoint: '/api/ai/public',
    onChunk: (text) => {
      const parsed = parseMarkdownToOpinions(text);
      setOpinions(prev => {
        return {
          friend: parsed.friend || prev.friend,
          acquaintance: parsed.acquaintance || prev.acquaintance,
          colleague: parsed.colleague || prev.colleague,
          partner: parsed.partner || prev.partner,
          ex: parsed.ex || prev.ex,
        };
      });
    },
    onFinish: async (text) => {
      const finalOpinions = parseMarkdownToOpinions(text);
      setOpinions(finalOpinions);
      await updateCharacterPublicOpinions(characterId, JSON.stringify(finalOpinions));
    }
  });

  const filledFields = getFilledFieldCount(initialData);
  const totalFields = getTotalFieldCount();
  const percent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  const handleToggleLore = async (val: boolean) => {
    setIsLore(val);
    await updateCharacterMeta(characterId, { isLore: val });
  };

  const handleBlur = async () => {
    await updateCharacterPublicOpinions(characterId, JSON.stringify(opinions));
  };

  const handleGenerate = () => {
    if (loading) {
      stop();
      return;
    }
    setOpinions({ ...DEFAULT_OPINIONS });
    generate({
      existingData: initialData,
      narrative: initialNarrative,
      provider: aiSettings.saved.provider,
      model: aiSettings.saved.model,
      temperature: aiSettings.saved.temperature || 0.8,
      apiKey: aiSettings.saved.apiKeys[aiSettings.saved.provider]
    });
  };

  const hasOpinions = Object.values(opinions).some(v => v.trim().length > 0);

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Левый сайдбар */}
      <aside className="hidden md:flex flex-col w-[320px] lg:w-[425px] h-full bg-primary text-white border-r border-white/10 select-none z-30 flex-shrink-0">
        <div className="p-4 border-b border-white/10 flex flex-col gap-2 bg-black/25">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="text-xl flex-shrink-0">{initialData.emoji || '👤'}</span>
            <div className="overflow-hidden">
              <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Мнение о персонаже</div>
              <div className="font-semibold text-white text-sm truncate">{characterName}</div>
            </div>
          </div>
        </div>
        
        <nav className="p-3 flex flex-col gap-1">
          <Link href={`/character/${characterId}`} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all hover:bg-white/5 text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span className="text-sm">Вернуться к анкете</span>
          </Link>

          <Link href={`/character/${characterId}/narrative`} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all hover:bg-white/5 text-white/70 hover:text-white">
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            <span className="text-sm">Художественное описание</span>
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
        <PublicHeader 
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
          hasOpinions={hasOpinions}
        />

        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Thoughts Overlay for Public Generation */}
          {loading && thoughts && (
            <div 
              className="fixed top-20 right-8 w-[350px] bg-surface-container-low border border-outline-variant rounded-lg p-4 shadow-xl z-50 text-[12px] text-on-surface-variant/80 italic leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col"
              ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
            >
              <div className="flex items-center gap-2 mb-2 text-primary font-medium not-italic border-b border-outline-variant/50 pb-2 shrink-0">
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                Мысли нейросети...
              </div>
              <span className="whitespace-pre-wrap">{thoughts}</span>
              <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1 align-middle mt-1 shrink-0" />
            </div>
          )}

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
              subtitleOverride="Мнение о персонаже"
            />

            {error && (
              <div className="p-4 bg-error/10 text-error rounded-lg border border-error/20 flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5">error</span>
                <div>{error}</div>
              </div>
            )}

            <div className="flex-1 pb-16 flex flex-col gap-8">
              {Object.entries(LABELS).map(([key, label]) => (
                <AutoResizeTextarea
                  key={key}
                  title={label}
                  value={opinions[key]}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOpinions(prev => ({ ...prev, [key]: e.target.value }))}
                  onBlur={handleBlur}
                  placeholder={`Что скажет ${label.toLowerCase()}?`}
                />
              ))}

              {usage && (
                <div className="text-right text-[10px] text-on-surface-variant font-mono-data mt-3 opacity-70">
                  Сгенерировано с помощью {aiSettings.saved.model} • Промпт: {usage.prompt_tokens || usage.promptTokens} токенов, Ответ: {usage.completion_tokens || usage.completionTokens} токенов
                </div>
              )}

              {!hasOpinions && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant border-2 border-dashed border-outline-variant rounded-xl bg-surface-container-lowest/50 mt-4">
                  <span className="material-symbols-outlined text-4xl mb-4 opacity-50">forum</span>
                  <p className="text-lg">Мнения пока не сгенерированы</p>
                  <p className="text-sm opacity-70 mt-2 text-center max-w-md">
                    Нажмите кнопку в шапке окна «Сформировать мнения», чтобы ИИ составил мини-монологи от лиц из окружения персонажа.
                  </p>
                </div>
              )}

              {hasOpinions && (
                <div className="flex justify-center mt-12 border-t border-outline-variant pt-8">
                  <Link
                    href={`/character/${characterId}/voice`}
                    className="px-6 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488] transition-colors flex items-center gap-3 shadow-sm font-label-caps uppercase tracking-wider text-sm"
                  >
                    <span>Голос персонажа</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
        </div>
      </div>

      <PublicPromptsPanel isOpen={showPrompts} onClose={() => setShowPrompts(false)} />
      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} aiState={aiSettings} />
      {showExport && <PublicExportModal opinions={opinions} name={characterName} onClose={() => setShowExport(false)} />}
    </div>
  );
}
