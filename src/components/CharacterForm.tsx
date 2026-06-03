'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { CHARACTER_SCHEMA, getFilledFieldCount, getTotalFieldCount } from '@/lib/schema';
import { CharacterData } from '@/types/character';
import { useAiSettings } from '@/lib/ai/useAiSettings';

import ExportModal from './ExportModal';
import TweaksPanel from './TweaksPanel';
import PromptsPanel from './PromptsPanel';
import AnalyzePanel from './AnalyzePanel';
import AnalyzeHistorySidebar from './AnalyzeHistorySidebar';
import { SiblingCharacter } from './CharacterListPanel';
import { DiffModal } from './DiffModal';
import { CharacterSection } from './CharacterSection';
import { CharacterFormHeader } from './CharacterFormHeader';
import { CharacterFormSummary } from './CharacterFormSummary';
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

  const enrichedContext = useMemo(() => {
    let ctx = projectContext ? `Описание проекта/мира: ${projectContext}` : '';
    if (siblings && siblings.length > 0) {
      const others = siblings.filter(s => s.id !== characterId && s.summary && s.summary.trim() !== '');
      if (others.length > 0) {
        ctx += '\n\nУже существующие персонажи в этом проекте (используй их при генерации связей, фракций, союзников и врагов, чтобы вплести нового персонажа в сюжет):\n';
        others.forEach(s => {
          ctx += `- ${s.name || 'Неизвестный'}: ${s.summary}\n`;
        });
      }
    }
    return ctx;
  }, [projectContext, siblings, characterId]);

  const {
    aiLoading,
    aiProgress,
    aiError,
    aiSectionLoading,
    aiFieldLoading,
    aiAbortRef,
    handleAiFill,
    handleAiFillSection,
    handleAiFillField,
    handleAiScratchpad,
    handleQuickCommand,
  } = useAiFill({
    data, setData, doSave, pushUndo, setFixedFields, setOpenSections, aiSettings, projectContext: enrichedContext, saveTimer
  });

  const {
    analyzeLoading,
    analyses,
    activeAnalysisId,
    setActiveAnalysisId,
    analyzeError,
    analyzeProgress,
    fixLoading,
    pendingDiff,
    setPendingDiff,
    analyzeAbortRef,
    handleAnalyze,
    handleFixIssues,
    handleAcceptDiff,
    handleRejectDiff,
    handleDeleteAnalysis,
  } = useCharacterAnalysis({
    characterId,
    data,
    setData,
    doSave,
    pushUndo,
    setFixedFields,
    aiSettings,
    projectContext: enrichedContext,
    saveTimer
  });

  const [activeTab, setActiveTab] = useState<'sections' | 'scratchpad' | 'commands'>('sections');
  const [isSiblingDropdownOpen, setIsSiblingDropdownOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`scratchpad_${characterId}`) || '';
    setScratchpadText(saved);
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [characterId]);

  const handleScratchpadChange = (text: string) => {
    setScratchpadText(text);
    localStorage.setItem(`scratchpad_${characterId}`, text);
  };

  const handleJumpToSection = (sectionId: string) => {
    setOpenSections(prev => new Set(prev).add(sectionId));
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('character_editor_open_sections');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimeout(() => {
            setOpenSections(new Set(parsed));
          }, 0);
        }
      }
    } catch {}

    const savedScroll = sessionStorage.getItem(`scroll_${characterId}`);
    if (savedScroll && scrollRef.current) {
      scrollRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, [characterId]);

  useEffect(() => {
    try {
      localStorage.setItem('character_editor_open_sections', JSON.stringify(Array.from(openSections)));
    } catch {}
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
    <div className="flex w-full h-screen overflow-hidden bg-background">
      {/* Sidebar Hub */}
      <aside className="hidden md:flex flex-col w-[425px] h-full bg-primary text-white border-r border-white/10 select-none z-30 flex-shrink-0">
        {/* Sibling Switcher Header */}
        <div className="p-4 border-b border-white/10 flex flex-col gap-2 bg-black/25">
          <div className="relative">
            <button 
              onClick={() => setIsSiblingDropdownOpen(!isSiblingDropdownOpen)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all text-left text-white"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="text-xl flex-shrink-0">{data.emoji || '👤'}</span>
                <div className="overflow-hidden">
                  <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Проект: {projectName || 'Без названия'}</div>
                  <div className="font-semibold text-white text-sm truncate">{charName}</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-white/70 text-[18px] transition-transform duration-200" style={{ transform: isSiblingDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                keyboard_arrow_down
              </span>
            </button>
            
            {isSiblingDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSiblingDropdownOpen(false)} />
                <div className="absolute left-0 right-0 mt-1 bg-[#0f1d35] border border-white/10 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 text-[10px] text-white/50 font-bold border-b border-white/5 uppercase tracking-wider">
                    Персонажи проекта ({siblings.length})
                  </div>
                  {siblings.map(sib => {
                    const isCurrent = sib.id === characterId;
                    return (
                      <a
                        key={sib.id}
                        href={`/character/${sib.id}`}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/10 transition-colors text-sm ${isCurrent ? 'bg-white/10 text-white font-medium pointer-events-none' : 'text-white/80'}`}
                        title={sib.summary}
                      >
                        <span className="text-base flex-shrink-0">{sib.emoji || '👤'}</span>
                        <span className="truncate flex-1">{sib.name || 'Без имени'}</span>
                        {isCurrent && <span className="material-symbols-outlined text-[16px] text-white">check</span>}
                      </a>
                    );
                  })}
                  {projectId && (
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <a
                        href={`/project/${projectId}`}
                        className="flex items-center gap-2.5 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        <span>На дашборд проекта</span>
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/10 px-2 pt-1 gap-1 flex-shrink-0">
          <button
            onClick={() => setActiveTab('sections')}
            className={`flex-1 py-2.5 px-1 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'sections' 
                ? 'border-white text-white font-bold' 
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">navigation</span>
            Разделы
          </button>
          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`flex-1 py-2.5 px-1 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'scratchpad' 
                ? 'border-white text-white font-bold' 
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            Блокнот
          </button>
          <button
            onClick={() => setActiveTab('commands')}
            className={`flex-1 py-2.5 px-1 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'commands' 
                ? 'border-white text-white font-bold' 
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            AI-Ассистент
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          {activeTab === 'sections' && (
            <div className="space-y-1">
              {CHARACTER_SCHEMA.map(section => {
                const isSectionOpen = openSections.has(section.id);
                const sectionFields = section.fields.map(f => f.id);
                const sectionFilled = sectionFields.filter(fid => data[fid] && data[fid].trim() !== '').length;
                const sectionTotal = sectionFields.length;
                const sectionPercent = Math.round((sectionFilled / sectionTotal) * 100);

                return (
                  <button
                    key={section.id}
                    onClick={() => handleJumpToSection(section.id)}
                    className={`w-full flex flex-col gap-1.5 p-2 rounded-lg text-left transition-all ${
                      isSectionOpen 
                        ? 'bg-white/10 border border-white/10 text-white' 
                        : 'hover:bg-white/5 border border-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2 font-medium text-xs">
                        <span className="text-sm">{section.icon}</span>
                        <span className="truncate">{section.label}</span>
                      </div>
                      <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-white/15 text-white flex-shrink-0 ml-1">
                        {sectionFilled}/{sectionTotal}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          sectionPercent === 100 ? 'bg-green-400' : 'bg-white/70'
                        }`}
                        style={{ width: `${sectionPercent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'scratchpad' && (
            <div className="h-full flex flex-col gap-3 min-h-[400px]">
              <div className="text-[11px] text-white/50 leading-relaxed">
                Набросайте сырые мысли. AI определит, к каким полям они относятся, и предложит заполнить их.
              </div>
              <textarea
                value={scratchpadText}
                onChange={(e) => handleScratchpadChange(e.target.value)}
                placeholder="Например: Он левша, который до дрожи боится пауков и тайно влюблен в лучшую подругу Марину..."
                className="flex-1 w-full p-2.5 bg-black/20 border border-white/10 rounded-lg focus:border-white/30 focus:ring-1 focus:ring-white/20 outline-none text-xs resize-none custom-scrollbar min-h-[180px] text-white placeholder:text-white/30"
              />
              <button
                disabled={aiLoading || !scratchpadText.trim()}
                onClick={async () => {
                  try {
                    const proposed = await handleAiScratchpad(scratchpadText);
                    if (Object.keys(proposed).length > 0) {
                      setPendingDiff(proposed);
                    } else {
                      alert('AI не смог выделить новые данные для заполнения анкеты. Попробуйте написать подробнее.');
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="w-full py-2 px-3 bg-white text-primary rounded-lg font-semibold flex items-center justify-center gap-1.5 hover:bg-white/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow text-xs flex-shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>Раскидать по анкете</span>
              </button>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-3">
              <div className="text-[11px] text-white/50 leading-relaxed">
                Быстрые сценарии для проработки персонажа. Нейросеть сгенерирует новые детали.
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  disabled={aiLoading}
                  onClick={async () => {
                    try {
                      const proposed = await handleQuickCommand('lifeEvent');
                      if (Object.keys(proposed).length > 0) setPendingDiff(proposed);
                    } catch (e) { console.error(e); }
                  }}
                  className="p-2.5 text-left bg-white/5 border border-white/10 hover:border-white/20 rounded-lg transition-all flex items-start gap-2.5 disabled:opacity-50 w-full hover:bg-white/10"
                >
                  <span className="text-xl mt-0.5">🎲</span>
                  <div className="overflow-hidden">
                    <div className="font-semibold text-xs text-white">Случайное событие</div>
                    <div className="text-[10px] text-white/60 mt-0.5 leading-normal">Событие из прошлого, наложившее отпечаток на характер.</div>
                  </div>
                </button>

                <button
                  disabled={aiLoading}
                  onClick={async () => {
                    try {
                      const proposed = await handleQuickCommand('hiddenMotive');
                      if (Object.keys(proposed).length > 0) setPendingDiff(proposed);
                    } catch (e) { console.error(e); }
                  }}
                  className="p-2.5 text-left bg-white/5 border border-white/10 hover:border-white/20 rounded-lg transition-all flex items-start gap-2.5 disabled:opacity-50 w-full hover:bg-white/10"
                >
                  <span className="text-xl mt-0.5">🎭</span>
                  <div className="overflow-hidden">
                    <div className="font-semibold text-xs text-white">Скрытый мотив</div>
                    <div className="text-[10px] text-white/60 mt-0.5 leading-normal">Тайная потребность, противоречащая главной цели.</div>
                  </div>
                </button>

                <button
                  disabled={aiLoading}
                  onClick={async () => {
                    try {
                      const proposed = await handleQuickCommand('innerConflict');
                      if (Object.keys(proposed).length > 0) setPendingDiff(proposed);
                    } catch (e) { console.error(e); }
                  }}
                  className="p-2.5 text-left bg-white/5 border border-white/10 hover:border-white/20 rounded-lg transition-all flex items-start gap-2.5 disabled:opacity-50 w-full hover:bg-white/10"
                >
                  <span className="text-xl mt-0.5">⚖️</span>
                  <div className="overflow-hidden">
                    <div className="font-semibold text-xs text-white">Внутренний конфликт</div>
                    <div className="text-[10px] text-white/60 mt-0.5 leading-normal">Борьба между личными убеждениями и поступками.</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background h-full relative">
        <CharacterFormHeader 
          projectId={projectId}
          projectName={projectName}
          characterId={characterId}
          aiProgress={aiProgress}
          analyzeProgress={analyzeProgress}
          aiError={aiError}
          analyzeError={analyzeError}
          aiUndoStackLength={aiUndoStack.length}
          handleUndo={handleUndo}
          setShowAnalyzeHistory={setShowAnalyzeHistory}
          handleAnalyze={handleAnalyze}
          analyzeLoading={analyzeLoading}
          analyzeAbortRef={analyzeAbortRef}
          handleImport={handleImport}
          setShowExport={setShowExport}
          aiLoading={aiLoading}
          aiAbortRef={aiAbortRef}
          handleAiFill={handleAiFill}
          showPrompts={showPrompts}
          setShowPrompts={setShowPrompts}
          showTweaks={showTweaks}
          setShowTweaks={setShowTweaks}
        />

        <div className="flex-1 flex overflow-hidden">
          <div 
            className="flex-1 overflow-y-auto custom-scrollbar p-container-padding pb-32"
            ref={scrollRef}
            onScroll={handleScroll}
          >
            <div className="max-w-[800px] mx-auto space-y-stack-lg">
              
              <CharacterFormSummary 
                data={data}
                charName={charName}
                percent={percent}
                filled={filled}
                total={total}
              />

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

              {CHARACTER_SCHEMA.map(section => (
                <CharacterSection
                  key={section.id}
                  section={section}
                  isOpen={openSections.has(section.id)}
                  data={data}
                  fixedFields={fixedFields}
                  aiLoading={aiLoading}
                  aiSectionLoading={aiSectionLoading}
                  aiFieldLoading={aiFieldLoading}
                  aiAbortRef={aiAbortRef}
                  handleAiFillSection={handleAiFillSection}
                  handleAiFillField={handleAiFillField}
                  handleChange={handleChange}
                  toggleSection={() => setOpenSections(prev => { 
                    const n = new Set(prev); 
                    if (n.has(section.id)) {
                      n.delete(section.id);
                    } else {
                      n.add(section.id);
                    }
                    return n;
                  })}
                />
              ))}
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
          onSelect={(id) => {
            setActiveAnalysisId(id);
            setShowAnalyzeHistory(false);
          }}
          onDelete={handleDeleteAnalysis}
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
    </div>
  );
}
