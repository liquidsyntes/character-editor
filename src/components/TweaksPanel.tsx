'use client';

import { useState, useEffect } from 'react';
import { AiProvider } from '@/lib/ai/useAiSettings';

export default function TweaksPanel({
  isOpen,
  onClose,
  aiState,
}: {
  isOpen: boolean;
  onClose: () => void;
  aiState: ReturnType<typeof import('@/lib/ai/useAiSettings').useAiSettings>;
}) {
  const [theme, setTheme] = useState('dark');
  const [density, setDensity] = useState('normal');

  const {
    staged: ai,
    hasChanges: aiHasChanges,
    apply: applyAi,
    revert: revertAi,
    updateProvider,
    updateModel,
    updateTemperature,
    updateApiKey,
    PROVIDER_MODELS,
    PROVIDER_LABELS,
    dynamicModels,
  } = aiState;

  const [visibleKeys, setVisibleKeys] = useState<Partial<Record<AiProvider, boolean>>>({});

  const applyTheme = (v: string) => {
    document.body.classList.toggle('light', v === 'light');
  };
  const applyDensity = (v: string) => {
    document.body.classList.toggle('compact', v === 'compact');
  };

  useEffect(() => {
    const saved = localStorage.getItem('cc_theme');
    const savedDensity = localStorage.getItem('cc_density');
    if (saved || savedDensity) {
      setTimeout(() => {
        if (saved) { setTheme(saved); applyTheme(saved); }
        if (savedDensity) { setDensity(savedDensity); applyDensity(savedDensity); }
      }, 0);
    }
  }, []);
  const handleTheme = (v: string) => {
    setTheme(v); localStorage.setItem('cc_theme', v); applyTheme(v);
  };
  const handleDensity = (v: string) => {
    setDensity(v); localStorage.setItem('cc_density', v); applyDensity(v);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '.') { e.preventDefault(); onClose(); }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const providers = Object.keys(PROVIDER_LABELS) as AiProvider[];
  
  // Объединяем статические модели и динамические с сервера
  const staticModels = PROVIDER_MODELS[ai.provider] || [];
  const fetchedModels = dynamicModels[ai.provider] || [];
  
  // Убираем дубликаты
  const modelsMap = new Map<string, {id: string, label: string}>();
  staticModels.forEach(m => modelsMap.set(m.id, m));
  fetchedModels.forEach(m => modelsMap.set(m.id, m));
  const models = Array.from(modelsMap.values());

  const toggleKeyVisibility = (p: AiProvider) => {
    setVisibleKeys(prev => ({ ...prev, [p]: !prev[p] }));
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
        className={`fixed top-0 right-0 h-full w-[400px] max-w-full bg-surface border-l border-outline-variant z-[210] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-outline-variant shrink-0">
          <h2 className="font-headline-sm text-[20px] font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">tune</span> Настройки
          </h2>
          <button className="text-on-surface-variant hover:text-primary transition-colors p-1 bg-surface-container rounded" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
          
          {/* AI Settings Section */}
          <section className="space-y-6">
            <h3 className="font-label-caps text-label-caps text-primary tracking-widest uppercase flex items-center gap-2 border-b border-primary/20 pb-2">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              Искусственный интеллект
            </h3>

            <div>
              <label htmlFor="ai-provider" className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Провайдер</label>
              <div className="relative">
                <select
                  id="ai-provider"
                  className="w-full bg-surface border border-outline-variant text-on-surface rounded px-4 py-2 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md transition-colors cursor-pointer"
                  value={ai.provider}
                  onChange={(e) => updateProvider(e.target.value as AiProvider)}
                >
                  {providers.map(p => (
                    <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="ai-model" className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-2 flex justify-between">
                <span>Модель</span>
                {fetchedModels.length > 0 && <span className="text-primary text-[9px]">(Загружено с сервера)</span>}
              </label>
              <div className="relative">
                <input
                  id="ai-model"
                  list="ai-model-list"
                  className="w-full bg-surface border border-outline-variant text-on-surface rounded px-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md transition-colors"
                  value={ai.model}
                  onChange={(e) => updateModel(e.target.value)}
                  placeholder="Выберите или введите модель..."
                  autoComplete="off"
                />
                <datalist id="ai-model-list">
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider">Температура</span>
                <span className="font-mono-data text-[12px] text-primary">{ai.temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={ai.temperature}
                onChange={e => updateTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary h-1 bg-surface-container rounded-lg appearance-none cursor-pointer outline-none"
              />
              <div className="flex justify-between mt-2 font-label-caps text-[10px] text-on-surface-variant/70">
                <span>0 — Точнее</span>
                <span>1.5 — Креативнее</span>
              </div>
            </div>

            <div>
              <div className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">key</span> API-ключи
              </div>
              <div className="space-y-3">
                {providers.map(p => {
                  const key = ai.apiKeys[p] || '';
                  const hasKey = key.length > 0;
                  const isVisible = visibleKeys[p];
                  return (
                    <div key={p} className="bg-surface border border-outline-variant rounded overflow-hidden flex flex-col">
                      <div className="bg-surface-container px-3 py-1.5 font-label-caps text-[10px] uppercase text-on-surface-variant border-b border-outline-variant">
                        {PROVIDER_LABELS[p]}
                      </div>
                      <div className="flex items-center">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          className="flex-1 bg-transparent border-none px-3 py-2 font-mono-data text-[12px] focus:ring-0 outline-none placeholder:text-on-surface-variant/30"
                          placeholder={hasKey ? '••••••••••••••••' : 'Вставьте API ключ...'}
                          value={key}
                          onChange={e => updateApiKey(p, e.target.value)}
                          spellCheck={false}
                          autoComplete="off"
                        />
                        <button
                          className="px-3 text-on-surface-variant hover:text-primary transition-colors"
                          onClick={() => toggleKeyVisibility(p)}
                          title={isVisible ? 'Скрыть ключ' : 'Показать ключ'}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isVisible ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="font-label-caps text-[10px] text-on-surface-variant/70 mt-3 leading-relaxed">
                Ключи безопасно хранятся в зашифрованных HttpOnly куках вашего браузера (защита от XSS) и не сохраняются в базе данных.
              </p>
            </div>

            {aiHasChanges && (
              <div className="flex gap-2 pt-4 border-t border-outline-variant/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <button className="flex-1 bg-primary text-on-primary py-2 rounded font-label-caps text-label-caps hover:bg-primary/90 transition-colors flex items-center justify-center gap-2" onClick={applyAi}>
                  <span className="material-symbols-outlined text-[16px]">check</span> Применить
                </button>
                <button className="flex-1 border border-outline-variant text-on-surface-variant py-2 rounded font-label-caps text-label-caps hover:border-outline hover:text-on-surface transition-colors flex items-center justify-center gap-2" onClick={revertAi}>
                  <span className="material-symbols-outlined text-[16px]">undo</span> Отменить
                </button>
              </div>
            )}
          </section>

          {/* Theme & Display Section */}
          <section className="space-y-6">
            <h3 className="font-label-caps text-label-caps text-primary tracking-widest uppercase flex items-center gap-2 border-b border-primary/20 pb-2">
              <span className="material-symbols-outlined text-[16px]">palette</span>
              Оформление
            </h3>

            <div>
              <div className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Тема</div>
              <div className="flex gap-2">
                <button 
                  className={`flex-1 font-label-caps text-label-caps py-2 border rounded transition-colors ${theme === 'dark' ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline'}`} 
                  onClick={() => handleTheme('dark')}
                >
                  Тёмная
                </button>
                <button 
                  className={`flex-1 font-label-caps text-label-caps py-2 border rounded transition-colors ${theme === 'light' ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline'}`} 
                  onClick={() => handleTheme('light')}
                >
                  Светлая
                </button>
              </div>
            </div>

            <div>
              <div className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider mb-2">Плотность интерфейса</div>
              <div className="flex gap-2">
                <button 
                  className={`flex-1 font-label-caps text-label-caps py-2 border rounded transition-colors ${density === 'normal' ? 'bg-surface-container-highest border-outline text-on-surface' : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline'}`} 
                  onClick={() => handleDensity('normal')}
                >
                  Обычная
                </button>
                <button 
                  className={`flex-1 font-label-caps text-label-caps py-2 border rounded transition-colors ${density === 'compact' ? 'bg-surface-container-highest border-outline text-on-surface' : 'bg-surface border-outline-variant text-on-surface-variant hover:border-outline'}`} 
                  onClick={() => handleDensity('compact')}
                >
                  Компактная
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
