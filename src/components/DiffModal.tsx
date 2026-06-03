import { useState } from 'react';
import { diffWords } from 'diff';
import { CHARACTER_SCHEMA } from '@/lib/schema';

interface DiffModalProps {
  originalData: Record<string, string>;
  proposedData: Record<string, string>;
  onAccept: (acceptedData: Record<string, string>) => void;
  onReject: () => void;
}

export function DiffModal({ originalData, proposedData, onAccept, onReject }: DiffModalProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(Object.keys(proposedData))
  );

  const toggleField = (key: string) => {
    const next = new Set(selectedFields);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedFields(next);
  };

  const handleAcceptSelected = () => {
    const finalData: Record<string, string> = {};
    for (const key of selectedFields) {
      finalData[key] = proposedData[key];
    }
    onAccept(finalData);
  };

  const renderDiffText = (oldStr: string = '', newStr: string = '') => {
    const diffs = diffWords(oldStr, newStr);
    return (
      <div className="font-body-md whitespace-pre-wrap leading-relaxed">
        {diffs.map((part, index) => {
          if (part.added) {
            return <span key={index} className="bg-[#22c55e]/20 text-[#22c55e] px-0.5 rounded">{part.value}</span>;
          }
          if (part.removed) {
            return <span key={index} className="bg-[#ef4444]/20 text-[#ef4444] line-through px-0.5 rounded opacity-60">{part.value}</span>;
          }
          return <span key={index}>{part.value}</span>;
        })}
      </div>
    );
  };

  // Map keys to readable labels
  const labelMap = new Map<string, string>();
  for (const section of CHARACTER_SCHEMA) {
    for (const field of section.fields) {
      labelMap.set(field.id, field.label);
    }
  }

  const entries = Object.entries(proposedData).filter(([key, newVal]) => originalData[key] !== newVal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-in fade-in duration-200">
      <div className="bg-surface border border-outline-variant rounded-xl shadow-lg w-[800px] max-w-[90vw] max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-display-sm text-on-surface">Предложенные исправления</h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Нейросеть проанализировала вашу карточку и предложила правки. Выберите, что оставить.
            </p>
          </div>
          <button onClick={onReject} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {entries.length === 0 ? (
            <div className="text-center text-on-surface-variant py-8">
              Нет изменений для отображения.
            </div>
          ) : (
            entries.map(([key, newVal]) => {
              const oldVal = originalData[key] || '';
              const isSelected = selectedFields.has(key);
              
              return (
                <div 
                  key={key} 
                  className={`border rounded-lg p-4 transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant bg-surface-container'}`}
                  onClick={() => toggleField(key)}
                >
                  <div className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant'}`}>
                      {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                    </div>
                    <div className="font-label-caps text-label-caps uppercase tracking-widest text-primary">
                      {labelMap.get(key) || key}
                    </div>
                  </div>
                  
                  <div className="mt-3 pl-8">
                    {renderDiffText(oldVal, newVal)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-outline-variant flex justify-between items-center shrink-0 bg-surface-container">
          <div className="text-sm text-on-surface-variant">
            Выбрано правок: <span className="text-on-surface font-medium">{selectedFields.size}</span> из {entries.length}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onReject}
              className="px-4 py-2 rounded text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              Отклонить все
            </button>
            <button 
              onClick={handleAcceptSelected}
              disabled={selectedFields.size === 0}
              className="px-4 py-2 rounded bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Принять выбранные
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
