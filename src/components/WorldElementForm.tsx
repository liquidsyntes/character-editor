'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { updateWorldElement } from '@/lib/actions';
import { useAiSettings } from '@/lib/ai/useAiSettings';
import TweaksPanel from '@/components/TweaksPanel';
import { WorldExportModal } from '@/components/WorldExportModal';

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
  const aiAbortRef = useRef<AbortController | null>(null);

  const catInfo = CATEGORY_MAP[category] || CATEGORY_MAP.other;

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = 'auto';
      contentRef.current.style.height = `${contentRef.current.scrollHeight}px`;
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
                setContent(generatedText);
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
            <Link href={`/project/${projectId}`} className="text-on-surface-variant hover:text-primary transition-colors flex items-center pr-4 border-r border-outline-variant md:hidden">
              <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
            </Link>
            <span className="font-label-caps text-[12px] text-on-surface-variant/70 lowercase flex items-center gap-1">
              <span>{catInfo.emoji}</span>
              <span>Редактор: {catInfo.label}</span>
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
                  className="px-3 py-1.5 bg-error text-on-error rounded hover:bg-error/90 transition-colors font-medium flex items-center gap-1 text-xs uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-[16px]">stop_circle</span>
                  <span className="hidden md:inline">Остановить</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleAiGenerate(false)}
                    disabled={!title.trim()}
                    className="px-3 py-1.5 bg-primary text-on-primary rounded hover:bg-primary/90 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-label-caps uppercase tracking-wider text-[10px] md:text-xs"
                    title="Сгенерировать с нуля"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    <span className="hidden md:inline">Сгенерировать</span>
                  </button>
                  <button
                    onClick={() => handleAiGenerate(true)}
                    disabled={!title.trim() || !content.trim()}
                    className="px-3 py-1.5 bg-surface border border-outline-variant rounded text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-label-caps uppercase tracking-wider text-[10px] md:text-xs"
                    title="Расширить ИИ"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit_note</span>
                    <span className="hidden md:inline">Расширить</span>
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
              onClick={() => setShowTweaks(true)}
              className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
              title="Настройки ИИ"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-container-padding pb-[50vh]">
          <div className="max-w-[800px] mx-auto flex flex-col gap-6 pt-8 relative">
            {aiError && (
              <div className="bg-error/10 text-error p-4 rounded border border-error/20 flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined">error</span>
                <span>{aiError}</span>
              </div>
            )}
            
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="font-headline-lg text-[32px] md:text-[40px] font-bold bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/30 w-full"
              placeholder="Название элемента (например: Великий Лес)"
              spellCheck={false}
            />
            
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="font-body-lg text-[16px] leading-relaxed bg-transparent border-none outline-none text-on-surface-variant placeholder:text-on-surface-variant/30 w-full resize-none min-h-[300px]"
              placeholder="Опишите детальнее этот элемент мира. Вы можете вставить сюда историю, особенности, правила или любую другую важную информацию, которую ИИ должен учитывать..."
              spellCheck={false}
              rows={1}
            />
          </div>
        </main>
        
        <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} aiState={aiState} />
        
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
