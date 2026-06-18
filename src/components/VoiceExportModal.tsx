'use client';

import React from 'react';

export function VoiceExportModal({ voice, name, onClose }: { voice: string, name: string, onClose: () => void }) {
  const download = (content: string, ext: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/\s+/g, '_')}_Voice.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
          <h3 className="font-headline-sm font-bold">Экспорт диалогов</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <button 
            onClick={() => download(voice, 'md')}
            className="w-full px-4 py-3 bg-surface-container hover:bg-surface-container-highest rounded-lg flex items-center gap-3 transition-colors text-left"
          >
            <span className="material-symbols-outlined text-primary">description</span>
            <div>
              <div className="font-bold text-sm">Markdown (.md)</div>
              <div className="text-xs text-on-surface-variant">С сохранением форматирования (жирный шрифт, заголовки)</div>
            </div>
          </button>
          <button 
            onClick={() => download(voice.replace(/[#*]/g, ''), 'txt')}
            className="w-full px-4 py-3 bg-surface-container hover:bg-surface-container-highest rounded-lg flex items-center gap-3 transition-colors text-left"
          >
            <span className="material-symbols-outlined text-on-surface-variant">article</span>
            <div>
              <div className="font-bold text-sm">Обычный текст (.txt)</div>
              <div className="text-xs text-on-surface-variant">Простой текст без форматирования</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
