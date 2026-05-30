'use client';

import { useState, useEffect } from 'react';
import { getAppSetting, setAppSetting } from '@/app/actions/settings';
import { DEFAULT_FILL_SYSTEM_PROMPT, DEFAULT_ANALYZE_SYSTEM_PROMPT, DEFAULT_FIX_SYSTEM_PROMPT } from '@/lib/ai/prompt-constants';

export default function SystemPromptsEditor() {
  const [fillPrompt, setFillPrompt] = useState(DEFAULT_FILL_SYSTEM_PROMPT);
  const [analyzePrompt, setAnalyzePrompt] = useState(DEFAULT_ANALYZE_SYSTEM_PROMPT);
  const [fixPrompt, setFixPrompt] = useState(DEFAULT_FIX_SYSTEM_PROMPT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const pFill = await getAppSetting('FILL_PROMPT');
      if (pFill) setFillPrompt(pFill);
      
      const pAnalyze = await getAppSetting('ANALYZE_PROMPT');
      if (pAnalyze) setAnalyzePrompt(pAnalyze);
      
      const pFix = await getAppSetting('FIX_PROMPT');
      if (pFix) setFixPrompt(pFix);
      
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (key: string, value: string) => {
    setSaving(true);
    await setAppSetting(key, value);
    setSaving(false);
  };

  const renderPromptEditor = (
    id: string, 
    title: string, 
    value: string, 
    setValue: (val: string) => void,
    defaultValue: string
  ) => {
    const isExpanded = expanded === id;
    
    return (
      <div className="border border-outline-variant rounded bg-surface overflow-hidden">
        <button 
          className="w-full flex items-center justify-between p-3 bg-surface-container hover:bg-surface-container-high transition-colors"
          onClick={() => setExpanded(isExpanded ? null : id)}
        >
          <span className="font-label-caps text-[12px] uppercase">{title}</span>
          <span className="material-symbols-outlined text-[18px]">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        
        {isExpanded && (
          <div className="p-3 border-t border-outline-variant space-y-3">
            <textarea
              className="w-full h-64 bg-surface border border-outline-variant rounded p-3 font-mono-data text-[12px] focus:outline-none focus:border-primary resize-y"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                disabled={saving}
                className="flex-1 bg-primary text-on-primary py-2 rounded font-label-caps text-[10px] hover:bg-primary/90 transition-colors"
                onClick={() => handleSave(id, value)}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                disabled={saving}
                className="px-3 border border-outline-variant text-on-surface-variant rounded font-label-caps text-[10px] hover:bg-surface-container-high transition-colors"
                onClick={() => {
                  setValue(defaultValue);
                  handleSave(id, defaultValue);
                }}
                title="Сбросить по умолчанию"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-on-surface-variant font-label-caps text-[10px]">Загрузка промптов...</div>;
  }

  return (
    <div className="space-y-3">
      {renderPromptEditor('FILL_PROMPT', 'Промпт Заполнения', fillPrompt, setFillPrompt, DEFAULT_FILL_SYSTEM_PROMPT)}
      {renderPromptEditor('ANALYZE_PROMPT', 'Промпт Анализа', analyzePrompt, setAnalyzePrompt, DEFAULT_ANALYZE_SYSTEM_PROMPT)}
      {renderPromptEditor('FIX_PROMPT', 'Промпт Исправления', fixPrompt, setFixPrompt, DEFAULT_FIX_SYSTEM_PROMPT)}
    </div>
  );
}
