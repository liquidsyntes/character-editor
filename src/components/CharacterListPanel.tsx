'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export interface SiblingCharacter {
  id: string;
  name: string;
  nickname?: string;
  emoji: string;
  color: string;
  summary?: string;
}

export default function CharacterListPanel({
  isOpen,
  onClose,
  characters,
  currentId,
  backHref = '/',
}: {
  isOpen: boolean;
  onClose: () => void;
  characters: SiblingCharacter[];
  currentId: string;
  backHref?: string;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <div className={`charlist-overlay ${isOpen ? 'open' : ''}`}>
      <div className="charlist-header">
        <div className="charlist-title">Персонажи</div>
        <button className="panel-close-btn" onClick={onClose} title="Закрыть (Esc)">✕</button>
      </div>

      {characters.length === 0 ? (
        <div className="charlist-empty">
          <div className="charlist-empty-icon">📭</div>
          <div className="charlist-empty-text">Других персонажей пока нет</div>
        </div>
      ) : (
        <div className="charlist-items">
          {characters.map((char, i) => {
            const isCurrent = char.id === currentId;
            let displayName = char.name || 'Безымянный';
            if (char.nickname) displayName += ` «${char.nickname}»`;
            return (
              <Link
                key={char.id}
                href={`/character/${char.id}`}
                className={`charlist-item ${isCurrent ? 'active' : ''}`}
                style={{
                  animationDelay: `${i * 40}ms`,
                  '--item-accent': char.color,
                } as React.CSSProperties}
              >
                <span className="charlist-item-emoji">{char.emoji}</span>
                <span className="charlist-item-name">{displayName}</span>
                {isCurrent && <span className="charlist-item-badge">сейчас</span>}
              </Link>
            );
          })}
        </div>
      )}

      <div className="charlist-footer">
        <Link href={backHref} className="btn btn-sm btn-ghost charlist-dashboard-btn">
          ← На дашборд
        </Link>
      </div>
    </div>
  );
}
