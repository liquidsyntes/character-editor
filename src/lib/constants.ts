import { AnalyzeIssue } from '@/types/character';

export const SEVERITY_LABELS: Record<AnalyzeIssue['severity'], { label: string; twColor: string; bg: string; border: string; hexColor: string }> = {
  contradiction: { label: 'Противоречие', twColor: 'text-error', bg: 'bg-error/10', border: 'border-error/20', hexColor: '#ef4444' },
  gap: { label: 'Слепая зона', twColor: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hexColor: '#f59e0b' },
  cliche: { label: 'Клише', twColor: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', hexColor: '#8b5cf6' },
  inconsistency: { label: 'Нестыковка', twColor: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hexColor: '#f97316' },
  opportunity: { label: 'Упущено', twColor: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hexColor: '#3b82f6' },
};
