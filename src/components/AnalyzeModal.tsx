'use client';

import { useEffect, useRef } from 'react';
import { AnalyzeResult } from '@/types/character';
import { CHARACTER_SCHEMA } from '@/lib/schema';
import { SEVERITY_LABELS } from '@/lib/constants';

const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</strong>;
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
  onClose: () => void;
  onJumpToField: (fieldId: string, sectionId: string) => void;
}


function getSectionForField(fieldId: string): { sectionId: string; label: string } | null {
  for (const section of CHARACTER_SCHEMA) {
    if (section.fields.some(f => f.id === fieldId)) {
      return { sectionId: section.id, label: section.label };
    }
  }
  return null;
}

export default function AnalyzeModal({ result, usage, provider, onClose, onJumpToField }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="analyze-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="analyze-modal">
        {/* Header */}
        <div className="analyze-header">
          <div className="analyze-header-left">
            <span className="analyze-title">🔍 Анализ персонажа</span>
            {result.totalIssues > 0 && (
              <span className="analyze-badge">{result.totalIssues}</span>
            )}
          </div>
          <div className="analyze-header-right">
            {usage && (
              <span className="analyze-tokens">
                {usage.promptTokens + usage.completionTokens} токенов · {provider || 'AI'}
              </span>
            )}
            <button className="analyze-close-btn" onClick={onClose} title="Закрыть (Esc)">✕</button>
          </div>
        </div>

        {/* Summary */}
        {result.summary && (
          <div className="analyze-summary">{result.summary}</div>
        )}

        {/* Categories */}
        <div className="analyze-body">
          {result.totalIssues === 0 ? (
            <div className="analyze-empty">
              <span className="analyze-empty-icon">🎉</span>
              <p>AI не нашёл проблем в карточке. Либо персонаж отлично проработан, либо заполнено слишком мало полей для анализа.</p>
            </div>
          ) : (
            result.categories.map((cat, ci) => (
              <div key={ci} className="analyze-category">
                <div className="analyze-category-header">
                  <span className="analyze-category-icon">{cat.icon}</span>
                  <span className="analyze-category-title">{cat.title}</span>
                  <span className="analyze-category-count">{cat.issues.length}</span>
                </div>
                <div className="analyze-issues">
                  {cat.issues.map((issue, ii) => (
                    <div key={ii} className="analyze-issue">
                      <div className="analyze-issue-header">
                        <span
                          className="analyze-severity-badge"
                          style={{ background: SEVERITY_LABELS[issue.severity]?.hexColor + '22', color: SEVERITY_LABELS[issue.severity]?.hexColor, borderColor: SEVERITY_LABELS[issue.severity]?.hexColor + '44' }}
                        >
                          {SEVERITY_LABELS[issue.severity]?.label || issue.severity}
                        </span>
                        <span className="analyze-issue-title">{issue.title}</span>
                      </div>
                      <p className="analyze-issue-desc"><FormattedText text={issue.description} /></p>
                      {issue.suggestion && (
                        <p className="analyze-issue-suggestion">💡 <FormattedText text={issue.suggestion} /></p>
                      )}
                      {issue.fields.length > 0 && (
                        <div className="analyze-issue-fields">
                          {issue.fields.map(fid => {
                            const sf = getSectionForField(fid);
                            const fieldLabel = CHARACTER_SCHEMA
                              .flatMap(s => s.fields)
                              .find(f => f.id === fid)?.label || fid;
                            return sf ? (
                              <button
                                key={fid}
                                className="analyze-field-link"
                                onClick={() => onJumpToField(fid, sf.sectionId)}
                                title={`Перейти к полю «${fieldLabel}» в секции «${sf.label}»`}
                              >
                                {fieldLabel} <span className="analyze-field-arrow">→</span>
                              </button>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
