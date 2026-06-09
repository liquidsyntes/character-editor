'use client';

import { useState, useEffect } from 'react';
import { getAppSetting, setAppSetting } from '@/app/actions/settings';
import { DEFAULT_NARRATIVE_SYSTEM_PROMPT } from '@/lib/ai/prompt-constants';
import { HighlightedTextarea } from './HighlightedTextarea';

export function NarrativePromptsPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState(DEFAULT_NARRATIVE_SYSTEM_PROMPT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') { e.preventDefault(); onClose(); }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    async function load() {
      const p = await getAppSetting('NARRATIVE_PROMPT');
      if (p) setPrompt(p);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (value: string) => {
    setSaving(true);
    await setAppSetting('NARRATIVE_PROMPT', value);
    setSaving(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={onClose} 
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[500px] max-w-full bg-surface border-l border-outline-variant z-[210] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-outline-variant shrink-0">
          <h2 className="font-headline-sm text-[20px] font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">code_blocks</span> Настройки промпта
          </h2>
          <button className="text-on-surface-variant hover:text-primary transition-colors p-1 bg-surface-container rounded" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <p className="font-label-caps text-[10px] text-on-surface-variant/80 mb-6 leading-relaxed">
            Этот системный промпт определяет стиль, тон и структуру генерируемого художественного описания.
          </p>

          {loading ? (
             <div className="text-on-surface-variant font-label-caps text-[10px]">Загрузка промпта...</div>
          ) : (
            <div className="border border-outline-variant rounded bg-surface overflow-hidden flex flex-col h-[calc(100vh-200px)]">
               <div className="w-full flex items-center p-3 bg-surface-container border-b border-outline-variant shrink-0">
                 <span className="font-label-caps text-[12px] uppercase">Промпт: Нарратив</span>
               </div>
               <div className="flex-1 p-3 flex flex-col gap-3 min-h-0">
                 <HighlightedTextarea
                   className="w-full h-full min-h-[300px]"
                   value={prompt}
                   onChange={(e) => setPrompt(e.target.value)}
                 />
                 <div className="flex gap-2 shrink-0">
                   <button
                     disabled={saving}
                     className="flex-1 bg-primary text-on-primary py-2 rounded font-label-caps text-[10px] hover:bg-primary/90 transition-colors"
                     onClick={() => handleSave(prompt)}
                   >
                     {saving ? 'Сохранение...' : 'Сохранить'}
                   </button>
                   <button
                     disabled={saving}
                     className="px-3 border border-outline-variant text-on-surface-variant rounded font-label-caps text-[10px] hover:bg-surface-container-high transition-colors"
                     onClick={() => {
                       setPrompt(DEFAULT_NARRATIVE_SYSTEM_PROMPT);
                       handleSave(DEFAULT_NARRATIVE_SYSTEM_PROMPT);
                     }}
                     title="Сбросить по умолчанию"
                   >
                     <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                   </button>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
