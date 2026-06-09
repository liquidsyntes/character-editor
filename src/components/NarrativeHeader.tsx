import Link from 'next/link';

interface NarrativeHeaderProps {
  projectId?: string;
  projectName?: string;
  characterId: string;
  aiLoading: boolean;
  handleGenerate: () => void;
  setShowExport: (show: boolean) => void;
  showPrompts: boolean;
  setShowPrompts: (show: boolean) => void;
  showTweaks: boolean;
  setShowTweaks: (show: boolean) => void;
  hasNarrative: boolean;
}

export function NarrativeHeader({
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
  hasNarrative,
}: NarrativeHeaderProps) {
  return (
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
      </div>
      
      <div className="flex items-center gap-4">
        <button onClick={() => setShowExport(true)} className="text-on-surface-variant hover:text-primary transition-colors" title="Экспорт">
          <span className="material-symbols-outlined">share</span>
        </button>
        
        {aiLoading ? (
          <button onClick={handleGenerate} className="bg-error text-on-error px-4 py-2 rounded font-label-caps text-label-caps hover:scale-95 duration-100 transition-transform flex items-center gap-2">
             <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> Остановить
          </button>
        ) : (
          <button onClick={handleGenerate} className="bg-primary text-on-primary px-4 py-2 rounded font-label-caps text-label-caps hover:scale-95 duration-100 transition-transform flex items-center gap-2">
             <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
             {hasNarrative ? 'Перегенерировать' : 'Сформировать описание'}
          </button>
        )}
        
        <div className="h-6 w-px bg-outline-variant mx-2"></div>
        
        <button onClick={() => setShowPrompts(!showPrompts)} className="text-on-surface-variant hover:text-primary transition-colors" title="Системные промпты">
          <span className="material-symbols-outlined">code_blocks</span>
        </button>
        <button onClick={() => setShowTweaks(!showTweaks)} className="text-on-surface-variant hover:text-primary transition-colors" title="Настройки">
          <span className="material-symbols-outlined">settings</span>
        </button>
        <Link href={`/character/${characterId}`} className="text-on-surface-variant hover:text-primary transition-colors" title="Вернуться к анкете">
          <span className="material-symbols-outlined">badge</span>
        </Link>
      </div>
    </header>
  );
}
