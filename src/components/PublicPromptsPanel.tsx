'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_PUBLIC_SYSTEM_PROMPT } from '@/lib/ai/prompt-constants';

interface PublicPromptsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PublicPromptsPanel({ isOpen, onClose }: PublicPromptsPanelProps) {
  const [prompt, setPrompt] = useState(DEFAULT_PUBLIC_SYSTEM_PROMPT);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings?key=PUBLIC_PROMPT')
        .then(res => res.json())
        .then(data => {
          if (data.value) setPrompt(data.value);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setIsSuccess(false);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'PUBLIC_PROMPT', value: prompt })
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Сбросить промпт на по умолчанию? Все ваши изменения будут потеряны.')) {
      setPrompt(DEFAULT_PUBLIC_SYSTEM_PROMPT);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50" onClick={onClose} />
      )}
      <div 
        className={`fixed top-0 right-0 bottom-0 w-[600px] bg-surface-container-lowest border-l border-outline-variant z-[101] shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-outline-variant shrink-0">
          <h2 className="font-headline-sm text-headline-sm flex items-center gap-2">
            <span className="material-symbols-outlined">code_blocks</span>
            Промпт мнений о персонаже
          </h2>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Этот системный промпт используется для генерации мнений других людей о персонаже.
            В него автоматически подставляются текущие данные анкеты и художественное описание.
          </p>

          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-label-caps uppercase tracking-wider text-primary">Системный Промпт</label>
              <button onClick={handleReset} className="text-[12px] text-on-surface-variant hover:text-error transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">history</span> По умолчанию
              </button>
            </div>
            <textarea
              className="w-full flex-1 min-h-[400px] bg-surface-container-low border border-outline-variant rounded-lg p-4 font-mono-data text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary custom-scrollbar resize-none leading-relaxed"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6 border-t border-outline-variant shrink-0 flex items-center justify-end gap-4 bg-surface-container-lowest">
          {isSuccess && <span className="text-[#22c55e] text-sm flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">check_circle</span> Сохранено</span>}
          <button onClick={onClose} className="px-6 py-2 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors font-label-caps text-sm">
            Закрыть
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 transition-colors font-label-caps text-sm flex items-center gap-2"
          >
            {isSaving ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
            Сохранить
          </button>
        </div>
      </div>
    </>
  );
}
