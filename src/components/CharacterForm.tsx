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
import { DiffModal } from './DiffModal';
import { useAiSettings, PROVIDER_MODELS, PROVIDER_LABELS } from '@/lib/ai/useAiSettings';
import { buildFillPrompt } from '@/lib/ai/prompt'; // Replaced just for completeness if unused
import Link from 'next/link';

export default function CharacterForm({
  characterId,
  initialData,
  siblings = [],
  projectId,
  projectName,
  projectContext,
}: {
  characterId: string;
  initialData: CharacterData;
  siblings?: SiblingCharacter[];
  projectId?: string;
  projectName?: string;
  projectContext?: string;
}) {
  const backHref = projectId ? `/project/${projectId}` : '/project/unassigned';
  const backLabel = projectName || 'Без проекта';
  const [data, setData] = useState<CharacterData>(initialData);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic']));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showExport, setShowExport] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);
  const [showCharList, setShowCharList] = useState(false);
  const [showAnalyzeHistory, setShowAnalyzeHistory] = useState(false);
  const [isPending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const { saved: aiSettings } = useAiSettings();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProgress, setAiProgress] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSectionLoading, setAiSectionLoading] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [fixedFields, setFixedFields] = useState<string[]>([]);
  const [fixLoading, setFixLoading] = useState(false);
  const [aiUndoStack, setAiUndoStack] = useState<CharacterData[]>([]);
  const [pendingDiff, setPendingDiff] = useState<Record<string, string> | null>(null);

  const filled = getFilledFieldCount(data);
  const total = getTotalFieldCount();
  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;

  const pushUndo = useCallback((stateToSave: CharacterData) => {
    setAiUndoStack(prev => [...prev, stateToSave].slice(-10)); // Keep last 10 states
  }, []);

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

  const handleUndo = useCallback(() => {
    if (aiUndoStack.length === 0) return;
    const previous = aiUndoStack[aiUndoStack.length - 1];
    setAiUndoStack(prev => prev.slice(0, -1));
    setData(previous);
    doSave(previous);
  }, [aiUndoStack, doSave]);

  const handleAcceptDiff = useCallback((acceptedData: Record<string, string>) => {
    setData(prev => {
      pushUndo(prev);
      const next = { ...prev, ...acceptedData };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(next), 800);
      return next;
    });
    setFixedFields(Object.keys(acceptedData));
    setTimeout(() => setFixedFields([]), 5000);
    setPendingDiff(null);
  }, [pushUndo, doSave]);

  const handleRejectDiff = useCallback(() => {
    setPendingDiff(null);
  }, []);

  const parsePartialJson = (raw: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const kvPattern = /"([^"]+)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)/g;
    let match;
    while ((match = kvPattern.exec(raw)) !== null) {
      if (match[1] && match[2] !== undefined) {
        try {
          result[match[1]] = match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
        } catch {}
      }
    }
    return result;
  };

  const handleChange = useCallback((fieldId: string, value: string) => {
    setData(prev => {
      const next = { ...prev, [fieldId]: value };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => doSave(next), 1500);
      return next;
    });
  }, [doSave]);

  const aiAbortRef = useRef<AbortController | null>(null);

  const handleAiFill = useCallback(async () => {
    if (aiAbortRef.current) aiAbortRef.current.abort();
    setAiLoading(true); setAiError(null); setAiProgress('Думаю над персонажем...');
    const controller = new AbortController(); aiAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const contextParts: string[] = [];
      if (data.firstName) contextParts.push(`Имя: ${data.firstName}`);
      if (data.lastName) contextParts.push(`Фамилия: ${data.lastName}`);
      if (data.gender) contextParts.push(`Пол: ${data.gender}`);
      if (data.age) contextParts.push(`Возраст: ${data.age}`);
      if (data.oneLiner) contextParts.push(`Суть: ${data.oneLiner}`);
      if (data.characterFunction) contextParts.push(`Функция: ${data.characterFunction}`);

      const context = contextParts.filter(Boolean).join('; ') || undefined;

      const res = await fetch('/api/ai/fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data, 
          context: projectContext,
          stream: true,
          provider: aiSettings.provider,
          model: aiSettings.model, 
          temperature: aiSettings.temperature,
          apiKey: aiSettings.apiKeys[aiSettings.provider],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (!res.ok) {
        let errMsg = `Ошибка сервера (HTTP ${res.status})`;
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch(e){}
        throw new Error(errMsg);
      }
      if (!res.body) throw new Error('No body');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawJson = '';
      let finalParsed: Record<string, string> = {};
      let pushedUndo = false;
      let buffer = '';
      
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
              const parsedChunk = JSON.parse(dataStr);
              if (parsedChunk.error) throw new Error(parsedChunk.error);
              if (parsedChunk.text) {
                rawJson += parsedChunk.text;
                const partial = parsePartialJson(rawJson);
                finalParsed = partial;
                setData(prev => {
                  if (!pushedUndo) { pushUndo(prev); pushedUndo = true; }
                  return { ...prev, ...partial };
                });
              }
            } catch (e) {
              if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                 console.error(e);
              }
            }
          }
          boundary = buffer.indexOf('\n\n');
        }
      }

      // Finalize save
      setData(prev => {
         if (saveTimer.current) clearTimeout(saveTimer.current);
         saveTimer.current = setTimeout(() => doSave(prev), 800);
         return prev;
      });

      if (Object.keys(finalParsed).length > 0) {
        setFixedFields(Object.keys(finalParsed));
        setTimeout(() => setFixedFields([]), 5000);
      }

      setAiProgress(`✓ Заполнено ${Object.keys(finalParsed).length} полей`);
      setOpenSections(new Set(CHARACTER_SCHEMA.map(s => s.id)));
      setTimeout(() => { setAiLoading(false); setAiProgress(''); }, 4000);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setAiError(err.message || 'Ошибка');
      setAiProgress('');
      setAiLoading(false);
    }
  }, [data, doSave, aiSettings, projectContext, pushUndo]);

  const handleAiFillSection = useCallback(async (sectionId: string) => {
    if (aiSectionLoading) return;
    setAiSectionLoading(sectionId);
    setAiError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch('/api/ai/fill', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          existingData: data, 
          sectionIds: [sectionId], 
          context: projectContext,
          stream: true,
          provider: aiSettings.provider, 
          model: aiSettings.model, 
          apiKey: aiSettings.apiKeys[aiSettings.provider] 
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Ошибка сервера');
      if (!res.body) throw new Error('No body');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawJson = '';
      let finalParsed: Record<string, string> = {};
      let pushedUndo = false;
      let buffer = '';
      
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
              const parsedChunk = JSON.parse(dataStr);
              if (parsedChunk.error) throw new Error(parsedChunk.error);
              if (parsedChunk.text) {
                rawJson += parsedChunk.text;
                const partial = parsePartialJson(rawJson);
                finalParsed = partial;
                setData(prev => {
                  if (!pushedUndo) { pushUndo(prev); pushedUndo = true; }
                  return { ...prev, ...partial };
                });
              }
            } catch (e) {}
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
      
      setData(prev => {
         if (saveTimer.current) clearTimeout(saveTimer.current);
         saveTimer.current = setTimeout(() => doSave(prev), 800);
         return prev;
      });
      
      if (Object.keys(finalParsed).length > 0) {
        setFixedFields(Object.keys(finalParsed));
        setTimeout(() => setFixedFields([]), 5000);
      }
      
      setOpenSections(prev => new Set(prev).add(sectionId));
      setTimeout(() => setAiSectionLoading(null), 2000);
    } catch (err: any) {
      clearTimeout(timeoutId); 
      setAiSectionLoading(null);
      setAiError(err.message || 'Ошибка при заполнении секции');
    }
  }, [data, doSave, aiSectionLoading, aiSettings, projectContext, pushUndo]);

  const handleAnalyze = useCallback(async () => {
    setAnalyzeLoading(true); setAnalyzeError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          existingData: data, 
          context: projectContext,
          provider: aiSettings.provider, 
          model: aiSettings.model, 
          temperature: 0.7, 
          apiKey: aiSettings.apiKeys[aiSettings.provider] 
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const result = await res.json();
      const now = new Date();
      const ts = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) + ' · ' + now.toLocaleDateString('ru-RU');
      const record: AnalysisRecord = {
        id: Date.now().toString(36), timestamp: ts,
        result: { categories: result.categories, totalIssues: result.totalIssues, summary: result.summary },
        usage: result.usage, provider: result.provider || aiSettings.provider,
      };
      setAnalyses(prev => [record, ...prev]);
      setActiveAnalysisId(record.id);
    } catch (err: any) {
      clearTimeout(timeoutId); setAnalyzeError(err.message);
    } finally {
      setAnalyzeLoading(false);
    }
  }, [data, aiSettings, projectContext]);

  const handleFixIssues = useCallback(async (fieldIds: string[]) => {
    if (!activeAnalysisId) return;
    const activeAnalysis = analyses.find(a => a.id === activeAnalysisId);
    if (!activeAnalysis) return;
    
    const allIssues = activeAnalysis.result.categories.flatMap(c => c.issues || []);
    
    setFixLoading(true);
    setAnalyzeError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch('/api/ai/analyze/fix', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingData: data,
          issues: allIssues,
          provider: aiSettings.provider,
          model: aiSettings.model,
          temperature: 0.7,
          apiKey: aiSettings.apiKeys[aiSettings.provider],
          context: projectContext
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        let errMsg = `Ошибка сервера (HTTP ${res.status})`;
        try { const errData = await res.json(); if (errData.error) errMsg = errData.error; } catch(e){}
        throw new Error(errMsg);
      }
      const result = await res.json();
      if (!result.data || Object.keys(result.data).length === 0) throw new Error('Нейросеть не вернула данные');

      setPendingDiff(result.data);
      
    } catch (err: any) {
      clearTimeout(timeoutId); setAnalyzeError(err.message || 'Ошибка авто-исправления');
    } finally {
      setFixLoading(false);
    }
  }, [data, doSave, aiSettings, activeAnalysisId, analyses]);

  const handleJumpToField = useCallback((fieldId: string, sectionId: string) => {
    setOpenSections(prev => new Set(prev).add(sectionId));
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000);
      }
    }, 150);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); doSave(data); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [data, doSave]);

  const charName = [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Без имени';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-background h-full w-full">
      
      <header className="sticky top-0 z-40 flex justify-between items-center px-container-padding h-16 w-full border-b border-outline-variant bg-surface shrink-0">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-on-surface hover:text-primary transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="font-label-caps text-[14px] font-medium text-on-surface-variant/70 uppercase tracking-widest">{projectName || 'Без проекта'}</div>
          {aiProgress && <span className="text-[12px] text-accent ml-4">{aiProgress}</span>}
          {aiError && <span className="text-[12px] text-error ml-4">{aiError}</span>}
        </div>
        <nav className="hidden md:flex gap-8">
          {/* Removed text save indicator */}
        </nav>
        <div className="flex items-center gap-4">
          {aiUndoStack.length > 0 && (
            <button onClick={handleUndo} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full text-sm" title="Отменить изменения ИИ">
              <span className="material-symbols-outlined text-[16px]">undo</span> Отменить
            </button>
          )}
          <button onClick={() => setShowAnalyzeHistory(true)} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full text-[13px] font-medium" title="История анализов">
            <span className="material-symbols-outlined text-[16px]">history</span> История анализов
          </button>
          <button onClick={handleAnalyze} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full text-[13px] font-medium" title="Анализ">
            <span className="material-symbols-outlined text-[16px]">{analyzeLoading ? 'hourglass_empty' : 'psychology'}</span> Анализ карточки
          </button>
          <div className="h-6 w-px bg-outline-variant mx-2"></div>
          <button onClick={() => setShowExport(true)} className="text-on-surface-variant hover:text-primary transition-colors" title="Экспорт">
            <span className="material-symbols-outlined">share</span>
          </button>
          <button onClick={handleAiFill} disabled={aiLoading} className="bg-primary text-on-primary px-4 py-2 rounded font-label-caps text-label-caps hover:scale-95 duration-100 transition-transform">
             {aiLoading ? 'Заполняю...' : '✨ Автозаполнение'}
          </button>
          <button onClick={() => setShowTweaks(!showTweaks)} className="text-on-surface-variant hover:text-primary transition-colors" title="Настройки">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <Link href={`/character/${characterId}/preview`} className="text-on-surface-variant hover:text-primary transition-colors" title="Предпросмотр">
            <span className="material-symbols-outlined">visibility</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-container-padding pb-32">
          <div className="max-w-[800px] mx-auto space-y-stack-lg">
            
            {/* Header Identity */}
            <section className="flex flex-col md:flex-row gap-gutter items-start">
              <div className="shrink-0 group cursor-pointer">
                <div className="w-32 h-40 bg-surface-container-high border border-outline-variant flex flex-col items-center justify-center text-on-surface-variant group-hover:bg-surface-container-highest transition-colors relative overflow-hidden">
                  <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">add_a_photo</span>
                  <span className="font-label-caps text-[10px] uppercase tracking-widest opacity-50">Фото</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-4 pt-2">
                <div>
                  <input 
                    className="w-full text-display-lg font-display-lg text-primary bg-transparent input-underline placeholder:text-outline focus:ring-0 px-0 focus:outline-none uppercase" 
                    placeholder="ИМЯ ПЕРСОНАЖА" 
                    type="text" 
                    value={charName}
                    readOnly
                  />
                  <div className="text-[12px] text-outline mt-1 font-label-caps">Чтобы изменить имя, заполните Имя и Фамилию в Досье</div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {data.characterFunction && (
                    <span className="bg-surface border border-outline-variant text-on-surface font-label-caps text-label-caps px-3 py-1.5 rounded uppercase">
                      {data.characterFunction}
                    </span>
                  )}
                  {data.plotSignificance && (
                    <span className="bg-surface border border-outline-variant text-on-surface font-label-caps text-label-caps px-3 py-1.5 rounded uppercase">
                      {data.plotSignificance}
                    </span>
                  )}
                  {!data.characterFunction && !data.plotSignificance && (
                    <span className="bg-surface border border-outline-variant text-on-surface font-label-caps text-label-caps px-3 py-1.5 rounded uppercase opacity-50">
                      Роль не указана
                    </span>
                  )}
                  <span className={`${percent === 100 ? 'bg-[#22c55e]/10 text-[#22c55e]' : percent >= 50 ? 'bg-[#f97316]/10 text-[#f97316]' : percent > 0 ? 'bg-[#ef4444]/10 text-[#ef4444]' : 'bg-surface-variant text-on-surface-variant'} font-mono-data text-[12px] px-2 py-1 rounded transition-colors duration-300`}>
                    Прогресс: {filled}/{total} ({percent}%)
                  </span>
                </div>
              </div>
            </section>

            <div className="flex items-center">
              <hr className="flex-1 border-outline-variant" />
              <div className="flex gap-2 ml-4">
                 <button onClick={() => setOpenSections(new Set(CHARACTER_SCHEMA.map(s => s.id)))} className="text-on-surface-variant hover:text-primary transition-colors p-1.5 bg-surface-container rounded" title="Развернуть все категории">
                   <span className="material-symbols-outlined text-[18px]">unfold_more</span>
                 </button>
                 <button onClick={() => setOpenSections(new Set())} className="text-on-surface-variant hover:text-primary transition-colors p-1.5 bg-surface-container rounded" title="Свернуть все категории">
                   <span className="material-symbols-outlined text-[18px]">unfold_less</span>
                 </button>
              </div>
            </div>

            {CHARACTER_SCHEMA.map(section => {
              const isOpen = openSections.has(section.id);
              const sectionFilled = getSectionFilledCount(section.id, data);
              
              return (
                <section key={section.id} id={section.id} className="scroll-mt-20">
                  <h2 
                    className="font-label-caps text-label-caps text-on-surface-variant mb-stack-md uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setOpenSections(prev => { const n = new Set(prev); n.has(section.id) ? n.delete(section.id) : n.add(section.id); return n;})}
                  >
                    <span className="material-symbols-outlined text-[16px]">{isOpen ? 'expand_more' : 'chevron_right'}</span>
                    {section.label}
                    <span className="ml-auto text-[10px] bg-surface-variant px-2 py-1 rounded">
                      {sectionFilled} / {section.fields.length}
                    </span>
                    <button 
                      className={`ml-2 transition-colors p-1 rounded ${aiSectionLoading === section.id ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-primary hover:text-on-primary'}`}
                      onClick={e => { e.stopPropagation(); handleAiFillSection(section.id); }}
                      title="Автозаполнить секцию"
                      disabled={aiSectionLoading !== null}
                    >
                      {aiSectionLoading === section.id ? (
                        <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">magic_button</span>
                      )}
                    </button>
                  </h2>
                  
                  {isOpen && (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {section.fields.map(field => {
                          const spanClass = field.span === 2 ? 'md:col-span-2' : 
                                            field.span === 3 ? 'md:col-span-3' : 
                                            'md:col-span-6';
                          const isFixed = fixedFields.includes(field.id);
                          return (
                          <div key={field.id} id={field.id} className={`p-4 border rounded w-full ${spanClass} transition-all duration-500 ${isFixed ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-surface border-outline-variant'}`}>
                            <label className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">
                              {field.label}
                            </label>
                            {field.type === 'select' ? (
                              <select
                                className="w-full bg-transparent border-none p-0 font-body-md text-on-surface focus:ring-0 outline-none"
                                value={data[field.id] || ''}
                                onChange={e => handleChange(field.id, e.target.value)}
                              >
                                <option value="" disabled>Выберите...</option>
                                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            ) : field.type === 'textarea' ? (
                              <textarea
                                className="w-full bg-transparent border-none p-0 font-body-md text-on-surface focus:ring-0 outline-none resize-y min-h-[60px]"
                                placeholder={field.placeholder}
                                value={data[field.id] || ''}
                                onChange={e => handleChange(field.id, e.target.value)}
                                rows={3}
                                autoComplete="off"
                              />
                            ) : (
                              <input
                                className="w-full bg-transparent border-none p-0 font-body-md text-on-surface focus:ring-0 outline-none"
                                type="text"
                                placeholder={field.placeholder}
                                value={data[field.id] || ''}
                                onChange={e => handleChange(field.id, e.target.value)}
                                autoComplete="off"
                              />
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
        
        {activeAnalysisId && (() => {
          const a = analyses.find(r => r.id === activeAnalysisId);
          return a ? (
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
          ) : null;
        })()}
      </div>

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
        isOpen={showAnalyzeHistory}
        onClose={() => setShowAnalyzeHistory(false)}
      />

      {pendingDiff && (
        <DiffModal
          originalData={data}
          proposedData={pendingDiff}
          onAccept={handleAcceptDiff}
          onReject={handleRejectDiff}
        />
      )}

      {showExport && (
        <ExportModal data={data} name={charName} onClose={() => setShowExport(false)} />
      )}

      {saveStatus !== 'idle' && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full shadow border border-outline-variant text-sm font-medium z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {saveStatus === 'saving' ? (
            <>
              <span className="material-symbols-outlined text-[16px] animate-spin text-primary">sync</span>
              <span className="text-on-surface-variant">Сохранение...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
              <span className="text-green-500">Сохранено</span>
            </>
          )}
        </div>
      )}
      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} />
    </div>
  );
}
