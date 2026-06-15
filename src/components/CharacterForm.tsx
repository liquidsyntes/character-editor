'use client';

import Link from 'next/link';
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
import { CharacterSidebar } from './CharacterSidebar';
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
  isLore,
}: {
  characterId: string;
  initialData: CharacterData;
  isLore?: boolean;
  siblings?: SiblingCharacter[];
  projectId?: string;
  projectName?: string;
  projectContext?: string;
}) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['basic']));
  const [isLoreState, setIsLoreState] = useState(isLore || false);
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
  let charName = [data.firstName, data.lastName].filter(Boolean).join(' ');
  if (data.nickname) {
    charName = charName ? `${charName} «${data.nickname}»` : data.nickname;
  }
  charName = charName || 'Без имени';

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      <CharacterSidebar
        data={data}
        characterId={characterId}
        projectName={projectName}
        projectId={projectId}
        siblings={siblings}
        openSections={openSections}
        setOpenSections={setOpenSections}
        aiLoading={aiLoading}
        handleAiScratchpad={handleAiScratchpad}
        handleQuickCommand={handleQuickCommand}
        setPendingDiff={setPendingDiff}
      />


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
            className="flex-1 overflow-y-auto custom-scrollbar p-container-padding pb-[50vh]"
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
                isLore={isLoreState}
                onToggleLore={async (val) => {
                  setIsLoreState(val);
                  const { updateCharacterMeta } = await import('@/lib/actions');
                  await updateCharacterMeta(characterId, { isLore: val });
                }}
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

              {CHARACTER_SCHEMA.map(section => {
                // Если персонаж лорный, скрываем секцию "Экранное поведение"
                if (isLoreState && section.id === 'screen') return null;
                return (
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
              )})}
            </div>

            {/* Блок дополнительных функций (Нарратив и т.д.) */}
            <div className="mt-16 pt-8 border-t border-outline-variant flex justify-center">
              <Link
                href={`/character/${characterId}/narrative`}
                className="px-6 py-3 bg-surface border border-outline-variant rounded-lg text-on-surface hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488] transition-colors flex items-center gap-3 shadow-sm font-label-caps uppercase tracking-wider text-sm"
              >
                <span>Перейти к описанию</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
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
