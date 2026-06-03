'use client';

import { AnalyzeResult } from '@/types/character';

export interface AnalysisRecord {
  id: string;
  timestamp: string;
  result: AnalyzeResult;
  usage?: { promptTokens: number; completionTokens: number };
  provider?: string;
  dataSnapshot?: Record<string, string>;
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
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[190] backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={onClose} 
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-[320px] max-w-full bg-primary text-white border-l border-white/10 z-[195] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-white/10 shrink-0 flex justify-between items-center bg-black/25">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">История анализов</span>
            {records.length > 0 && (
              <span className="bg-white/15 text-white/90 font-mono text-[10px] px-2 py-0.5 rounded-full">
                {records.length}
              </span>
            )}
          </div>
          <button className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded transition-colors flex items-center justify-center" onClick={onClose}>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-4 border-b border-white/10 shrink-0 bg-black/10">
          <button
            className="w-full bg-white text-primary hover:bg-white/95 py-2 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow"
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

        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#0f1d35] p-3 space-y-2.5">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-50 p-4">
              <span className="material-symbols-outlined text-[32px] mb-2 text-white/60">history</span>
              <p className="text-xs text-white/60 leading-relaxed">Нет отчётов. Нажми «Новый анализ», чтобы создать первый.</p>
            </div>
          ) : (
            records.map(rec => (
              <div
                key={rec.id}
                className={`group relative rounded-lg border p-3 transition-all cursor-pointer ${
                  activeId === rec.id 
                    ? 'bg-white/10 border-white/30 shadow-sm' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
                onClick={() => onSelect(rec.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-[9px] text-white/50 tracking-wider">
                    {rec.timestamp}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${rec.result.totalIssues > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      Проблем: {rec.result.totalIssues}
                    </span>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-all flex items-center justify-center p-0.5 hover:bg-white/5 rounded"
                      onClick={(e) => { e.stopPropagation(); onDelete(rec.id); }}
                      title="Удалить отчёт"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
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
