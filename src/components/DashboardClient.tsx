'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { CharacterData } from '@/types/character';
import { getFilledFieldCount, getTotalFieldCount } from '@/lib/schema';
import { archiveCharacter, deleteCharacter, duplicateCharacter, updateProject } from '@/lib/actions';
import TweaksPanel from '@/components/TweaksPanel';

interface CharacterItem {
  id: string;
  name: string;
  data: string;
  emoji: string;
  color: string;
  summary: string;
  isDraft: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function DashboardClient({
  characters: initial,
  projectId,
  projectName: initialName,
  projectDescription: initialDesc,
  projectEmoji,
}: {
  characters: CharacterItem[];
  projectId?: string | null;
  projectName?: string;
  projectDescription?: string;
  projectEmoji?: string;
}) {
  const [characters, setCharacters] = useState(initial);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'drafts' | 'archived'>('all');
  const [showTweaks, setShowTweaks] = useState(false);
  const total = getTotalFieldCount();

  const [pName, setPName] = useState(initialName || '');
  const [pDesc, setPDesc] = useState(initialDesc || '');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setCharacters(initial); }, [initial]);

  const saveProject = useCallback((name: string, description: string) => {
    if (!projectId || projectId === null) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await updateProject(projectId, { name, description });
    }, 800);
  }, [projectId]);

  const handleNameChange = (val: string) => {
    setPName(val);
    saveProject(val, pDesc);
  };

  const handleDescChange = (val: string) => {
    setPDesc(val);
    saveProject(pName, val);
  };

  const filtered = characters.filter(c => {
    if (filter === 'archived' && !c.isArchived) return false;
    if (filter === 'drafts' && (!c.isDraft || c.isArchived)) return false;
    if (filter === 'all' && c.isArchived) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (c.name?.toLowerCase().includes(q)) || (c.summary?.toLowerCase().includes(q));
    }
    return true;
  });

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await archiveCharacter(id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Удалить персонажа навсегда?')) {
      await deleteCharacter(id);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await duplicateCharacter(id);
  };

  const isProjectContext = projectId !== undefined;
  const isRealProject = isProjectContext && projectId !== null;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-background h-screen flex flex-col">
      <header className="sticky top-0 z-40 flex justify-between items-center px-container-padding h-16 w-full border-b border-outline-variant bg-surface shrink-0">
        <div className="flex items-center gap-4">
          {isProjectContext && (
            <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors flex items-center pr-4 border-r border-outline-variant">
              <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
              <span className="font-label-caps text-[12px]">Проекты</span>
            </Link>
          )}
          <span className="font-headline-sm text-[16px] font-bold text-on-surface flex items-center gap-2">
            {isProjectContext ? (
              <>{projectEmoji} {pName || 'Новый проект'}</>
            ) : (
              <>Карточка персонажа</>
            )}
          </span>
          {!isProjectContext && <span className="font-label-caps text-[12px] text-on-surface-variant/70 lowercase px-2 border-l border-outline-variant">Редактор</span>}
        </div>
        <div className="flex items-center gap-6">
          <span className="text-on-surface-variant font-label-caps text-[12px] tracking-widest">{characters.filter(c => !c.isArchived).length} персонажей</span>
          <button
            className={`text-on-surface-variant hover:text-primary transition-colors ${showTweaks ? 'text-primary' : ''}`}
            onClick={() => setShowTweaks(!showTweaks)}
            title="Настройки"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-container-padding max-w-[1200px] mx-auto w-full">
        {/* Editable project header */}
        {isRealProject && (
          <div className="mb-10 pb-8 border-b border-outline-variant/50 flex items-start gap-6">
            <div className="text-[64px] leading-none bg-surface-container rounded-lg p-4 shadow-sm border border-outline-variant">
              {projectEmoji || '📁'}
            </div>
            <div className="flex flex-col flex-1 gap-2 pt-2">
              <input
                className="font-headline-lg text-[32px] font-bold bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary px-0 py-1 outline-none transition-colors w-full text-on-surface placeholder:text-on-surface-variant/50"
                type="text"
                value={pName}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Название проекта..."
                autoComplete="off"
                spellCheck={false}
              />
              <input
                className="font-body-lg text-[16px] bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary px-0 py-1 outline-none transition-colors w-full text-on-surface-variant placeholder:text-on-surface-variant/50"
                type="text"
                value={pDesc}
                onChange={e => handleDescChange(e.target.value)}
                placeholder="Добавьте описание мира, жанр или синопсис..."
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="font-headline-lg text-headline-lg font-bold">Персонажи</h1>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center bg-surface border border-outline-variant rounded px-3 py-2 flex-1 md:w-[250px]">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-2">search</span>
              <input
                className="bg-transparent border-none p-0 font-body-md text-on-surface focus:ring-0 outline-none w-full placeholder:text-on-surface-variant"
                type="text"
                placeholder="Поиск по имени..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <form action={async () => {
              const { createCharacter } = await import('@/lib/actions');
              await createCharacter(projectId);
            }}>
              <button type="submit" className="bg-primary text-on-primary px-4 py-2 flex items-center gap-2 rounded font-label-caps text-label-caps hover:bg-primary/90 transition-colors whitespace-nowrap">
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                Новый персонаж
              </button>
            </form>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {([['all', 'Все'], ['drafts', 'Черновики'], ['archived', 'Архив']] as const).map(([key, label]) => (
            <button
              key={key}
              className={`font-label-caps text-[12px] px-4 py-2 rounded border transition-colors ${
                filter === key 
                  ? 'bg-surface-container-highest border-outline text-on-surface' 
                  : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface'
              }`}
              onClick={() => setFilter(key)}
            >{label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-outline-variant rounded-lg bg-surface/50">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50 mb-4">{search ? 'search' : filter === 'archived' ? 'inventory_2' : 'group'}</span>
            <h2 className="font-headline-sm font-bold mb-2">
              {search ? 'Ничего не найдено' : filter === 'archived' ? 'Архив пуст' : 'Пока пусто'}
            </h2>
            <p className="font-body-md text-on-surface-variant max-w-[400px]">
              {search
                ? 'Попробуйте изменить запрос'
                : filter === 'archived'
                ? 'Архивированные персонажи появятся здесь'
                : 'Создайте своего первого персонажа — нажмите кнопку выше'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((char, i) => {
              let parsed: CharacterData = {};
              try { parsed = JSON.parse(char.data); } catch {}
              const filled = getFilledFieldCount(parsed);
              const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

              return (
                <Link
                  href={`/character/${char.id}`}
                  key={char.id}
                  className="group flex flex-col bg-surface border border-outline-variant rounded overflow-hidden hover:border-primary hover:shadow-md transition-all relative min-h-[180px]"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="h-1 w-full" style={{ backgroundColor: char.color || 'var(--color-primary)' }}></div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[28px] leading-none">{char.emoji || '👤'}</span>
                      
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <button className="text-on-surface-variant hover:text-primary p-1 bg-surface-container rounded transition-colors" onClick={e => handleDuplicate(e, char.id)} title="Дублировать">
                          <span className="material-symbols-outlined text-[16px]">content_copy</span>
                        </button>
                        <button className="text-on-surface-variant hover:text-primary p-1 bg-surface-container rounded transition-colors" onClick={e => handleArchive(e, char.id)} title={char.isArchived ? 'Разархивировать' : 'Архивировать'}>
                          <span className="material-symbols-outlined text-[16px]">{char.isArchived ? 'unarchive' : 'inventory_2'}</span>
                        </button>
                        <button className="text-on-surface-variant hover:text-error p-1 bg-surface-container rounded transition-colors" onClick={e => handleDelete(e, char.id)} title="Удалить">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="font-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                      {char.name || 'Безымянный персонаж'}
                    </div>
                    <div className="font-body-md text-on-surface-variant mt-1 line-clamp-2 text-sm flex-1">
                      {char.summary || 'Нет описания'}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-outline-variant/50 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">
                        <span>Заполнено</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                        <div className={`${pct === 100 ? 'bg-[#22c55e]' : pct >= 50 ? 'bg-[#f97316]' : pct > 0 ? 'bg-[#ef4444]' : 'bg-outline-variant'} h-full rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="mt-1 text-[10px] font-label-caps text-on-surface-variant text-right tracking-wider uppercase">
                        {formatDate(char.updatedAt)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} />
    </div>
  );
}
