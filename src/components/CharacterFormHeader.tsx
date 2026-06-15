import Link from 'next/link';
import { MutableRefObject } from 'react';
import { AiProgressData } from '@/hooks/useAiFill';

interface CharacterFormHeaderProps {
  projectId?: string;
  projectName?: string;
  characterId: string;
  aiProgress: AiProgressData | null;
  analyzeProgress: string;
  aiError: string | null;
  analyzeError: string | null;
  aiUndoStackLength: number;
  handleUndo: () => void;
  setShowAnalyzeHistory: (show: boolean) => void;
  handleAnalyze: () => void;
  analyzeLoading: boolean;
  analyzeAbortRef: MutableRefObject<AbortController | null>;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setShowExport: (show: boolean) => void;
  aiLoading: boolean;
  aiAbortRef: MutableRefObject<AbortController | null>;
  handleAiFill: () => void;
  showPrompts: boolean;
  setShowPrompts: (show: boolean) => void;
  showTweaks: boolean;
  setShowTweaks: (show: boolean) => void;
}

export function CharacterFormHeader({
  projectId,
  projectName,
  characterId,
  aiProgress,
  analyzeProgress,
  aiError,
  analyzeError,
  aiUndoStackLength,
  handleUndo,
  setShowAnalyzeHistory,
  handleAnalyze,
  analyzeLoading,
  analyzeAbortRef,
  handleImport,
  setShowExport,
  aiLoading,
  aiAbortRef,
  handleAiFill,
  showPrompts,
  setShowPrompts,
  showTweaks,
  setShowTweaks,
}: CharacterFormHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex justify-between items-center px-container-padding h-16 w-full border-b border-outline-variant bg-surface shrink-0">
      <div className="flex items-center gap-4">
        {projectId ? (
          <Link href={`/project/${projectId}`} className="text-on-surface-variant hover:text-primary transition-colors flex items-center pr-4 border-r border-outline-variant">
            <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
            <span className="font-label-caps text-[12px]">{projectName || 'Проект'}</span>
          </Link>
        ) : (
          <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors flex items-center pr-4 border-r border-outline-variant">
            <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
            <span className="font-label-caps text-[12px]">Персонажи</span>
          </Link>
        )}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <span className="text-on-surface font-label-caps text-[12px] font-bold">Анкета</span>
          <span className="text-on-surface-variant/50 material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href={`/character/${characterId}/narrative`} className="text-on-surface-variant hover:text-on-surface transition-colors font-label-caps text-[12px]">Описание</Link>
          <span className="text-on-surface-variant/50 material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href={`/character/${characterId}/public`} className="text-on-surface-variant hover:text-on-surface transition-colors font-label-caps text-[12px]">Мнения</Link>
          <span className="text-on-surface-variant/50 material-symbols-outlined text-[14px]">chevron_right</span>
          <Link href={`/character/${characterId}/voice`} className="text-on-surface-variant hover:text-on-surface transition-colors font-label-caps text-[12px]">Голос персонажа</Link>
        </div>
        {aiProgress && (
          <div className="ml-4 flex flex-col justify-center min-w-[200px] sm:min-w-[250px]">
            {aiProgress.isVisible ? (
              <>
                <div className="flex justify-between text-[10px] font-label-caps text-on-surface-variant mb-1 uppercase tracking-wider">
                  <span>{aiProgress.label}</span>
                  <span className="font-mono text-[9px]">{aiProgress.current} / {aiProgress.total}</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300 ease-out rounded-full" 
                    style={{ width: `${aiProgress.total > 0 ? Math.min(100, Math.round((aiProgress.current / aiProgress.total) * 100)) : 0}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <div className="text-[12px] font-medium text-primary flex items-center">
                {aiProgress.label}
              </div>
            )}
          </div>
        )}
        {!aiProgress?.isVisible && analyzeProgress && <span className="text-[12px] text-accent ml-4 truncate max-w-xs">{analyzeProgress}</span>}
        {aiError && <span className="text-[12px] text-error ml-4">{aiError}</span>}
        {analyzeError && <span className="text-[12px] text-error ml-4">{analyzeError}</span>}
      </div>
      <nav className="hidden md:flex gap-8">
      </nav>
      <div className="flex items-center gap-4">
        {aiUndoStackLength > 0 && (
          <button onClick={handleUndo} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full text-sm" title="Отменить изменения ИИ">
            <span className="material-symbols-outlined text-[16px]">undo</span> Отменить
          </button>
        )}
        <button onClick={() => setShowAnalyzeHistory(true)} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full text-[13px] font-medium" title="История анализов">
          <span className="material-symbols-outlined text-[16px]">history</span> История анализов
        </button>
        {analyzeLoading ? (
          <button onClick={() => analyzeAbortRef.current?.abort()} className="bg-[#f97316] text-white px-3 py-1.5 rounded-full text-[13px] font-medium hover:scale-95 duration-100 transition-transform flex items-center gap-1 shadow-sm" title="Отменить анализ">
            <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> Отменить анализ
          </button>
        ) : (
          <button onClick={handleAnalyze} className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full text-[13px] font-medium" title="Анализ">
            <span className="material-symbols-outlined text-[16px]">psychology</span> Анализ карточки
          </button>
        )}
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
  );
}
