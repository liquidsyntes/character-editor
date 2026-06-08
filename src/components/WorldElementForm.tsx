'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { updateWorldElement } from '@/lib/actions';

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
}

const CATEGORY_MAP: Record<string, { label: string; emoji: string }> = {
  location: { label: 'Локация', emoji: '📍' },
  faction: { label: 'Фракция', emoji: '🛡️' },
  history: { label: 'История', emoji: '⏳' },
  rule: { label: 'Закон мира', emoji: '✨' },
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
}: WorldElementFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
              <span className="text-green-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Сохранено
              </span>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-container-padding pb-32">
          <div className="max-w-[800px] mx-auto flex flex-col gap-6 pt-8">
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
      </div>
    </div>
  );
}
