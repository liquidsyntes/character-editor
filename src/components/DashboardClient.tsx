'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CharacterData } from '@/types/character';
import { getFilledFieldCount, getTotalFieldCount } from '@/lib/schema';
import { archiveCharacter, deleteCharacter, duplicateCharacter } from '@/lib/actions';
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
  projectName,
  projectEmoji,
}: {
  characters: CharacterItem[];
  projectId?: string | null;
  projectName?: string;
  projectEmoji?: string;
}) {
  const [characters, setCharacters] = useState(initial);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'drafts' | 'archived'>('all');
  const [showTweaks, setShowTweaks] = useState(false);
  const total = getTotalFieldCount();

  useEffect(() => { setCharacters(initial); }, [initial]);

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

  return (
    <>
      <header className="toolbar">
        <div className="toolbar-left">
          {isProjectContext && (
            <Link href="/" className="btn btn-back btn-ghost btn-sm">
              <span className="arrow">←</span> Проекты
            </Link>
          )}
          <div className="toolbar-dot"></div>
          <span className="toolbar-title">
            {isProjectContext ? (
              <>{projectEmoji} {projectName}</>
            ) : (
              <>Character Card</>
            )}
          </span>
          {!isProjectContext && <span className="toolbar-sub">Редактор</span>}
        </div>
        <div className="toolbar-right">
          <span className="toolbar-badge">{characters.filter(c => !c.isArchived).length} персонажей</span>
          <button
            className={`btn btn-icon btn-sm ${showTweaks ? 'active' : ''}`}
            onClick={() => setShowTweaks(!showTweaks)}
            title="Настройки"
          >⚙</button>
        </div>
      </header>

      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Персонажи</h1>
          <div className="dashboard-actions">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
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
              <button type="submit" className="btn btn-accent">＋ Новый персонаж</button>
            </form>
          </div>
        </div>

        <div className="filters">
          {([['all', 'Все'], ['drafts', 'Черновики'], ['archived', 'Архив']] as const).map(([key, label]) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >{label}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{search ? '🔍' : filter === 'archived' ? '📦' : '✨'}</div>
            <h2 className="empty-title">
              {search ? 'Ничего не найдено' : filter === 'archived' ? 'Архив пуст' : 'Пока пусто'}
            </h2>
            <p className="empty-text">
              {search
                ? 'Попробуйте изменить запрос'
                : filter === 'archived'
                ? 'Архивированные персонажи появятся здесь'
                : 'Создайте своего первого персонажа — нажмите кнопку выше'}
            </p>
          </div>
        ) : (
          <div className="character-grid">
            {filtered.map((char, i) => {
              let parsed: CharacterData = {};
              try { parsed = JSON.parse(char.data); } catch {}
              const filled = getFilledFieldCount(parsed);
              const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

              return (
                <Link
                  href={`/character/${char.id}`}
                  key={char.id}
                  className="character-card"
                  style={{ animationDelay: `${i * 50}ms`, '--card-accent': char.color } as React.CSSProperties}
                >
                  <div className="card-actions">
                    <button className="card-action-btn" onClick={e => handleDuplicate(e, char.id)} title="Дублировать">📋</button>
                    <button className="card-action-btn" onClick={e => handleArchive(e, char.id)} title={char.isArchived ? 'Разархивировать' : 'Архивировать'}>
                      {char.isArchived ? '📤' : '📦'}
                    </button>
                    <button className="card-action-btn delete" onClick={e => handleDelete(e, char.id)} title="Удалить">🗑</button>
                  </div>
                  <div className="card-header">
                    <span className="card-emoji">{char.emoji}</span>
                    <div className="card-info">
                      <div className={`card-name ${!char.name ? 'empty' : ''}`}>
                        {char.name || 'Безымянный персонаж'}
                      </div>
                      {char.summary && <div className="card-summary">{char.summary}</div>}
                    </div>
                  </div>
                  <div className="card-footer">
                    <span className="card-date">{formatDate(char.updatedAt)}</span>
                    <div className="card-progress">
                      <div className="card-progress-bar">
                        <div className="card-progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span>{pct}%</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} />
    </>
  );
}
