'use client';

import { useEffect, useRef } from 'react';
import { AnalyzeResult, AnalyzeIssue } from '@/types/character';
import { CHARACTER_SCHEMA } from '@/lib/schema';

interface Props {
  result: AnalyzeResult;
  usage?: { promptTokens: number; completionTokens: number };
  provider?: string;
  onClose: () => void;
  onJumpToField: (fieldId: string, sectionId: string) => void;
}

const SEVERITY_LABELS: Record<AnalyzeIssue['severity'], { label: string; color: string }> = {
  contradiction: { label: 'Противоречие', color: '#ef4444' },
  gap: { label: 'Слепая зона', color: '#f59e0b' },
  cliche: { label: 'Клише', color: '#8b5cf6' },
  inconsistency: { label: 'Нестыковка', color: '#f97316' },
  opportunity: { label: 'Упущено', color: '#3b82f6' },
};

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
                          style={{ background: SEVERITY_LABELS[issue.severity]?.color + '22', color: SEVERITY_LABELS[issue.severity]?.color, borderColor: SEVERITY_LABELS[issue.severity]?.color + '44' }}
                        >
                          {SEVERITY_LABELS[issue.severity]?.label || issue.severity}
                        </span>
                        <span className="analyze-issue-title">{issue.title}</span>
                      </div>
                      <p className="analyze-issue-desc">{issue.description}</p>
                      {issue.suggestion && (
                        <p className="analyze-issue-suggestion">💡 {issue.suggestion}</p>
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
