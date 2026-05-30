'use client';

import { useEffect } from 'react';
import { AnalyzeResult, AnalyzeIssue } from '@/types/character';
import { CHARACTER_SCHEMA } from '@/lib/schema';
import { SEVERITY_LABELS } from '@/lib/constants';

const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-on-surface">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

interface Props {
  result: AnalyzeResult;
  usage?: { promptTokens: number; completionTokens: number };
  provider?: string;
  timestamp?: string;
  fixing?: boolean;
  onClose: () => void;
  onJumpToField: (fieldId: string, sectionId: string) => void;
  onFixIssues?: (issues: AnalyzeIssue[]) => void;
}



function getSectionForField(fieldId: string): { sectionId: string; label: string } | null {
  for (const section of CHARACTER_SCHEMA) {
    if (section.fields.some(f => f.id === fieldId)) {
      return { sectionId: section.id, label: section.label };
    }
  }
  return null;
}

export default function AnalyzePanel({ result, usage, provider, timestamp, fixing, onClose, onJumpToField, onFixIssues }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const allFieldIds = [...new Set(result.categories.flatMap(c => c.issues.flatMap(i => i.fields)))];

  return (
    <div className="w-[400px] border-l border-outline-variant bg-surface flex flex-col h-full shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.2)] animate-in slide-in-from-right-4 duration-300 z-50 fixed right-0 top-0 md:static md:shadow-none md:animate-none">
      {/* Header */}
      <div className="p-4 border-b border-outline-variant shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-headline-sm text-[18px] font-bold flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">analytics</span> Анализ
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
            {timestamp && <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">{timestamp}</span>}
          </div>
          {usage && (
            <span className="font-mono-data text-[10px] text-on-surface-variant/70 text-right">
              {usage.promptTokens + usage.completionTokens} токенов<br />
              {provider || 'AI'}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-surface-container-lowest">
        {/* Summary */}
        {result.summary && (
          <div className="font-body-md text-[14px] text-on-surface-variant leading-relaxed bg-surface-container-high p-4 rounded-lg border border-outline-variant italic">
            {result.summary}
          </div>
        )}

        {result.totalIssues === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center opacity-70">
            <span className="text-[48px] mb-4">🎉</span>
            <p className="font-body-md text-on-surface-variant">AI не нашёл проблем в карточке. Либо персонаж отлично проработан, либо заполнено слишком мало полей.</p>
          </div>
        ) : (
          result.categories.map((cat, ci) => (
            <div key={ci} className="space-y-4">
              <h3 className="font-label-caps text-[12px] text-on-surface uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/50 pb-2">
                <span>{cat.icon}</span>
                {cat.title}
                <span className="ml-auto bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded-full text-[10px]">
                  {cat.issues.length}
                </span>
              </h3>
              
              <div className="space-y-3">
                {cat.issues.map((issue, ii) => {
                  const style = SEVERITY_LABELS[issue.severity] || SEVERITY_LABELS.inconsistency;
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
                        <FormattedText text={issue.description} />
                      </p>
                      
                      {issue.suggestion && (
                        <div className="flex items-start gap-2 bg-primary/5 p-3 rounded border border-primary/10 mb-3">
                          <span className="text-[14px]">💡</span>
                          <p className="font-body-md text-[13px] text-primary/90 leading-relaxed italic">
                            <FormattedText text={issue.suggestion} />
                          </p>
                        </div>
                      )}
                      
                      {issue.fields.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-outline-variant/30">
                          {issue.fields.map(fid => {
                            const sf = getSectionForField(fid);
                            const label = CHARACTER_SCHEMA.flatMap(s => s.fields).find(f => f.id === fid)?.label || fid;
                            return sf ? (
                              <button
                                key={fid}
                                className="font-label-caps text-[10px] text-on-surface bg-surface-container hover:bg-primary hover:text-on-primary px-2 py-1 rounded transition-colors flex items-center gap-1 border border-outline-variant"
                                onClick={() => onJumpToField(fid, sf.sectionId)}
                              >
                                {label} <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                              </button>
                            ) : null;
                          })}
                          <div className="flex-1" />
                          {onFixIssues && (
                            <button
                              className="font-label-caps text-[10px] text-primary bg-primary/10 hover:bg-primary hover:text-on-primary px-2 py-1 rounded transition-colors flex items-center gap-1 border border-primary/20"
                              onClick={() => onFixIssues([issue])}
                            >
                              <span className="material-symbols-outlined text-[12px]">auto_fix_high</span>
                              Исправить
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fix button */}
      {allFieldIds.length > 0 && onFixIssues && (
        <div className="p-4 border-t border-outline-variant bg-surface shrink-0">
          <button
            className="w-full bg-primary text-on-primary py-3 rounded font-label-caps text-[12px] uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            onClick={() => onFixIssues(result.categories.flatMap(c => c.issues))}
            disabled={fixing}
          >
            {fixing ? (
              <><span className="material-symbols-outlined animate-spin text-[16px]">refresh</span> Исправляю…</>
            ) : (
              <><span className="material-symbols-outlined text-[16px]">auto_fix_high</span> Авто-исправление ({allFieldIds.length})</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
