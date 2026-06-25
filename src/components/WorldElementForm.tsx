'use client';

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import Link from 'next/link';
import { updateWorldElement } from '@/lib/actions';
import { useAiSettings } from '@/lib/ai/useAiSettings';
import TweaksPanel from '@/components/TweaksPanel';
import { WorldExportModal } from '@/components/WorldExportModal';
import { WorldPromptsPanel } from '@/components/WorldPromptsPanel';

interface WorldElementFormProps {
  elementId: string;
  initialTitle: string;
  initialContent: string;
  category: string;
  projectId: string;
  projectName: string;
  projectEmoji: string;
  siblingCharacters: { id: string; name: string | null; emoji: string | null; }[];
  siblingElements: { id: string; title: string; category: string; }[];
  projectContext?: string;
}

const CATEGORY_MAP: Record<string, { label: string; emoji: string }> = {
  location: { label: 'Локация', emoji: '📍' },
  faction: { label: 'Фракция', emoji: '🛡️' },
  history: { label: 'История', emoji: '⏳' },
  rule: { label: 'Закон мира', emoji: '✨' },
  dictionary: { label: 'Словарь', emoji: '📖' },
  other: { label: 'Прочее', emoji: '📝' },
};

export default function WorldElementForm({
  elementId,
  initialTitle,
  initialContent,
  category,
  projectId,
  projectName,
  projectEmoji,
  siblingCharacters,
  siblingElements,
  projectContext,
}: WorldElementFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aiState = useAiSettings();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showTweaks, setShowTweaks] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [aiThoughts, setAiThoughts] = useState('');
  const aiAbortRef = useRef<AbortController | null>(null);

  const catInfo = CATEGORY_MAP[category] || CATEGORY_MAP.other;

  useLayoutEffect(() => {
    if (contentRef.current) {
      const wrapper = contentRef.current.parentElement;
      const scrollContainer = contentRef.current.closest('main');
      const currentScroll = scrollContainer ? scrollContainer.scrollTop : 0;
      
      if (wrapper) wrapper.style.minHeight = `${wrapper.offsetHeight}px`;
      
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${Math.max(400, contentRef.current.scrollHeight)}px`;
      
      if (wrapper) wrapper.style.minHeight = '';
      
      if (scrollContainer) {
        scrollContainer.scrollTop = currentScroll;
      }
    }
  }, [content]);

  const saveElement = useCallback((newTitle: string, newContent: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus('saving');
    
    saveTimer.current = setTimeout(async () => {
      try {
        await updateWorldElement(elementId, { title: newTitle, content: newContent });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (err) {
        console.error("Failed to save world element", err);
        setSaveStatus('idle');
      }
    }, 1000);
  }, [elementId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    saveElement(val, content);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    saveElement(title, val);
  };

  const handleAiGenerate = async (isExpand: boolean) => {
    if (aiLoading) {
      if (aiAbortRef.current) aiAbortRef.current.abort();
      return;
    }
    if (!title.trim()) {
      setAiError('Введите название элемента перед генерацией');
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiThoughts('');
    const controller = new AbortController();
    aiAbortRef.current = controller;

    try {
      const res = await fetch('/api/ai/world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          currentContent: content,
          projectContext,
          isExpand,
          provider: aiState.saved.provider,
          model: aiState.saved.model,
          temperature: aiState.saved.temperature,
          apiKey: aiState.saved.apiKeys[aiState.saved.provider],
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let err = `Ошибка: ${res.status}`;
        try { const j = await res.json(); if (j.error) err = j.error; } catch {}
        throw new Error(err);
      }
      if (!res.body) throw new Error('No stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let generatedText = isExpand ? content + '\n\n' : '';

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
              const p = JSON.parse(dataStr);
              if (p.error) throw new Error(p.error);
              if (p.text) {
                generatedText += p.text;
                
                const thinkMatch = generatedText.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
                if (thinkMatch && thinkMatch[1].trim()) {
                  setAiThoughts(thinkMatch[1].trim());
                }

                let cleanedText = generatedText.replace(/<think>[\s\S]*?<\/think>/g, '');
                cleanedText = cleanedText.replace(/<think>[\s\S]*$/g, '');
                setContent(cleanedText.trimStart());
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') console.error(e);
            }
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
      saveElement(title, generatedText);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') setAiError('Генерация остановлена');
      else if (err instanceof Error) setAiError(err.message || 'Ошибка генерации');
      else setAiError('Ошибка генерации');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-[300px] h-full bg-surface-container-low border-r border-outline-variant select-none z-30 flex-shrink-0">
        <div className="p-4 border-b border-outline-variant/50 flex flex-col gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="text-xl flex-shrink-0">{projectEmoji}</span>
            <div className="overflow-hidden">
              <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Проект</div>
              <Link href={`/project/${projectId}`} className="font-semibold text-on-surface text-sm truncate hover:text-primary transition-colors block">
                {projectName}
              </Link>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {/* Part 1: Characters */}
          <div className="mb-6">
            <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider mb-2 px-2">
              Персонажи ({siblingCharacters.length})
            </h3>
            <div className="flex flex-col gap-1">
              {siblingCharacters.map(sib => (
                <Link
                  key={sib.id}
                  href={`/character/${sib.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-container-high text-on-surface text-sm transition-colors"
                >
                  <span className="text-[16px]">{sib.emoji || '👤'}</span>
                  <span className="truncate">{sib.name || 'Безымянный персонаж'}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Part 2: World Elements */}
          <div>
            <h3 className="font-label-caps text-[11px] text-on-surface-variant uppercase tracking-wider mb-2 px-2">
              Другие записи мира ({siblingElements.length})
            </h3>
            <div className="flex flex-col gap-1">
              {siblingElements.map(sib => (
                <Link
                  key={sib.id}
                  href={`/world/${sib.id}`}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${sib.id === elementId ? 'bg-surface-container-highest font-medium text-on-surface' : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
                >
                  <span className="text-[16px]">{CATEGORY_MAP[sib.category]?.emoji || '📝'}</span>
                  <span className="truncate">{sib.title || 'Без названия'}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 flex justify-between items-center px-container-padding h-16 w-full border-b border-outline-variant bg-surface shrink-0">
          <div className="flex items-center gap-4">
            <Link href={projectId ? `/project/${projectId}` : '/'} className="text-on-surface-variant hover:text-primary transition-colors flex items-center pr-4 border-r border-outline-variant" title={projectId ? 'Вернуться к проекту' : 'На главную'}>
              <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
              <span className="font-label-caps text-[12px] hidden sm:inline">На главную</span>
            </Link>
            <button className="md:hidden text-on-surface hover:text-primary transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="font-label-caps text-[14px] font-medium text-on-surface-variant/70 uppercase tracking-widest">{projectName || 'Без проекта'}</div>
            <span className="font-label-caps text-[12px] text-on-surface-variant/70 lowercase flex items-center gap-1 ml-4 border-l border-outline-variant pl-4">
              <span>{catInfo.emoji}</span>
              <span>{catInfo.label}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            {saveStatus === 'saving' && (
              <span className="text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                Сохранение...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-green-500 flex items-center gap-1 hidden md:flex">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Сохранено
              </span>
            )}

            <div className="flex items-center gap-2 border-l border-outline-variant pl-4 ml-2">
              {aiLoading ? (
                <button
                  onClick={() => handleAiGenerate(false)}
                  className="bg-error text-on-error px-4 py-2 rounded font-label-caps text-label-caps hover:scale-95 duration-100 transition-transform flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> Отменить
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleAiGenerate(false)}
                    disabled={!title.trim()}
                    className="bg-primary text-on-primary px-4 py-2 rounded font-label-caps text-label-caps hover:scale-95 duration-100 transition-transform flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Сгенерировать с нуля"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span> Сгенерировать
                  </button>
                  <button
                    onClick={() => handleAiGenerate(true)}
                    disabled={!title.trim() || !content.trim()}
                    className="bg-surface border border-outline-variant px-4 py-2 rounded font-label-caps text-label-caps hover:scale-95 duration-100 transition-transform text-on-surface flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Расширить ИИ"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_note</span> Расширить
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setShowExport(true)}
              className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container ml-2"
              title="Экспорт"
            >
              <span className="material-symbols-outlined text-[20px]">ios_share</span>
            </button>
            
            <button
              onClick={() => setShowPrompts(true)}
              className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
              title="Настройки промптов"
            >
              <span className="material-symbols-outlined text-[20px]">code_blocks</span>
            </button>

            <button
              onClick={() => setShowTweaks(true)}
              className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
              title="Настройки ИИ"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </div>
        </header>

        {/* Thoughts Overlay */}
        {aiLoading && aiThoughts && (
          <div 
            className="fixed top-20 right-8 w-[350px] bg-surface-container-low border border-outline-variant rounded-lg p-4 shadow-xl z-50 text-[12px] text-on-surface-variant/80 italic leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col"
            ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
          >
            <div className="flex items-center gap-2 mb-2 text-primary font-medium not-italic border-b border-outline-variant/50 pb-2 shrink-0">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              Мысли нейросети...
            </div>
            <span className="whitespace-pre-wrap">{aiThoughts}</span>
            <span className="inline-block w-2 h-4 bg-primary/50 animate-pulse ml-1 align-middle mt-1 shrink-0" />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-container-padding pb-[50vh]">
          <div className="max-w-[1200px] mx-auto flex flex-col gap-6 pt-8 relative">
            {aiError && (
              <div className="bg-error/10 text-error p-4 rounded border border-error/20 flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined">error</span>
                <span>{aiError}</span>
              </div>
            )}
            
            <section className="flex flex-col md:flex-row gap-gutter items-start mb-8">
              <div className="shrink-0 flex flex-col gap-2">
                <div className="group cursor-pointer">
                  <div className="w-32 h-40 bg-surface-container-high border border-outline-variant flex flex-col items-center justify-center text-on-surface-variant group-hover:bg-surface-container-highest transition-colors relative overflow-hidden">
                    <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">add_a_photo</span>
                    <span className="font-label-caps text-[10px] uppercase tracking-widest opacity-50">Фото</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full space-y-4 pt-2">
                <div>
                  <input 
                    className="w-full text-display-lg font-display-lg text-primary bg-transparent input-underline placeholder:text-outline focus:ring-0 px-0 focus:outline-none uppercase" 
                    placeholder="НАЗВАНИЕ ЭЛЕМЕНТА" 
                    type="text" 
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    spellCheck={false}
                  />
                  <div className="text-[12px] text-outline mt-1 font-label-caps">Название или заголовок элемента лора</div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="bg-surface border border-outline-variant text-on-surface font-label-caps text-label-caps px-3 py-1.5 rounded uppercase">
                    {catInfo.label}
                  </span>
                </div>
              </div>
            </section>
            
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full min-h-[600px] bg-surface-container-lowest border-[0.5px] border-outline-variant/30 rounded-xl p-8 shadow-sm text-[16px] leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 overflow-hidden text-on-surface"
              placeholder="Опишите детальнее этот элемент мира. Вы можете вставить сюда историю, особенности, правила или любую другую важную информацию, которую ИИ должен учитывать..."
              spellCheck={false}
              rows={1}
            />
          </div>
        </main>
        
        <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} aiState={aiState} />
        <WorldPromptsPanel isOpen={showPrompts} onClose={() => setShowPrompts(false)} />
        
        {showExport && (
          <WorldExportModal
            title={title}
            content={content}
            categoryLabel={catInfo.label}
            onClose={() => setShowExport(false)}
          />
        )}
      </div>
    </div>
  );
}
