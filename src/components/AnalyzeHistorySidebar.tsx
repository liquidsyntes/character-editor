'use client';

import { AnalyzeResult } from '@/types/character';

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  result: AnalyzeResult;
  usage?: { promptTokens: number; completionTokens: number };
  provider?: string;
}

interface Props {
  records: AnalysisRecord[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewAnalysis: () => void;
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalyzeHistorySidebar({
  records,
  activeId,
  onSelect,
  onDelete,
  onNewAnalysis,
  loading,
  isOpen,
  onClose,
}: Props) {
  if (!isOpen && !activeId) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-[190] backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={onClose} 
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed md:relative top-0 right-0 h-full w-[320px] max-w-full bg-surface-container-lowest border-l border-outline-variant z-[195] shadow-2xl md:shadow-none flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:hidden'
        } ${activeId ? 'hidden md:flex' : ''}`}
      >
        <div className="p-4 border-b border-outline-variant shrink-0 flex justify-between items-center bg-surface">
          <div className="flex items-center gap-2">
            <span className="font-headline-sm text-[18px] font-bold text-on-surface">Отчёты</span>
            {records.length > 0 && (
              <span className="bg-primary/10 text-primary font-mono-data text-[10px] px-2 py-0.5 rounded-full">
                {records.length}
              </span>
            )}
          </div>
          <button className="md:hidden text-on-surface-variant hover:text-primary p-1 bg-surface-container rounded transition-colors" onClick={onClose}>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-4 border-b border-outline-variant shrink-0 bg-surface">
          <button
            className="w-full bg-surface-container-high border border-outline-variant text-primary hover:bg-primary hover:text-on-primary hover:border-primary py-2 rounded font-label-caps text-[12px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={onNewAnalysis}
            disabled={loading}
          >
            {loading ? (
              <><span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> Анализ...</>
            ) : (
              <><span className="material-symbols-outlined text-[16px]">search</span> Новый анализ</>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background p-2 space-y-2">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-50 p-4">
              <span className="material-symbols-outlined text-[32px] mb-2">history</span>
              <p className="font-body-md text-[13px] text-on-surface-variant">Нет отчётов. Нажми «Новый анализ», чтобы создать первый.</p>
            </div>
          ) : (
            records.map(rec => (
              <div
                key={rec.id}
                className={`group relative rounded-lg border p-3 transition-all cursor-pointer ${
                  activeId === rec.id 
                    ? 'bg-primary/5 border-primary shadow-sm' 
                    : 'bg-surface border-outline-variant hover:border-primary/50'
                }`}
                onClick={() => onSelect(rec.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">
                    {rec.timestamp}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono-data text-[10px] px-1.5 py-0.5 rounded ${rec.result.totalIssues > 0 ? 'bg-error/10 text-error' : 'bg-green-500/10 text-green-500'}`}>
                      {rec.result.totalIssues}
                    </span>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error transition-all"
                      onClick={(e) => { e.stopPropagation(); onDelete(rec.id); }}
                      title="Удалить отчёт"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
                
                <p className="font-body-md text-[13px] text-on-surface line-clamp-3 leading-relaxed">
                  {rec.result.summary || 'Без сводки'}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
