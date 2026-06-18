'use client';

import { useState, useEffect } from 'react';
import { CHARACTER_SCHEMA } from '@/lib/schema';
import { CharacterData } from '@/types/character';
import { SiblingCharacter } from './CharacterListPanel';
import { QuickCommands } from './QuickCommands';

interface CharacterSidebarProps {
  data: CharacterData;
  characterId: string;
  projectName?: string;
  projectId?: string;
  siblings: SiblingCharacter[];
  openSections: Set<string>;
  setOpenSections: React.Dispatch<React.SetStateAction<Set<string>>>;
  aiLoading: boolean;
  handleAiScratchpad: (text: string) => Promise<Record<string, string>>;
  handleQuickCommand: (cmd: 'lifeEvent' | 'hiddenMotive' | 'innerConflict') => Promise<Record<string, string>>;
  setPendingDiff: (diff: Record<string, string> | null) => void;
}

export function CharacterSidebar({
  data,
  characterId,
  projectName,
  projectId,
  siblings,
  openSections,
  setOpenSections,
  aiLoading,
  handleAiScratchpad,
  handleQuickCommand,
  setPendingDiff,
}: CharacterSidebarProps) {
  const [activeTab, setActiveTab] = useState<'sections' | 'scratchpad' | 'commands'>('sections');
  const [isSiblingDropdownOpen, setIsSiblingDropdownOpen] = useState(false);
  const [scratchpadText, setScratchpadText] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`scratchpad_${characterId}`) || '';
    const timer = setTimeout(() => setScratchpadText(saved), 0);
    return () => clearTimeout(timer);
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

  const charName = [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Без имени';

  return (
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

            <a
              href={`/character/${characterId}/narrative`}
              className={`w-full flex items-center gap-2 p-2 mt-4 rounded-lg text-left transition-all bg-white/10 border border-white/20 text-white hover:bg-white/20 shadow-sm`}
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span className="text-sm font-medium">Художественное описание</span>
            </a>
            <a
              href={`/character/${characterId}/public`}
              className={`w-full flex items-center gap-2 p-2 mt-2 rounded-lg text-left transition-all bg-white/10 border border-white/20 text-white hover:bg-white/20 shadow-sm`}
            >
              <span className="material-symbols-outlined text-[16px]">forum</span>
              <span className="text-sm font-medium">Мнение о персонаже</span>
            </a>
            <a
              href={`/character/${characterId}/voice`}
              className={`w-full flex items-center gap-2 p-2 mt-2 rounded-lg text-left transition-all bg-white/10 border border-white/20 text-white hover:bg-white/20 shadow-sm`}
            >
              <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
              <span className="text-sm font-medium">Голос персонажа</span>
            </a>
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
          <QuickCommands 
            aiLoading={aiLoading} 
            handleQuickCommand={handleQuickCommand} 
            setPendingDiff={setPendingDiff} 
          />
        )}
      </div>
    </aside>
  );
}
