'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { CharacterData } from '@/types/character';
import { getFilledFieldCount, getTotalFieldCount } from '@/lib/schema';
import { 
  archiveCharacter, 
  deleteCharacter, 
  duplicateCharacter, 
  updateProject,
  createWorldElement,
  updateWorldElement,
  deleteWorldElement
} from '@/lib/actions';
import TweaksPanel from '@/components/TweaksPanel';
import PromptsPanel from '@/components/PromptsPanel';
import { useAiSettings } from '@/lib/ai/useAiSettings';
import { formatDate } from '@/lib/dateUtils';
export interface WorldElementItem {
  id: string;
  projectId: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface CharacterItem {
  id: string;
  name: string;
  data: string;
  emoji: string;
  color: string;
  summary: string;
  isDraft: boolean;
  isArchived: boolean;
  isLore: boolean;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
}

export default function DashboardClient({
  characters: initial,
  worldElements: initialWorld = [],
  projectId,
  projectName: initialName,
  projectDescription: initialDesc,
  projectEmoji,
  projectGenre: initialGenre = '',
  projectFormat: initialFormat = '',
  projectSetting: initialSetting = '',
}: {
  characters: CharacterItem[];
  worldElements?: WorldElementItem[];
  projectId?: string | null;
  projectName?: string;
  projectDescription?: string;
  projectEmoji?: string;
  projectGenre?: string;
  projectFormat?: string;
  projectSetting?: string;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'story' | 'lore' | 'drafts' | 'archived'>('all');
  const [showTweaks, setShowTweaks] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const aiState = useAiSettings();
  const [visibleCount, setVisibleCount] = useState(24);
  const total = getTotalFieldCount();

  // Tabs and Project settings states
  const [activeTab, setActiveTab] = useState<'characters' | 'world'>('characters');
  const [pGenre, setPGenre] = useState(initialGenre || '');
  const [pFormat, setPFormat] = useState(initialFormat || '');
  const [pSetting, setPSetting] = useState(initialSetting || '');

  // World Elements states
  const [worldElements, setWorldElements] = useState<WorldElementItem[]>(initialWorld);
  const [worldFilter, setWorldFilter] = useState<'all' | 'location' | 'faction' | 'history' | 'rule' | 'other'>('all');

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 24);
      }
    });
    observerRef.current.observe(node);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setVisibleCount(24);
    }, 0);
  }, [search, filter, activeTab]);

  const [pName, setPName] = useState(initialName || '');
  const [pDesc, setPDesc] = useState(initialDesc || '');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (descRef.current) {
      descRef.current.style.height = 'auto';
      descRef.current.style.height = `${descRef.current.scrollHeight}px`;
    }
  }, [pDesc]);

  const saveProject = useCallback((
    name: string, 
    description: string, 
    genre: string, 
    format: string, 
    setting: string
  ) => {
    if (!projectId || projectId === null) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await updateProject(projectId, { 
        name, 
        description, 
        genre, 
        format, 
        setting 
      });
    }, 800);
  }, [projectId]);

  const handleNameChange = (val: string) => {
    setPName(val);
    saveProject(val, pDesc, pGenre, pFormat, pSetting);
  };

  const handleDescChange = (val: string) => {
    setPDesc(val);
    saveProject(pName, val, pGenre, pFormat, pSetting);
  };

  const handleGenreChange = (val: string) => {
    setPGenre(val);
    saveProject(pName, pDesc, val, pFormat, pSetting);
  };

  const handleFormatChange = (val: string) => {
    setPFormat(val);
    saveProject(pName, pDesc, pGenre, val, pSetting);
  };

  const handleSettingChange = (val: string) => {
    setPSetting(val);
    saveProject(pName, pDesc, pGenre, pFormat, val);
  };

  const handleDeleteWorldElement = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Удалить элемент мира навсегда?')) {
      const { deleteWorldElement } = await import('@/lib/actions');
      await deleteWorldElement(id);
      setWorldElements(prev => prev.filter(el => el.id !== id));
    }
  };

  const filtered = initial.filter(c => {
    if (filter === 'archived' && !c.isArchived) return false;
    if (filter === 'drafts' && (!c.isDraft || c.isArchived)) return false;
    if (filter === 'story' && (c.isLore || c.isArchived)) return false;
    if (filter === 'lore' && (!c.isLore || c.isArchived)) return false;
    if (filter === 'all' && c.isArchived) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (c.name?.toLowerCase().includes(q)) || 
             (c.summary?.toLowerCase().includes(q)) ||
             (c.data?.toLowerCase().includes(q));
    }
    return true;
  });

  const visibleCharacters = filtered.slice(0, visibleCount);

  const filteredWorld = worldElements.filter(el => {
    if (worldFilter === 'all') return true;
    return el.category === worldFilter;
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
          <span className="text-on-surface-variant font-label-caps text-[12px] tracking-widest">
            {activeTab === 'characters' 
              ? `${initial.filter(c => !c.isArchived).length} персонажей`
              : `${worldElements.length} записей лора`}
          </span>
          <div className="flex items-center gap-4">
            <button
              className={`text-on-surface-variant hover:text-primary transition-colors ${showPrompts ? 'text-primary' : ''}`}
              onClick={() => setShowPrompts(!showPrompts)}
              title="Системные промпты"
            >
              <span className="material-symbols-outlined text-[20px]">code_blocks</span>
            </button>
            <button
              className={`text-on-surface-variant hover:text-primary transition-colors ${showTweaks ? 'text-primary' : ''}`}
              onClick={() => setShowTweaks(!showTweaks)}
              title="Настройки"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-container-padding max-w-[1200px] mx-auto w-full">
        {/* Editable project header */}
        {isRealProject && (
          <div className="mb-8 pb-6 border-b border-outline-variant/50 flex flex-col gap-6">
            <div className="flex items-start gap-6">
              <div className="text-[48px] leading-none bg-surface-container rounded-lg p-3 shadow-sm border border-outline-variant shrink-0">
                {projectEmoji || '📁'}
              </div>
              <div className="flex flex-col flex-1 gap-1.5 pt-1">
                <input
                  className="font-headline-lg text-[28px] font-bold bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary px-0 py-0.5 outline-none transition-colors w-full text-on-surface placeholder:text-on-surface-variant/50"
                  type="text"
                  value={pName}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Название проекта..."
                  autoComplete="off"
                  spellCheck={false}
                />
                <textarea
                  ref={descRef}
                  className="font-body-lg text-[14px] bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary px-0 py-0.5 outline-none transition-colors w-full text-on-surface-variant placeholder:text-on-surface-variant/50 resize-none overflow-hidden block min-h-[30px]"
                  value={pDesc}
                  onChange={e => handleDescChange(e.target.value)}
                  rows={1}
                  placeholder="Краткое описание проекта..."
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Additional Project Metadata Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-container/30 border border-outline-variant/40 rounded-lg p-4">
              {/* Genre Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Жанр</label>
                <input
                  className="bg-surface/50 border border-outline-variant/60 hover:border-outline-variant focus:border-primary/50 focus:bg-surface rounded px-3 py-1.5 text-xs text-on-surface outline-none transition-all placeholder:text-on-surface-variant/30"
                  type="text"
                  value={pGenre}
                  onChange={e => handleGenreChange(e.target.value)}
                  placeholder="Например: Фантастика, Детектив..."
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {/* Format Dropdown Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Формат</label>
                <div className="relative">
                  <select
                    className="w-full bg-surface/50 border border-outline-variant/60 hover:border-outline-variant focus:border-primary/50 focus:bg-surface rounded px-3 py-1.5 text-xs text-on-surface outline-none cursor-pointer appearance-none transition-all"
                    value={pFormat}
                    onChange={e => handleFormatChange(e.target.value)}
                  >
                    <option value="" className="bg-surface text-on-surface-variant">Выберите формат...</option>
                    <option value="Кино" className="bg-surface text-on-surface">Кино</option>
                    <option value="Сериал" className="bg-surface text-on-surface">Сериал</option>
                    <option value="Книга" className="bg-surface text-on-surface">Книга</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1.5 text-[14px] text-on-surface-variant/60 pointer-events-none">unfold_more</span>
                </div>
              </div>

              {/* Setting Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">Основное место Действия</label>
                <input
                  className="bg-surface/50 border border-outline-variant/60 hover:border-outline-variant focus:border-primary/50 focus:bg-surface rounded px-3 py-1.5 text-xs text-on-surface outline-none transition-all placeholder:text-on-surface-variant/30"
                  type="text"
                  value={pSetting}
                  onChange={e => handleSettingChange(e.target.value)}
                  placeholder="Например: Москва 2048, Марс..."
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modes / Tabs */}
        {isRealProject && (
          <div className="flex gap-6 border-b border-outline-variant/50 mb-8 shrink-0">
            <button
              onClick={() => setActiveTab('characters')}
              className={`pb-4 px-1 font-label-caps text-[14px] font-bold tracking-wider relative transition-colors ${
                activeTab === 'characters' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Работа с Персонажами
            </button>
            <button
              onClick={() => setActiveTab('world')}
              className={`pb-4 px-1 font-label-caps text-[14px] font-bold tracking-wider relative transition-colors ${
                activeTab === 'world' 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Работа с Миром
            </button>
          </div>
        )}

        {/* CHARACTERS MODE */}
        {activeTab === 'characters' && (
          <>
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

            <div className="flex gap-2 mb-8 flex-wrap">
              {([['all', 'Все'], ['story', 'Участники сюжета'], ['lore', 'Лорные'], ['drafts', 'Черновики'], ['archived', 'Архив']] as const).map(([key, label]) => (
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
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visibleCharacters.map((char, i) => {
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
                              {char.isLore && (
                                <span className="bg-surface-container-highest text-on-surface text-[10px] uppercase font-bold px-2 py-0.5 rounded mr-2" title="Лорный персонаж">📜 Лор</span>
                              )}
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
                {visibleCount < filtered.length && (
                  <div ref={loadMoreRef} className="py-8 flex justify-center">
                    <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* WORLD MODE */}
        {activeTab === 'world' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="font-headline-lg text-headline-lg font-bold">Лор и Энциклопедия Мира</h2>
              <form action={async () => {
                const { createWorldElement } = await import('@/lib/actions');
                await createWorldElement(projectId!, worldFilter === 'all' ? 'location' : worldFilter);
              }}>
                <button
                  type="submit"
                  className="bg-primary text-on-primary px-4 py-2 flex items-center gap-2 rounded font-label-caps text-label-caps hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  Добавить элемент
                </button>
              </form>
            </div>

            {/* Category selection filters */}
            <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
              {([
                ['all', 'Все записи'],
                ['location', '📍 Локации'],
                ['faction', '🛡️ Фракции'],
                ['history', '⏳ История'],
                ['rule', '✨ Законы мира'],
                ['other', '📝 Разное'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  className={`font-label-caps text-[12px] px-4 py-2 rounded border transition-colors whitespace-nowrap ${
                    worldFilter === key
                      ? 'bg-surface-container-highest border-outline text-on-surface'
                      : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface'
                  }`}
                  onClick={() => setWorldFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {filteredWorld.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-outline-variant rounded-lg bg-surface/50">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50 mb-4 font-extralight">auto_stories</span>
                <h3 className="font-headline-sm font-bold mb-2">Мир еще не описан</h3>
                <p className="font-body-md text-on-surface-variant max-w-[400px]">
                  Добавьте локации, фракции, магические законы или исторические события, чтобы ИИ мог ссылаться на них при генерации и анализе ваших персонажей.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWorld.map((el) => {
                  const categoryLabels: Record<string, string> = {
                    location: 'Локация',
                    faction: 'Фракция',
                    history: 'История',
                    rule: 'Закон мира',
                    other: 'Прочее',
                  };
                  const categoryEmojis: Record<string, string> = {
                    location: '📍',
                    faction: '🛡️',
                    history: '⏳',
                    rule: '✨',
                    other: '📝',
                  };
                  const categoryColors: Record<string, string> = {
                    location: '#3b82f6',
                    faction: '#10b981',
                    history: '#f59e0b',
                    rule: '#8b5cf6',
                    other: '#6b7280',
                  };

                  return (
                    <Link
                      href={`/world/${el.id}`}
                      key={el.id}
                      className="group flex flex-col bg-surface border border-outline-variant rounded overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer min-h-[160px]"
                    >
                      <div
                        className="h-1 w-full"
                        style={{ backgroundColor: categoryColors[el.category] || '#6b7280' }}
                      />
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface flex items-center gap-1">
                            <span>{categoryEmojis[el.category] || '📝'}</span>
                            <span>{categoryLabels[el.category] || 'Прочее'}</span>
                          </span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <button className="text-on-surface-variant hover:text-error p-1 bg-surface-container rounded transition-colors" onClick={e => handleDeleteWorldElement(e, el.id)} title="Удалить">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                        <h4 className="font-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {el.title || 'Без названия'}
                        </h4>
                        <p className="font-body-md text-on-surface-variant mt-2 line-clamp-3 text-xs leading-relaxed flex-1">
                          {el.content || 'Нет описания. Нажмите, чтобы добавить.'}
                        </p>
                        <div className="mt-3 pt-3 border-t border-outline-variant/30 text-[10px] font-label-caps text-on-surface-variant text-right tracking-wider uppercase">
                          {formatDate(el.updatedAt)}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <PromptsPanel isOpen={showPrompts} onClose={() => setShowPrompts(false)} />
      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} aiState={aiState} />

    </div>
  );
}
