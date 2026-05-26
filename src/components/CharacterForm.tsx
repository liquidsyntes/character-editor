'use client';

import { useState, useCallback, useRef, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CHARACTER_SCHEMA, getFilledFieldCount, getTotalFieldCount, getSectionFilledCount } from '@/lib/schema';
import { updateCharacter } from '@/lib/actions';
import { CharacterData } from '@/types/character';
import ExportModal from './ExportModal';
import TweaksPanel from './TweaksPanel';
import AnalyzePanel from './AnalyzePanel';
import AnalyzeHistorySidebar, { AnalysisRecord } from './AnalyzeHistorySidebar';
import CharacterListPanel, { SiblingCharacter } from './CharacterListPanel';
import { useAiSettings, PROVIDER_MODELS, PROVIDER_LABELS } from '@/lib/ai/useAiSettings';
import { buildFixContext } from '@/lib/ai/prompt';
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

  // ── AI settings ────────────────────────
  const { saved: aiSettings } = useAiSettings();

  // ── AI Fill state ──────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSectionLoading, setAiSectionLoading] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [fixLoading, setFixLoading] = useState(false);

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

  // ── AI Fill handler ────────────────────
  const aiAbortRef = useRef<AbortController | null>(null);

  const handleAiFill = useCallback(async () => {
    // Cancel previous request if any
    if (aiAbortRef.current) {
      aiAbortRef.current.abort();
    }

    setAiLoading(true);
    setAiError(null);
    setAiProgress('Думаю над персонажем...');

    const controller = new AbortController();
    aiAbortRef.current = controller;

    // Safety timeout — 90 seconds
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      // Collect context from already-filled fields
      const contextParts: string[] = [];
      if (data.firstName) contextParts.push(`Имя: ${data.firstName}`);
      if (data.lastName) contextParts.push(`Фамилия: ${data.lastName}`);
      if (data.gender) contextParts.push(`Пол: ${data.gender}`);
      if (data.age) contextParts.push(`Возраст: ${data.age}`);
      if (data.oneLiner) contextParts.push(`Суть: ${data.oneLiner}`);
      if (data.characterFunction) contextParts.push(`Функция: ${data.characterFunction}`);

      const context = contextParts.filter(Boolean).join('; ') || undefined;

      console.log('[AI Fill] Starting with fields:', Object.keys(data).filter(k => data[k]?.trim()).length, 'filled');
      setAiProgress('Отправляю запрос к AI...');

      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data,
          context,
          provider: aiSettings.provider,
          model: aiSettings.model,
          temperature: aiSettings.temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Сервер ответил ошибкой ${res.status}`);
      }

      setAiProgress('Получаю ответ...');

      const result = await res.json();
      console.log('[AI Fill] Response:', { filledCount: result.filledCount, usage: result.usage, warning: result.warning });

      if (!result.data || Object.keys(result.data).length === 0) {
        throw new Error('AI не вернул ни одного заполненного поля. Попробуйте добавить больше исходных данных (хотя бы имя и пол).');
      }

      // Merge AI results with current data
      setData(prev => {
        const next = { ...prev, ...result.data };
        // Save immediately
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => doSave(next), 800);
        return next;
      });

      const tokens = result.usage
        ? ` · ${result.usage.promptTokens + result.usage.completionTokens} токенов`
        : '';

      const usedProvider = result.provider || aiSettings.provider;
      setAiProgress(
        `✓ Заполнено ${result.filledCount} полей${tokens} · ${usedProvider}` +
        (result.warning ? ` (⚠ ${result.warning})` : '')
      );

      // Expand all sections
      setOpenSections(new Set(CHARACTER_SCHEMA.map(s => s.id)));

      setTimeout(() => {
        setAiLoading(false);
        setAiProgress('');
      }, 4000);

    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof DOMException && err.name === 'AbortError') {
        setAiError('Прервано по таймауту (90 секунд). DeepSeek не успел ответить — попробуйте ещё раз.');
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        setAiError('Ошибка сети — сервер не отвечает. Проверьте, запущен ли npm run dev.');
      } else {
        const msg = err instanceof Error ? err.message : 'Неизвестная ошибка';
        setAiError(msg);
        console.error('[AI Fill] Error:', err);
      }
      setAiLoading(false);
      setAiProgress('');
      // Don't auto-dismiss errors — user should read them
    }
  }, [data, doSave]);

  const handleAiCancel = useCallback(() => {
    if (aiAbortRef.current) {
      aiAbortRef.current.abort();
    }
    setAiLoading(false);
    setAiProgress('');
    setAiError(null);
  }, []);

  // ── AI Fill per-section handler ──────
  const handleAiFillSection = useCallback(async (sectionId: string) => {
    if (aiSectionLoading) return; // one at a time

    const section = CHARACTER_SCHEMA.find(s => s.id === sectionId);
    if (!section) return;

    setAiSectionLoading(sectionId);
    setAiError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      // Build context from key filled fields
      const contextParts: string[] = [];
      if (data.firstName) contextParts.push(`Имя: ${data.firstName}`);
      if (data.lastName) contextParts.push(`Фамилия: ${data.lastName}`);
      if (data.gender) contextParts.push(`Пол: ${data.gender}`);
      if (data.age) contextParts.push(`Возраст: ${data.age}`);
      if (data.oneLiner) contextParts.push(`Суть: ${data.oneLiner}`);
      const context = contextParts.filter(Boolean).join('; ') || undefined;

      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data,
          sectionIds: [sectionId],
          context,
          provider: aiSettings.provider,
          model: aiSettings.model,
          temperature: aiSettings.temperature,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Сервер ответил ошибкой ${res.status}`);
      }

      const result = await res.json();

      if (!result.data || Object.keys(result.data).length === 0) {
        throw new Error(`AI не заполнил ни одного поля в секции «${section.label}».`);
      }

      setData(prev => {
        const next = { ...prev, ...result.data };
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => doSave(next), 800);
        return next;
      });

      // Expand the filled section
      setOpenSections(prev => new Set(prev).add(sectionId));

      // Brief success flash
      setTimeout(() => setAiSectionLoading(null), 2000);

    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : 'Ошибка';
      setAiError(msg);
      setAiSectionLoading(null);
    }
  }, [data, doSave, aiSectionLoading, aiSettings]);

  // ── AI Analyze handler ─────────────────
  const handleAnalyze = useCallback(async () => {
    setAnalyzeLoading(true);
    setAnalyzeError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data,
          provider: aiSettings.provider,
          model: aiSettings.model,
          temperature: 0.7,
          apiKey: aiSettings.apiKeys[aiSettings.provider] || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Сервер ответил ошибкой ${res.status}`);
      }

      const result = await res.json();

      const now = new Date();
      const ts = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + ' · ' +
        now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

      const record: AnalysisRecord = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        timestamp: ts,
        result: {
          categories: result.categories,
          totalIssues: result.totalIssues,
          summary: result.summary,
        },
        usage: result.usage,
        provider: result.provider || aiSettings.provider,
      };

      setAnalyses(prev => [record, ...prev]);
      setActiveAnalysisId(record.id);

    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : 'Ошибка';
      setAnalyzeError(msg);
    } finally {
      setAnalyzeLoading(false);
    }
  }, [data, aiSettings]);

  // ── Jump to field ───────────────────────
  const handleJumpToField = useCallback((fieldId: string, sectionId: string) => {
    setOpenSections(prev => new Set(prev).add(sectionId));
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
        el.classList.add('field-highlight');
        setTimeout(() => el.classList.remove('field-highlight'), 2000);
      }
    }, 200);
  }, []);

  // ── AI Fix handler ─────────────────────
  const handleFixIssues = useCallback(async (fieldIds: string[]) => {
    const analysis = analyses.find(a => a.id === activeAnalysisId);
    if (!analysis || fieldIds.length === 0) return;

    // Collect all issues from the active analysis
    const allIssues = analysis.result.categories.flatMap(c => c.issues);
    // Filter to issues that involve the fields we're fixing
    const relevantIssues = allIssues.filter(iss => iss.fields.some(fid => fieldIds.includes(fid)));
    if (relevantIssues.length === 0) return;

    // Find which sections contain the affected fields
    const sectionIds = new Set<string>();
    for (const section of CHARACTER_SCHEMA) {
      if (section.fields.some(f => fieldIds.includes(f.id))) {
        sectionIds.add(section.id);
      }
    }

    const fixContext = buildFixContext(relevantIssues, data);

    setFixLoading(true);
    setAiError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data,
          sectionIds: [...sectionIds],
          context: fixContext,
          provider: aiSettings.provider,
          model: aiSettings.model,
          temperature: aiSettings.temperature,
          apiKey: aiSettings.apiKeys[aiSettings.provider] || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Ошибка ${res.status}`);
      }

      const result = await res.json();

      if (!result.data || Object.keys(result.data).length === 0) {
        throw new Error('AI не вернул исправленных полей.');
      }

      setData(prev => {
        const next = { ...prev, ...result.data };
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => doSave(next), 800);
        return next;
      });

      // Expand affected sections
      setOpenSections(prev => {
        const next = new Set(prev);
        sectionIds.forEach(id => next.add(id));
        return next;
      });

    } catch (err: unknown) {
      clearTimeout(timeoutId);
      setAiError(err instanceof Error ? err.message : 'Ошибка исправления');
    } finally {
      setFixLoading(false);
    }
  }, [data, doSave, aiSettings, analyses, activeAnalysisId]);

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
      <div className="app-layout">
        <AnalyzeHistorySidebar
          records={analyses}
          activeId={activeAnalysisId}
          onSelect={setActiveAnalysisId}
          onDelete={(id) => {
            setAnalyses(prev => prev.filter(a => a.id !== id));
            if (activeAnalysisId === id) setActiveAnalysisId(null);
          }}
          onNewAnalysis={handleAnalyze}
          loading={analyzeLoading}
        />
        <div className="app-layout-main">
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
        <div className="toolbar-center">
          <span className="toolbar-model">
            {PROVIDER_LABELS[aiSettings.provider] !== undefined
              ? `${PROVIDER_LABELS[aiSettings.provider]} · ${PROVIDER_MODELS[aiSettings.provider].find(m => m.id === aiSettings.model)?.label || aiSettings.model}`
              : ''}
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

          {/* ── AI Fill Button ── */}
          <button
            className={`btn btn-sm btn-ai ${aiLoading ? 'loading' : ''}`}
            onClick={handleAiFill}
            disabled={aiLoading}
            title="AI заполнит все пустые поля на основе уже введённых данных"
          >
            {aiLoading ? (
              <span className="ai-spinner" />
            ) : (
              '✨ AI Заполнить'
            )}
          </button>

          <button
            className={`btn btn-sm btn-analyze ${analyzeLoading ? 'loading' : ''}`}
            onClick={handleAnalyze}
            disabled={analyzeLoading || aiLoading}
            title="AI проанализирует персонажа на противоречия, слепые зоны и клише"
          >
            {analyzeLoading ? <span className="ai-spinner" /> : '🔍 Анализ'}
          </button>

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

      {/* ── AI Status Bar ── */}
      {analyzeError && (
        <div className="ai-status ai-error">
          <span>⚠ {analyzeError}</span>
          <button className="btn btn-sm ai-retry-btn" onClick={() => { setAnalyzeError(null); handleAnalyze(); }}>Повторить</button>
        </div>
      )}
      {(aiLoading || aiProgress || aiError) && !analyzeError && (
        <div className={`ai-status ${aiError ? 'ai-error' : aiLoading ? 'ai-loading' : ''}`}>
          {aiError ? (
            <>
              <span>⚠ {aiError}</span>
              <button
                className="btn btn-sm ai-retry-btn"
                onClick={() => { setAiError(null); handleAiFill(); }}
              >
                Повторить
              </button>
            </>
          ) : aiLoading ? (
            <>{aiProgress}</>
          ) : (
            <>{aiProgress}</>
          )}
        </div>
      )}

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
                <button
                  className={`btn btn-icon btn-sm btn-ai-section ${aiSectionLoading === section.id ? 'loading' : ''}`}
                  disabled={aiSectionLoading !== null || aiLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAiFillSection(section.id);
                  }}
                  title={`AI заполнит пустые поля в секции «${section.label}»`}
                >
                  {aiSectionLoading === section.id ? '⏳' : '✨'}
                </button>
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

        </div>{/* app-layout-main */}
        {(() => { const a = analyses.find(r => r.id === activeAnalysisId); return a ? (
          <AnalyzePanel
            result={a.result}
            usage={a.usage}
            provider={a.provider}
            timestamp={a.timestamp}
            fixing={fixLoading}
            onClose={() => setActiveAnalysisId(null)}
            onJumpToField={handleJumpToField}
            onFixIssues={handleFixIssues}
          />
        ) : null; })()}
      </div>{/* app-layout */}

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
