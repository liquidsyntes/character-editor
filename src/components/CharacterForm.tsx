'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

import { CHARACTER_SCHEMA, getFilledFieldCount, getTotalFieldCount, getSectionFilledCount } from '@/lib/schema';
import { CharacterData } from '@/types/character';
import { useAiSettings } from '@/lib/ai/useAiSettings';

import ExportModal from './ExportModal';
import TweaksPanel from './TweaksPanel';
import PromptsPanel from './PromptsPanel';
import AnalyzePanel from './AnalyzePanel';
import AnalyzeHistorySidebar from './AnalyzeHistorySidebar';
import { SiblingCharacter } from './CharacterListPanel';
import { DiffModal } from './DiffModal';

import { useCharacterFormState } from '@/hooks/useCharacterFormState';
import { useAiFill } from '@/hooks/useAiFill';
import { useCharacterAnalysis } from '@/hooks/useCharacterAnalysis';

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
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic']));
  const [showExport, setShowExport] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showAnalyzeHistory, setShowAnalyzeHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const aiState = useAiSettings();
  const aiSettings = aiState.saved;

  const {
    data,
    setData,
    saveStatus,
    doSave,
    aiUndoStack,
    pushUndo,
    handleUndo,
    handleChange,
    handleImport,
    fixedFields,
    setFixedFields,
    saveTimer,
  } = useCharacterFormState(characterId, initialData);

  const {
    aiLoading,
    aiProgress,
    aiError,
    aiSectionLoading,
    aiAbortRef,
    handleAiFill,
    handleAiFillSection,
  } = useAiFill({
    data, setData, doSave, pushUndo, setFixedFields, setOpenSections, aiSettings, projectContext, saveTimer
  });

  const {
    analyzeLoading,
    analyses,
    setAnalyses,
    activeAnalysisId,
    setActiveAnalysisId,
    analyzeError,
    analyzeProgress,
    fixLoading,
    pendingDiff,
    handleAnalyze,
    handleFixIssues,
    handleAcceptDiff,
    handleRejectDiff,
  } = useCharacterAnalysis({
    data, setData, doSave, pushUndo, setFixedFields, aiSettings, projectContext, saveTimer
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('character_editor_open_sections');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOpenSections(new Set(parsed));
        }
      }
    } catch (e) {}

    const savedScroll = sessionStorage.getItem(`scroll_${characterId}`);
    if (savedScroll && scrollRef.current) {
      scrollRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, [characterId]);

  useEffect(() => {
    try {
      localStorage.setItem('character_editor_open_sections', JSON.stringify(Array.from(openSections)));
    } catch (e) {}
  }, [openSections]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    sessionStorage.setItem(`scroll_${characterId}`, e.currentTarget.scrollTop.toString());
  };

  const handleJumpToField = (fieldId: string, sectionId: string) => {
    setOpenSections(prev => new Set(prev).add(sectionId));
    setTimeout(() => {
      const el = document.getElementById(fieldId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000);
      }
    }, 150);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); doSave(data); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [data, doSave]);

  const filled = getFilledFieldCount(data);
  const total = getTotalFieldCount();
  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
  const charName = [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Без имени';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-background h-full w-full">
      <header className="sticky top-0 z-40 flex justify-between items-center px-container-padding h-16 w-full border-b border-outline-variant bg-surface shrink-0">
        <div className="flex items-center gap-4">
          <Link href={projectId ? `/project/${projectId}` : '/'} className="text-on-surface-variant hover:text-primary transition-colors flex items-center pr-4 border-r border-outline-variant" title={projectId ? 'Вернуться к проекту' : 'На главную'}>
            <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
            <span className="font-label-caps text-[12px] hidden sm:inline">На главную</span>
          </Link>
          <button className="md:hidden text-on-surface hover:text-primary transition-colors">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="font-label-caps text-[14px] font-medium text-on-surface-variant/70 uppercase tracking-widest">{projectName || 'Без проекта'}</div>
          {aiProgress && <span className="text-[12px] text-accent ml-4 truncate max-w-xs">{aiProgress}</span>}
          {analyzeProgress && <span className="text-[12px] text-accent ml-4 truncate max-w-xs">{analyzeProgress}</span>}
          {aiError && <span className="text-[12px] text-error ml-4">{aiError}</span>}
          {analyzeError && <span className="text-[12px] text-error ml-4">{analyzeError}</span>}
        </div>
        <nav className="hidden md:flex gap-8">
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
          <label className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center justify-center" title="Импорт JSON">
            <span className="material-symbols-outlined">upload_file</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={() => setShowExport(true)} className="text-on-surface-variant hover:text-primary transition-colors" title="Экспорт">
            <span className="material-symbols-outlined">share</span>
          </button>
          {aiLoading ? (
            <button onClick={() => aiAbortRef.current?.abort()} className="bg-error text-on-error px-4 py-2 rounded font-label-caps text-label-caps hover:scale-95 duration-100 transition-transform flex items-center gap-2">
               <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> Отменить
            </button>
          ) : (
            <button onClick={handleAiFill} className="bg-primary text-on-primary px-4 py-2 rounded font-label-caps text-label-caps hover:scale-95 duration-100 transition-transform">
               ✨ Автозаполнение
            </button>
          )}
          <button onClick={() => setShowPrompts(!showPrompts)} className="text-on-surface-variant hover:text-primary transition-colors" title="Системные промпты">
            <span className="material-symbols-outlined">code_blocks</span>
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
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar p-container-padding pb-32"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          <div className="max-w-[800px] mx-auto space-y-stack-lg">
            
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
                      className={`ml-2 transition-colors p-1 rounded ${aiSectionLoading === section.id ? 'bg-error text-on-error' : 'bg-surface-container hover:bg-primary hover:text-on-primary'}`}
                      onClick={e => { 
                        e.stopPropagation(); 
                        if (aiSectionLoading === section.id) {
                          aiAbortRef.current?.abort();
                        } else {
                          handleAiFillSection(section.id);
                        }
                      }}
                      title={aiSectionLoading === section.id ? "Отменить запрос" : "Автозаполнить секцию"}
                      disabled={aiSectionLoading !== null && aiSectionLoading !== section.id}
                    >
                      {aiSectionLoading === section.id ? (
                        <span className="material-symbols-outlined text-[16px]">close</span>
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
                          const isSectionLoading = aiLoading || aiSectionLoading === section.id;
                          return (
                          <div key={field.id} id={field.id} className={`p-4 border rounded w-full ${spanClass} transition-all duration-500 ${isFixed ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-surface border-outline-variant'} ${isSectionLoading ? 'animate-pulse bg-surface-container/50' : ''}`}>
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
      
      <PromptsPanel isOpen={showPrompts} onClose={() => setShowPrompts(false)} />
      <TweaksPanel isOpen={showTweaks} onClose={() => setShowTweaks(false)} aiState={aiState} />
    </div>
  );
}
