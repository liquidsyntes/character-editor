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
}

export default function AnalyzeHistorySidebar({
  records,
  activeId,
  onSelect,
  onDelete,
  onNewAnalysis,
  loading,
}: Props) {
  const totalIssues = records.reduce((sum, r) => sum + r.result.totalIssues, 0);

  return (
    <div className="analyze-sidebar">
      <div className="analyze-sidebar-header">
        <span className="analyze-sidebar-title">Отчёты</span>
        {records.length > 0 && (
          <span className="analyze-sidebar-count">{records.length}</span>
        )}
      </div>

      <button
        className="analyze-sidebar-new-btn"
        onClick={onNewAnalysis}
        disabled={loading}
      >
        {loading ? '⏳ Анализ...' : '🔍 Новый анализ'}
      </button>

      {records.length === 0 ? (
        <div className="analyze-sidebar-empty">
          Нет отчётов. Нажми «Новый анализ», чтобы создать первый.
        </div>
      ) : (
        <div className="analyze-sidebar-list">
          {records.map(rec => (
            <div
              key={rec.id}
              className={`analyze-sidebar-item ${activeId === rec.id ? 'active' : ''}`}
            >
              <button
                className="analyze-sidebar-item-btn"
                onClick={() => onSelect(rec.id)}
              >
                <span className="analyze-sidebar-item-time">{rec.timestamp}</span>
                <span className="analyze-sidebar-item-summary">
                  {rec.result.summary?.slice(0, 60) || 'Без сводки'}
                  {rec.result.summary && rec.result.summary.length > 60 ? '…' : ''}
                </span>
                <span className="analyze-sidebar-item-badge">
                  {rec.result.totalIssues}
                </span>
              </button>
              <button
                className="analyze-sidebar-item-del"
                onClick={(e) => { e.stopPropagation(); onDelete(rec.id); }}
                title="Удалить отчёт"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
