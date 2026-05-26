'use client';

import { useEffect } from 'react';
import { AnalyzeResult, AnalyzeIssue } from '@/types/character';
import { CHARACTER_SCHEMA } from '@/lib/schema';

interface Props {
  result: AnalyzeResult;
  usage?: { promptTokens: number; completionTokens: number };
  provider?: string;
  timestamp?: string;
  fixing?: boolean;
  onClose: () => void;
  onJumpToField: (fieldId: string, sectionId: string) => void;
  onFixIssues?: (fieldIds: string[]) => void;
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
    <div className="analyze-panel">
      {/* Header */}
      <div className="analyze-panel-header">
        <div className="analyze-panel-header-top">
          <span className="analyze-panel-title">🔍 Анализ</span>
          {timestamp && <span className="analyze-panel-time">{timestamp}</span>}
          <button className="analyze-panel-close" onClick={onClose} title="Закрыть (Esc)">✕</button>
        </div>
        <div className="analyze-panel-meta">
          {result.totalIssues > 0 && (
            <span className="analyze-panel-badge">{result.totalIssues} проблем</span>
          )}
          {usage && (
            <span className="analyze-panel-tokens">
              {usage.promptTokens + usage.completionTokens} токенов · {provider || 'AI'}
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {result.summary && (
        <div className="analyze-panel-summary">{result.summary}</div>
      )}

      {/* Body */}
      <div className="analyze-panel-body">
        {result.totalIssues === 0 ? (
          <div className="analyze-panel-empty">
            <span>🎉</span>
            <p>AI не нашёл проблем в карточке. Либо персонаж отлично проработан, либо заполнено слишком мало полей.</p>
          </div>
        ) : (
          result.categories.map((cat, ci) => (
            <div key={ci} className="analyze-panel-category">
              <div className="analyze-panel-cat-header">
                <span>{cat.icon}</span>
                <span>{cat.title}</span>
                <span className="analyze-panel-cat-count">{cat.issues.length}</span>
              </div>
              {cat.issues.map((issue, ii) => (
                <div key={ii} className="analyze-panel-issue">
                  <div className="analyze-panel-issue-head">
                    <span
                      className="analyze-panel-severity"
                      style={{ background: SEVERITY_LABELS[issue.severity]?.color + '18', color: SEVERITY_LABELS[issue.severity]?.color, borderColor: SEVERITY_LABELS[issue.severity]?.color + '33' }}
                    >
                      {SEVERITY_LABELS[issue.severity]?.label || issue.severity}
                    </span>
                    <span className="analyze-panel-issue-title">{issue.title}</span>
                  </div>
                  <p className="analyze-panel-issue-desc">{issue.description}</p>
                  {issue.suggestion && (
                    <p className="analyze-panel-issue-sugg">💡 {issue.suggestion}</p>
                  )}
                  {issue.fields.length > 0 && (
                    <div className="analyze-panel-fields">
                      {issue.fields.map(fid => {
                        const sf = getSectionForField(fid);
                        const label = CHARACTER_SCHEMA.flatMap(s => s.fields).find(f => f.id === fid)?.label || fid;
                        return sf ? (
                          <button
                            key={fid}
                            className="analyze-panel-field-link"
                            onClick={() => onJumpToField(fid, sf.sectionId)}
                          >
                            {label} →
                          </button>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Fix button */}
      {allFieldIds.length > 0 && onFixIssues && (
        <div className="analyze-panel-footer">
          <button
            className="analyze-panel-fix-btn"
            onClick={() => onFixIssues(allFieldIds)}
            disabled={fixing}
          >
            {fixing ? (
              <><span className="ai-spinner" /> Исправляю…</>
            ) : (
              <>🔧 Исправить ({allFieldIds.length} полей)</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
