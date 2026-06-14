'use client';

import { useState, useEffect } from 'react';
import { getAppSetting, setAppSetting } from '@/app/actions/settings';
import { 
  DEFAULT_WORLD_SYSTEM_PROMPT, 
  DEFAULT_WORLD_GENERATE_PROMPT, 
  DEFAULT_WORLD_EXPAND_PROMPT 
} from '@/lib/ai/prompt-constants';
import { HighlightedTextarea } from './HighlightedTextarea';

export function WorldPromptsPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_WORLD_SYSTEM_PROMPT);
  const [generatePrompt, setGeneratePrompt] = useState(DEFAULT_WORLD_GENERATE_PROMPT);
  const [expandPrompt, setExpandPrompt] = useState(DEFAULT_WORLD_EXPAND_PROMPT);
  
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
      const [sys, gen, exp] = await Promise.all([
        getAppSetting('WORLD_SYSTEM_PROMPT'),
        getAppSetting('WORLD_GENERATE_PROMPT'),
        getAppSetting('WORLD_EXPAND_PROMPT')
      ]);
      if (sys) setSystemPrompt(sys);
      if (gen) setGeneratePrompt(gen);
      if (exp) setExpandPrompt(exp);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await Promise.all([
      setAppSetting('WORLD_SYSTEM_PROMPT', systemPrompt),
      setAppSetting('WORLD_GENERATE_PROMPT', generatePrompt),
      setAppSetting('WORLD_EXPAND_PROMPT', expandPrompt)
    ]);
    setSaving(false);
  };

  const handleReset = async () => {
    setSystemPrompt(DEFAULT_WORLD_SYSTEM_PROMPT);
    setGeneratePrompt(DEFAULT_WORLD_GENERATE_PROMPT);
    setExpandPrompt(DEFAULT_WORLD_EXPAND_PROMPT);
    
    setSaving(true);
    await Promise.all([
      setAppSetting('WORLD_SYSTEM_PROMPT', DEFAULT_WORLD_SYSTEM_PROMPT),
      setAppSetting('WORLD_GENERATE_PROMPT', DEFAULT_WORLD_GENERATE_PROMPT),
      setAppSetting('WORLD_EXPAND_PROMPT', DEFAULT_WORLD_EXPAND_PROMPT)
    ]);
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
        className={`fixed top-0 right-0 h-full w-[600px] max-w-full bg-surface border-l border-outline-variant z-[210] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-outline-variant shrink-0">
          <h2 className="font-headline-sm text-[20px] font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">code_blocks</span> Настройки промптов
          </h2>
          <button className="text-on-surface-variant hover:text-primary transition-colors p-1 bg-surface-container rounded" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <p className="font-label-caps text-[10px] text-on-surface-variant/80 mb-6 leading-relaxed">
            Эти системные промпты определяют стиль, тон и структуру генерируемых элементов мира.
            Они сохраняются в базу данных проекта и применяются мгновенно ко всем запросам для создания лора.
          </p>

          {loading ? (
             <div className="text-on-surface-variant font-label-caps text-[10px]">Загрузка промптов...</div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* Системный промпт */}
              <div className="border border-outline-variant rounded bg-surface overflow-hidden flex flex-col h-[300px]">
                 <div className="w-full flex items-center p-3 bg-surface-container border-b border-outline-variant shrink-0">
                   <span className="font-label-caps text-[12px] uppercase">Системный промпт (Базовый)</span>
                 </div>
                 <div className="flex-1 p-3 min-h-0">
                   <HighlightedTextarea
                     className="w-full h-full min-h-[150px]"
                     value={systemPrompt}
                     onChange={(e) => setSystemPrompt(e.target.value)}
                   />
                 </div>
              </div>

              {/* Промпт генерации с нуля */}
              <div className="border border-outline-variant rounded bg-surface overflow-hidden flex flex-col h-[300px]">
                 <div className="w-full flex items-center p-3 bg-surface-container border-b border-outline-variant shrink-0">
                   <span className="font-label-caps text-[12px] uppercase">Промпт: Сгенерировать с нуля</span>
                 </div>
                 <div className="flex-1 p-3 min-h-0">
                   <HighlightedTextarea
                     className="w-full h-full min-h-[150px]"
                     value={generatePrompt}
                     onChange={(e) => setGeneratePrompt(e.target.value)}
                   />
                 </div>
              </div>

              {/* Промпт расширения */}
              <div className="border border-outline-variant rounded bg-surface overflow-hidden flex flex-col h-[300px]">
                 <div className="w-full flex items-center p-3 bg-surface-container border-b border-outline-variant shrink-0">
                   <span className="font-label-caps text-[12px] uppercase">Промпт: Расширить текст</span>
                 </div>
                 <div className="flex-1 p-3 min-h-0">
                   <HighlightedTextarea
                     className="w-full h-full min-h-[150px]"
                     value={expandPrompt}
                     onChange={(e) => setExpandPrompt(e.target.value)}
                   />
                 </div>
              </div>

            </div>
          )}
        </div>

        {/* Action buttons at the bottom */}
        {!loading && (
          <div className="p-4 border-t border-outline-variant bg-surface shrink-0 flex gap-2">
            <button
              disabled={saving}
              className="flex-1 bg-primary text-on-primary py-2 rounded font-label-caps text-[10px] hover:bg-primary/90 transition-colors"
              onClick={handleSave}
            >
              {saving ? 'Сохранение...' : 'Сохранить все'}
            </button>
            <button
              disabled={saving}
              className="px-3 border border-outline-variant text-on-surface-variant rounded font-label-caps text-[10px] hover:bg-surface-container-high transition-colors"
              onClick={handleReset}
              title="Сбросить по умолчанию"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            </button>
          </div>
        )}

      </div>
    </>
  );
}
