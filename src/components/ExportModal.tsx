'use client';

import { useState } from 'react';
import { exportToMarkdown, exportToJSON, exportToPlainText } from '@/lib/export';
import { CharacterData } from '@/types/character';

type ExportFormat = 'markdown' | 'json' | 'text';

export default function ExportModal({
  data,
  name,
  onClose,
}: {
  data: CharacterData;
  name?: string;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);

  const getContent = () => {
    switch (format) {
      case 'markdown': return exportToMarkdown(data, name);
      case 'json': return exportToJSON(data, name);
      case 'text': return exportToPlainText(data, name);
    }
  };

  const content = getContent();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt';
    const fileName = `${name || 'character'}.${ext}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] backdrop-blur-sm animate-in fade-in duration-150" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-8 w-[90%] max-w-[560px] max-h-[80vh] flex flex-col shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline-sm text-headline-sm font-bold flex items-center gap-2">
             <span className="material-symbols-outlined">download</span> Экспорт персонажа
          </h2>
          <button className="text-on-surface-variant hover:text-primary transition-colors p-1" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex gap-2 mb-4">
            {([
              ['markdown', 'Markdown'],
              ['json', 'JSON'],
              ['text', 'Текст'],
            ] as [ExportFormat, string][]).map(([key, label]) => (
              <button
                key={key}
                className={`font-label-caps text-label-caps px-4 py-2 border rounded transition-colors ${
                  format === key 
                    ? 'bg-primary text-on-primary border-primary' 
                    : 'border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary'
                }`}
                onClick={() => setFormat(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="bg-surface border border-outline-variant rounded p-4 font-mono-data text-[12px] leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap break-words text-on-surface-variant custom-scrollbar">
            {content || 'Нет заполненных полей для экспорта'}
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button className="px-4 py-2 rounded font-label-caps text-label-caps border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors" onClick={onClose}>
            Закрыть
          </button>
          <button className="px-4 py-2 rounded font-label-caps text-label-caps bg-surface-container-high text-primary hover:bg-surface-container-highest transition-colors flex items-center gap-2" onClick={handleCopy}>
            <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Скопировано' : 'Копировать'}
          </button>
          <button className="px-4 py-2 rounded font-label-caps text-label-caps bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-2" onClick={handleDownload}>
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            Скачать .{format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt'}
          </button>
        </div>
      </div>
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-6 py-2 rounded font-label-caps text-label-caps shadow-lg animate-in slide-in-from-bottom-4 duration-300 z-[300]">
          Скопировано в буфер!
        </div>
      )}
    </div>
  );
}
