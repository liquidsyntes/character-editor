'use client';

import { useState, useEffect } from 'react';
import { useAiSettings, AiProvider } from '@/lib/ai/useAiSettings';

export default function TweaksPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Theme & density
  const [theme, setTheme] = useState('dark');
  const [density, setDensity] = useState('normal');

  // AI settings
  const {
    settings: ai,
    updateProvider,
    updateModel,
    updateTemperature,
    PROVIDER_MODELS,
    PROVIDER_LABELS,
  } = useAiSettings();

  // Init theme/density
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
    setTheme(v); localStorage.setItem('cc_theme', v); applyTheme(v);
  };
  const handleDensity = (v: string) => {
    setDensity(v); localStorage.setItem('cc_density', v); applyDensity(v);
  };

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '.') { e.preventDefault(); onClose(); }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const providers: AiProvider[] = ['deepseek', 'xai', 'openai'];
  const models = PROVIDER_MODELS[ai.provider] || [];

  return (
    <div className={`tweaks-overlay ${isOpen ? 'open' : ''}`}>
      <div className="tweaks-header">
        <div className="tweaks-title">Настройки</div>
        <button className="panel-close-btn" onClick={onClose} title="Закрыть (Esc)">✕</button>
      </div>

      {/* ── AI Section ── */}
      <div className="tweak-group tweak-group--ai">
        <div className="tweak-section-label">🤖 Искусственный интеллект</div>

        {/* Provider */}
        <div className="tweak-label">Провайдер</div>
        <div className="tweak-options">
          {providers.map(p => (
            <button
              key={p}
              className={`tweak-option ${ai.provider === p ? 'selected' : ''}`}
              onClick={() => updateProvider(p)}
            >
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Model */}
        <div className="tweak-label" style={{ marginTop: '14px' }}>Модель</div>
        <div className="tweak-options tweak-options--models">
          {models.map(m => (
            <button
              key={m.id}
              className={`tweak-option tweak-option--wide ${ai.model === m.id ? 'selected' : ''}`}
              onClick={() => updateModel(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Temperature */}
        <div className="tweak-label" style={{ marginTop: '14px' }}>
          Температура: <span className="tweak-value">{ai.temperature.toFixed(2)}</span>
        </div>
        <div className="tweak-slider-wrap">
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={ai.temperature}
            onChange={e => updateTemperature(parseFloat(e.target.value))}
            className="tweak-slider"
          />
          <div className="tweak-slider-labels">
            <span>0 — точнее</span>
            <span>1.5 — креативнее</span>
          </div>
        </div>
      </div>

      {/* ── Separator ── */}
      <div className="tweak-separator"></div>

      {/* ── Theme ── */}
      <div className="tweak-group">
        <div className="tweak-section-label">🎨 Оформление</div>
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
