'use client';

import { useEffect } from 'react';
import SystemPromptsEditor from './SystemPromptsEditor';

export default function PromptsPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') { e.preventDefault(); onClose(); }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

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
        className={`fixed top-0 right-0 h-full w-[450px] max-w-full bg-surface border-l border-outline-variant z-[210] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-outline-variant shrink-0">
          <h2 className="font-headline-sm text-[20px] font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">code_blocks</span> Промпты ИИ
          </h2>
          <button className="text-on-surface-variant hover:text-primary transition-colors p-1 bg-surface-container rounded" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <p className="font-label-caps text-[10px] text-on-surface-variant/80 mb-6 leading-relaxed">
            Системные промпты используются для точной настройки поведения генеративной модели. 
            Они сохраняются в базу данных проекта и применяются мгновенно ко всем будущим запросам.
          </p>
          <SystemPromptsEditor />
        </div>
      </div>
    </>
  );
}
