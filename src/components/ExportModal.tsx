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
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">📤 Экспорт персонажа</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-tabs">
            {([
              ['markdown', 'Markdown'],
              ['json', 'JSON'],
              ['text', 'Текст'],
            ] as [ExportFormat, string][]).map(([key, label]) => (
              <button
                key={key}
                className={`modal-tab ${format === key ? 'active' : ''}`}
                onClick={() => setFormat(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="modal-preview">{content || 'Нет заполненных полей для экспорта'}</div>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Закрыть</button>
          <button className="btn btn-primary" onClick={handleCopy}>
            {copied ? '✓ Скопировано' : '📋 Копировать'}
          </button>
          <button className="btn btn-accent" onClick={handleDownload}>
            ⬇ Скачать .{format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt'}
          </button>
        </div>
      </div>
      {copied && <div className="copied-toast">Скопировано в буфер!</div>}
    </div>
  );
}
