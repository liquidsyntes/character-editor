'use client';

import { useState, useEffect } from 'react';

export default function TweaksPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [theme, setTheme] = useState('dark');
  const [density, setDensity] = useState('normal');

  useEffect(() => {
    const saved = localStorage.getItem('cc_theme');
    if (saved) { setTheme(saved); applyTheme(saved); }
    const savedDensity = localStorage.getItem('cc_density');
    if (savedDensity) { setDensity(savedDensity); applyDensity(savedDensity); }
  }, []);

  const applyTheme = (v: string) => {
    document.body.classList.toggle('light', v === 'light');
  };

  const applyDensity = (v: string) => {
    document.body.classList.toggle('compact', v === 'compact');
  };

  const handleTheme = (v: string) => {
    setTheme(v);
    localStorage.setItem('cc_theme', v);
    applyTheme(v);
  };

  const handleDensity = (v: string) => {
    setDensity(v);
    localStorage.setItem('cc_density', v);
    applyDensity(v);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '.') { e.preventDefault(); onClose(); }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <div className={`tweaks-overlay ${isOpen ? 'open' : ''}`}>
      <div className="tweaks-header">
        <div className="tweaks-title">Настройки</div>
        <button className="panel-close-btn" onClick={onClose} title="Закрыть (Esc)">✕</button>
      </div>
      <div className="tweak-group">
        <div className="tweak-label">Тема</div>
        <div className="tweak-options">
          <button className={`tweak-option ${theme === 'dark' ? 'selected' : ''}`} onClick={() => handleTheme('dark')}>Тёмная</button>
          <button className={`tweak-option ${theme === 'light' ? 'selected' : ''}`} onClick={() => handleTheme('light')}>Светлая</button>
        </div>
      </div>
      <div className="tweak-group">
        <div className="tweak-label">Плотность</div>
        <div className="tweak-options">
          <button className={`tweak-option ${density === 'normal' ? 'selected' : ''}`} onClick={() => handleDensity('normal')}>Обычная</button>
          <button className={`tweak-option ${density === 'compact' ? 'selected' : ''}`} onClick={() => handleDensity('compact')}>Компактная</button>
        </div>
      </div>
    </div>
  );
}
