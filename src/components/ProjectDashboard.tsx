'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { deleteProject, archiveProject } from '@/lib/actions';
import TweaksPanel from '@/components/TweaksPanel';

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
    <>
      <header className="toolbar">
        <div className="toolbar-left">
          <div className="toolbar-dot"></div>
          <span className="toolbar-title">Character Card</span>
          <span className="toolbar-sub">Студия</span>
        </div>
        <div className="toolbar-right">
          <span className="toolbar-badge">{projects.filter(p => !p.isArchived).length} проектов</span>
          <button
            className={`btn btn-icon btn-sm ${showTweaks ? 'active' : ''}`}
            onClick={() => setShowTweaks(!showTweaks)}
            title="Настройки"
          >⚙</button>
        </div>
      </header>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Проекты</h1>
          <div className="dashboard-actions">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
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
              <button type="submit" className="btn btn-accent">＋ Новый проект</button>
            </form>
          </div>
        </div>

        {/* Unassigned characters card */}
        {unassignedCount > 0 && !search.trim() && (
          <div style={{ marginBottom: '24px' }}>
            <Link
              href="/project/unassigned"
              className="character-card project-card project-card--unassigned"
              style={{ '--card-accent': '#8a8680' } as React.CSSProperties}
            >
              <div className="card-header">
                <span className="card-emoji">📂</span>
                <div className="card-info">
                  <div className="card-name">Без проекта</div>
                  <div className="card-summary">Персонажи, не привязанные к проекту</div>
                </div>
              </div>
              <div className="card-footer">
                <span className="card-date">{unassignedCount} {unassignedCount === 1 ? 'персонаж' : unassignedCount < 5 ? 'персонажа' : 'персонажей'}</span>
              </div>
            </Link>
          </div>
        )}

        {filtered.length === 0 && !unassignedCount ? (
          <div className="empty-state">
            <div className="empty-icon">{search ? '🔍' : '🎬'}</div>
            <h2 className="empty-title">
              {search ? 'Ничего не найдено' : 'Начните с проекта'}
            </h2>
            <p className="empty-text">
              {search
                ? 'Попробуйте изменить запрос'
                : 'Создайте проект — папку для ваших персонажей. Это может быть книга, фильм, игра или любой другой мир.'}
            </p>
          </div>
        ) : (
          <div className="character-grid">
            {filtered.map((project, i) => (
              <Link
                href={`/project/${project.id}`}
                key={project.id}
                className="character-card project-card"
                style={{ animationDelay: `${i * 50}ms`, '--card-accent': project.color } as React.CSSProperties}
              >
                <div className="card-actions">
                  <button className="card-action-btn" onClick={e => handleArchive(e, project.id)} title="Архивировать">📦</button>
                  <button className="card-action-btn delete" onClick={e => handleDelete(e, project.id)} title="Удалить">🗑</button>
                </div>
                <div className="card-header">
                  <span className="card-emoji">{project.emoji}</span>
                  <div className="card-info">
                    <div className={`card-name ${!project.name ? 'empty' : ''}`}>
                      {project.name || 'Новый проект'}
                    </div>
                    {project.description && <div className="card-summary">{project.description}</div>}
                  </div>
                </div>
                <div className="card-footer">
                  <span className="card-date">{formatDate(project.updatedAt)}</span>
                  <div className="card-progress">
                    <span>{project._count.characters} {project._count.characters === 1 ? 'персонаж' : project._count.characters < 5 ? 'персонажа' : 'персонажей'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} />
    </>
  );
}
