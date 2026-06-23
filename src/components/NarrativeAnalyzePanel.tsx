'use client';

import { useEffect, useState } from 'react';
import { NarrativeAnalyzeResult, NarrativeAnalyzeIssue } from '@/types/character';

const NARRATIVE_SEVERITY_LABELS: Record<string, { label: string; twColor: string; bg: string; border: string }> = {
  'style': { label: 'Стиль', twColor: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
  'show-dont-tell': { label: 'Покажи, не рассказывай', twColor: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  'pacing': { label: 'Темп', twColor: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/20' },
  'cliche': { label: 'Клише', twColor: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  'opportunity': { label: 'Упущено', twColor: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
};

interface Props {
  result: NarrativeAnalyzeResult;
  fixingIssueTitle: string | null;
  onClose: () => void;
  onFixIssue: (issue: NarrativeAnalyzeIssue) => void;
}

export default function NarrativeAnalyzePanel({ result, fixingIssueTitle, onClose, onFixIssue }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="w-[400px] border-l border-outline-variant bg-surface flex flex-col h-full shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.2)] animate-in slide-in-from-right-4 duration-300 z-50 fixed right-0 top-0 md:static md:shadow-none md:animate-none">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-headline-sm text-[18px] font-bold flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">psychology</span> Анализ текста
          </h2>
          <button className="text-on-surface-variant hover:text-primary transition-colors p-1 bg-surface-container rounded" onClick={onClose} title="Закрыть (Esc)">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            {result.totalIssues > 0 && (
              <span className="font-label-caps text-[10px] text-error bg-error/10 px-2 py-0.5 rounded tracking-wider uppercase inline-block w-fit">
                {result.totalIssues} проблем
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-surface-container-lowest">
        {result.summary && (
          <div className="font-body-md text-[14px] text-on-surface-variant leading-relaxed bg-surface-container-high p-4 rounded-lg border border-outline-variant italic">
            {result.summary}
          </div>
        )}

        {result.totalIssues === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-70">
            <span className="text-[48px] mb-4">✨</span>
            <p className="font-body-md text-on-surface-variant">Текст отличный! AI не нашел стилистических ошибок или клише.</p>
          </div>
        ) : (
          result.categories.map((cat, ci) => (
            <div key={ci} className="space-y-4">
              <h3 className="font-label-caps text-[12px] text-on-surface uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/50 pb-2">
                <span className="material-symbols-outlined text-[16px]">{cat.icon || 'edit'}</span>
                {cat.title}
                <span className="ml-auto bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded-full text-[10px]">
                  {cat.issues.length}
                </span>
              </h3>
              
              <div className="space-y-3">
                {cat.issues.map((issue, ii) => {
                  const style = NARRATIVE_SEVERITY_LABELS[issue.severity] || NARRATIVE_SEVERITY_LABELS['style'];
                  const isFixing = fixingIssueTitle === issue.title;
                  
                  return (
                    <div key={ii} className="bg-surface border border-outline-variant rounded-lg p-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-start gap-2 mb-2">
                        <span className={`font-label-caps text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${style.twColor} ${style.bg} ${style.border}`}>
                          {style.label}
                        </span>
                        <span className="font-headline-sm text-[14px] font-bold text-on-surface mt-[-1px] leading-tight">
                          {issue.title}
                        </span>
                      </div>
                      
                      <p className="font-body-md text-[13px] text-on-surface-variant mb-3 leading-relaxed">
                        {issue.description}
                      </p>
                      
                      {issue.quote && (
                        <div className="bg-surface-container-high p-3 rounded border border-outline-variant mb-3">
                          <div className="text-[10px] text-on-surface-variant/70 uppercase tracking-wider mb-1 font-semibold">В тексте:</div>
                          <p className="font-body-md text-[13px] text-on-surface-variant italic">
                            «{issue.quote}»
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-end mt-3 pt-3 border-t border-outline-variant/30">
                        <button
                          className="font-label-caps text-[10px] text-primary bg-primary/10 hover:bg-primary hover:text-on-primary px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 border border-primary/20 disabled:opacity-50"
                          onClick={() => onFixIssue(issue)}
                          disabled={isFixing || !!fixingIssueTitle}
                        >
                          {isFixing ? (
                            <><span className="material-symbols-outlined animate-spin text-[14px]">refresh</span> Исправляю…</>
                          ) : (
                            <><span className="material-symbols-outlined text-[14px]">auto_fix_high</span> Исправить</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
