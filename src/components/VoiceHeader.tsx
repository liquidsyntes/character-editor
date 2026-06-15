'use client';

import React from 'react';
import Link from 'next/link';

interface VoiceHeaderProps {
  projectId?: string;
  projectName?: string;
  characterId: string;
  aiLoading: boolean;
  handleGenerate: () => void;
  setShowExport: (val: boolean) => void;
  showPrompts: boolean;
  setShowPrompts: (val: boolean) => void;
  showTweaks: boolean;
  setShowTweaks: (val: boolean) => void;
  hasVoice: boolean;
}

export function VoiceHeader({
  projectId,
  projectName,
  characterId,
  aiLoading,
  handleGenerate,
  setShowExport,
  showPrompts,
  setShowPrompts,
  showTweaks,
  setShowTweaks,
  hasVoice
}: VoiceHeaderProps) {
  const isProjectContext = !!projectId;

  return (
    <header className="sticky top-0 z-40 flex justify-between items-center px-container-padding h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {isProjectContext ? (
          <Link href={`/project/${projectId}`} className="text-on-surface-variant hover:text-primary transition-colors flex items-center pr-4 border-r border-outline-variant">
            <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
            <span className="font-label-caps text-[12px]">{projectName}</span>
          </Link>
        ) : (
          <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors flex items-center pr-4 border-r border-outline-variant">
            <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
            <span className="font-label-caps text-[12px]">Персонажи</span>
          </Link>
        )}
        <div className="hidden md:flex items-center gap-2">
          <Link href={`/character/${characterId}`} className="text-on-surface-variant hover:text-on-surface transition-colors font-label-caps text-[12px]">Анкета</Link>
          <span className="text-on-surface-variant/50 material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href={`/character/${characterId}/narrative`} className="text-on-surface-variant hover:text-on-surface transition-colors font-label-caps text-[12px]">Описание</Link>
          <span className="text-on-surface-variant/50 material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href={`/character/${characterId}/public`} className="text-on-surface-variant hover:text-on-surface transition-colors font-label-caps text-[12px]">Мнения</Link>
          <span className="text-on-surface-variant/50 material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-label-caps text-[12px] font-bold">Голос персонажа</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2">
          <button
            className={`p-2 rounded hover:bg-surface-container transition-colors ${showPrompts ? 'text-primary' : 'text-on-surface-variant'}`}
            onClick={() => setShowPrompts(!showPrompts)}
            title="Промпты генерации"
          >
            <span className="material-symbols-outlined text-[20px]">code_blocks</span>
          </button>
          <button
            className={`p-2 rounded hover:bg-surface-container transition-colors ${showTweaks ? 'text-primary' : 'text-on-surface-variant'}`}
            onClick={() => setShowTweaks(!showTweaks)}
            title="Настройки нейросети"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
          {hasVoice && (
            <button
              className="p-2 rounded hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary"
              onClick={() => setShowExport(true)}
              title="Экспортировать текст"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          )}
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={aiLoading}
          className="bg-primary text-on-primary px-3 md:px-4 py-2 flex items-center gap-2 rounded font-label-caps text-[12px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {aiLoading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>
              <span className="hidden md:inline">Генерация...</span>
              <span className="md:hidden">...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px] hidden md:inline">record_voice_over</span>
              <span>Сформировать диалоги</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
