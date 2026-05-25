'use client';

import { useState, useCallback, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CHARACTER_SCHEMA, getFilledFieldCount, getTotalFieldCount, getSectionFilledCount } from '@/lib/schema';
import { updateCharacter } from '@/lib/actions';
import { CharacterData } from '@/types/character';
import ExportModal from './ExportModal';
import TweaksPanel from './TweaksPanel';
import CharacterListPanel, { SiblingCharacter } from './CharacterListPanel';
import Link from 'next/link';

export default function CharacterForm({
  characterId,
  initialData,
  siblings = [],
  projectId,
  projectName,
}: {
  characterId: string;
  initialData: CharacterData;
  siblings?: SiblingCharacter[];
  projectId?: string;
  projectName?: string;
}) {
  const backHref = projectId ? `/project/${projectId}` : '/project/unassigned';
  const backLabel = projectName || 'Без проекта';
  const [data, setData] = useState<CharacterData>(initialData);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic']));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showExport, setShowExport] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);
  const [showCharList, setShowCharList] = useState(false);
  const [isPending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const filled = getFilledFieldCount(data);
  const total = getTotalFieldCount();
  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;

  const doSave = useCallback((newData: CharacterData) => {
    setSaveStatus('saving');
    startTransition(async () => {
      try {
        await updateCharacter(characterId, newData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('idle');
      }
    });
  }, [characterId]);

  const handleChange = useCallback((fieldId: string, value: string) => {
    setData(prev => {
      const next = { ...prev, [fieldId]: value };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(next), 1500);
      return next;
    });
  }, [doSave]);

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setOpenSections(new Set(CHARACTER_SCHEMA.map(s => s.id)));
  const collapseAll = () => setOpenSections(new Set());

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        doSave(data);
      }
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setShowExport(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [data, doSave]);

  return (
    <>
      <header className="toolbar">
        <div className="toolbar-left">
          {siblings.length > 0 && (
            <button
              className={`btn btn-icon btn-sm ${showCharList ? 'active' : ''}`}
              onClick={() => setShowCharList(!showCharList)}
              title="Персонажи"
            >📋</button>
          )}
          <Link href={backHref} className="btn btn-back btn-ghost btn-sm">
            <span className="arrow">←</span> {backLabel}
          </Link>
          <div className="toolbar-dot"></div>
          <span className="toolbar-title">
            {[data.firstName, data.lastName].filter(Boolean).join(' ') || 'Новый персонаж'}
          </span>
        </div>
        <div className="toolbar-right">
          <div className={`save-status ${saveStatus}`}>
            <span className="save-status-dot"></span>
            {saveStatus === 'saving' ? 'Сохраняю...' : saveStatus === 'saved' ? 'Сохранено' : ''}
          </div>
          <div className="progress-group">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
            </div>
            <span className="progress-label">{filled}/{total}</span>
          </div>
          <button className="btn btn-sm" onClick={expandAll}>Развернуть</button>
          <button className="btn btn-sm" onClick={collapseAll}>Свернуть</button>
          <button className="btn btn-sm btn-primary" onClick={() => setShowExport(true)}>📤 Экспорт</button>
          <Link href={`/character/${characterId}/preview`} className="btn btn-sm">👁 Просмотр</Link>
          <button
            className={`btn btn-icon btn-sm ${showTweaks ? 'active' : ''}`}
            onClick={() => setShowTweaks(!showTweaks)}
            title="Настройки (Ctrl+.)"
          >⚙</button>
        </div>
      </header>

      <main className="form-panel" id="formPanel">
        {CHARACTER_SCHEMA.map(section => {
          const isOpen = openSections.has(section.id);
          const sectionFilled = getSectionFilledCount(section.id, data);

          // Group fields by rows
          const rows: { row: number; fields: typeof section.fields }[] = [];
          let currentRow: typeof section.fields = [];
          let currentRowNum = -1;

          for (const field of section.fields) {
            const r = field.row ?? -1;
            if (r > 0 && r === currentRowNum) {
              currentRow.push(field);
            } else {
              if (currentRow.length > 0) {
                rows.push({ row: currentRowNum, fields: currentRow });
              }
              currentRow = [field];
              currentRowNum = r;
            }
          }
          if (currentRow.length > 0) {
            rows.push({ row: currentRowNum, fields: currentRow });
          }

          return (
            <div key={section.id} className={`section ${isOpen ? 'open' : ''}`}>
              <button
                className="section-toggle"
                aria-expanded={isOpen}
                onClick={() => toggleSection(section.id)}
              >
                <span className="section-icon">{section.icon}</span>
                <span className="section-label">{section.label}</span>
                <span className="section-count">
                  {sectionFilled}/{section.fields.length}
                </span>
                <span className="section-chevron">▶</span>
              </button>
              <div className="section-body">
                <div className="section-body-inner">
                  {rows.map((row, rowIdx) => {
                    const renderField = (field: typeof section.fields[number]) => (
                      <div key={field.id} className="field">
                        <label className="field-label" htmlFor={field.id}>{field.label}</label>
                        {field.type === 'select' ? (
                          <select
                            className="field-select"
                            id={field.id}
                            value={data[field.id] || ''}
                            onChange={e => handleChange(field.id, e.target.value)}
                          >
                            <option value="" disabled>Выберите…</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            className="field-input field-textarea"
                            id={field.id}
                            placeholder={field.placeholder}
                            value={data[field.id] || ''}
                            onChange={e => handleChange(field.id, e.target.value)}
                            rows={3}
                          />
                        ) : (
                          <input
                            className="field-input"
                            id={field.id}
                            type="text"
                            placeholder={field.placeholder}
                            value={data[field.id] || ''}
                            onChange={e => handleChange(field.id, e.target.value)}
                            autoComplete="off"
                          />
                        )}
                      </div>
                    );

                    if (row.row > 0 && row.fields.length > 1) {
                      const cls = row.fields.length === 3 ? 'field-row field-row-3' : 'field-row';
                      return (
                        <div key={rowIdx} className={cls}>
                          {row.fields.map(renderField)}
                        </div>
                      );
                    }
                    return row.fields.map(renderField);
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {showExport && (
        <ExportModal
          data={data}
          name={[data.firstName, data.lastName].filter(Boolean).join(' ')}
          onClose={() => setShowExport(false)}
        />
      )}

      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} />

      <CharacterListPanel
        isOpen={showCharList}
        onClose={() => setShowCharList(false)}
        characters={siblings}
        currentId={characterId}
        backHref={backHref}
      />
    </>
  );
}
