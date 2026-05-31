'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { deleteProject, archiveProject } from '@/lib/actions';
import TweaksPanel from '@/components/TweaksPanel';
import { useAiSettings } from '@/lib/ai/useAiSettings';

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { characters: number };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function ProjectDashboard({
  projects: initial,
  unassignedCount,
}: {
  projects: ProjectItem[];
  unassignedCount: number;
}) {
  const [projects, setProjects] = useState(initial);
  const [search, setSearch] = useState('');
  const [showTweaks, setShowTweaks] = useState(false);
  const aiState = useAiSettings();

  useEffect(() => { setProjects(initial); }, [initial]);

  const filtered = projects.filter(p => {
    if (p.isArchived) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Удалить проект? Персонажи не будут удалены — они переместятся в «Без проекта».')) {
      await deleteProject(id);
    }
  };

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await archiveProject(id);
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-background h-screen flex flex-col">
      <header className="sticky top-0 z-40 flex justify-between items-center px-container-padding h-16 w-full border-b border-outline-variant bg-surface shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="font-headline-sm text-[16px] font-bold text-on-surface">Chars Edit</span>
          <span className="font-label-caps text-[12px] text-on-surface-variant/70 lowercase px-2 border-l border-outline-variant">Студия</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-on-surface-variant font-label-caps text-[12px] tracking-widest">{projects.filter(p => !p.isArchived).length} проектов</span>
          <button
            className={`text-on-surface-variant hover:text-primary transition-colors ${showTweaks ? 'text-primary' : ''}`}
            onClick={() => setShowTweaks(!showTweaks)}
            title="Настройки"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
          <button
            className="text-on-surface-variant hover:text-error transition-colors"
            onClick={() => signOut()}
            title="Выйти"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-container-padding max-w-[1200px] mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="font-headline-lg text-headline-lg font-bold">Проекты</h1>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center bg-surface border border-outline-variant rounded px-3 py-2 flex-1 md:w-[250px]">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant mr-2">search</span>
              <input
                className="bg-transparent border-none p-0 font-body-md text-on-surface focus:ring-0 outline-none w-full placeholder:text-on-surface-variant"
                type="text"
                placeholder="Поиск проекта..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <form action={async () => {
              const { createProject } = await import('@/lib/actions');
              await createProject();
            }}>
              <button type="submit" className="bg-primary text-on-primary px-4 py-2 flex items-center gap-2 rounded font-label-caps text-label-caps hover:bg-primary/90 transition-colors whitespace-nowrap">
                <span className="material-symbols-outlined text-[16px]">add</span>
                Новый проект
              </button>
            </form>
          </div>
        </div>

        {unassignedCount > 0 && !search.trim() && (
          <div className="mb-8">
            <Link
              href="/project/unassigned"
              className="block bg-surface border-l-4 border-l-outline-variant border border-outline-variant rounded p-5 hover:border-l-primary hover:shadow-sm transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <span className="text-display-sm">📂</span>
                  <div>
                    <div className="font-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors">Без проекта</div>
                    <div className="font-body-md text-on-surface-variant mt-1">Персонажи, не привязанные к проекту</div>
                  </div>
                </div>
                <div className="font-label-caps text-[12px] text-on-surface-variant bg-surface-container px-3 py-1 rounded">
                  {unassignedCount} {unassignedCount === 1 ? 'персонаж' : unassignedCount < 5 ? 'персонажа' : 'персонажей'}
                </div>
              </div>
            </Link>
          </div>
        )}

        {filtered.length === 0 && !unassignedCount ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-outline-variant rounded-lg bg-surface/50">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50 mb-4">{search ? 'search' : 'movie'}</span>
            <h2 className="font-headline-sm font-bold mb-2">
              {search ? 'Ничего не найдено' : 'Начните с проекта'}
            </h2>
            <p className="font-body-md text-on-surface-variant max-w-[400px]">
              {search
                ? 'Попробуйте изменить запрос'
                : 'Создайте проект — папку для ваших персонажей. Это может быть книга, фильм, игра или любой другой мир.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((project, i) => (
              <Link
                href={`/project/${project.id}`}
                key={project.id}
                className="group flex flex-col bg-surface border border-outline-variant rounded overflow-hidden hover:border-primary hover:shadow-md transition-all relative min-h-[160px]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Custom Color Strip */}
                <div className="h-1 w-full" style={{ backgroundColor: project.color || 'var(--color-primary)' }}></div>
                
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[28px] leading-none">{project.emoji || '📁'}</span>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button className="text-on-surface-variant hover:text-primary p-1 bg-surface-container rounded transition-colors" onClick={e => handleArchive(e, project.id)} title="Архивировать">
                        <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                      </button>
                      <button className="text-on-surface-variant hover:text-error p-1 bg-surface-container rounded transition-colors" onClick={e => handleDelete(e, project.id)} title="Удалить">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="font-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                    {project.name || 'Новый проект'}
                  </div>
                  <div className="font-body-md text-on-surface-variant mt-1 line-clamp-2 text-sm flex-1">
                    {project.description || 'Нет описания'}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-outline-variant/50 flex justify-between items-center">
                    <span className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase">
                      {formatDate(project.updatedAt)}
                    </span>
                    <span className="font-label-caps text-[10px] bg-surface-container text-on-surface-variant px-2 py-1 rounded">
                      {project._count.characters} {project._count.characters === 1 ? 'перс.' : 'перс.'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} aiState={aiState} />
    </div>
  );
}
