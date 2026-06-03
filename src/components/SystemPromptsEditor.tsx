'use client';

import { useState, useEffect } from 'react';
import { getAppSetting, setAppSetting } from '@/app/actions/settings';
import { 
  DEFAULT_FILL_SYSTEM_PROMPT, 
  DEFAULT_ANALYZE_SYSTEM_PROMPT, 
  DEFAULT_FIX_SYSTEM_PROMPT,
  DEFAULT_USER_FILL_PROMPT,
  DEFAULT_USER_REGENERATE_PROMPT,
  DEFAULT_USER_ANALYZE_PROMPT,
  DEFAULT_USER_FIX_PROMPT
} from '@/lib/ai/prompt-constants';
import { HighlightedTextarea } from './HighlightedTextarea';

export default function SystemPromptsEditor() {
  const [fillPrompt, setFillPrompt] = useState(DEFAULT_FILL_SYSTEM_PROMPT);
  const [analyzePrompt, setAnalyzePrompt] = useState(DEFAULT_ANALYZE_SYSTEM_PROMPT);
  const [fixPrompt, setFixPrompt] = useState(DEFAULT_FIX_SYSTEM_PROMPT);

  const [userFillPrompt, setUserFillPrompt] = useState(DEFAULT_USER_FILL_PROMPT);
  const [userRegenPrompt, setUserRegenPrompt] = useState(DEFAULT_USER_REGENERATE_PROMPT);
  const [userAnalyzePrompt, setUserAnalyzePrompt] = useState(DEFAULT_USER_ANALYZE_PROMPT);
  const [userFixPrompt, setUserFixPrompt] = useState(DEFAULT_USER_FIX_PROMPT);

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

      const pUserFill = await getAppSetting('USER_FILL_PROMPT');
      if (pUserFill) setUserFillPrompt(pUserFill);

      const pUserRegen = await getAppSetting('USER_REGENERATE_PROMPT');
      if (pUserRegen) setUserRegenPrompt(pUserRegen);

      const pUserAnalyze = await getAppSetting('USER_ANALYZE_PROMPT');
      if (pUserAnalyze) setUserAnalyzePrompt(pUserAnalyze);

      const pUserFix = await getAppSetting('USER_FIX_PROMPT');
      if (pUserFix) setUserFixPrompt(pUserFix);
      
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
            <HighlightedTextarea
              className="w-full h-80"
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
    <div className="space-y-6">
      <section>
        <h3 className="font-label-caps text-[14px] text-primary mb-3">1. Системные правила (System Prompts)</h3>
        <p className="font-label-caps text-[10px] text-on-surface-variant/80 mb-3 leading-relaxed">
          Это глобальные инструкции, которые задают поведение нейросети (её роль, формат возвращаемых данных, запреты).
        </p>
        <div className="space-y-3">
          {renderPromptEditor('FILL_PROMPT', 'Системный Промпт: Заполнение', fillPrompt, setFillPrompt, DEFAULT_FILL_SYSTEM_PROMPT)}
          {renderPromptEditor('ANALYZE_PROMPT', 'Системный Промпт: Анализ', analyzePrompt, setAnalyzePrompt, DEFAULT_ANALYZE_SYSTEM_PROMPT)}
          {renderPromptEditor('FIX_PROMPT', 'Системный Промпт: Исправление', fixPrompt, setFixPrompt, DEFAULT_FIX_SYSTEM_PROMPT)}
        </div>
      </section>

      <section>
        <h3 className="font-label-caps text-[14px] text-primary mb-3 mt-8">2. Шаблоны запросов (User Prompts)</h3>
        <p className="font-label-caps text-[10px] text-on-surface-variant/80 mb-3 leading-relaxed">
          Эти шаблоны оборачивают ваши данные перед отправкой. Вы можете редактировать текст вокруг тегов. 
          <br/><br/>
          <strong className="text-error">Важно:</strong> Не удаляйте теги в фигурных скобках <span className="text-error font-bold bg-error/10 px-1 rounded">{"{{ ТЕГ }}"}</span>, иначе нейросеть не получит нужные данные.
        </p>
        <div className="space-y-3">
          {renderPromptEditor('USER_FILL_PROMPT', 'Шаблон: Генерация полей', userFillPrompt, setUserFillPrompt, DEFAULT_USER_FILL_PROMPT)}
          {renderPromptEditor('USER_REGENERATE_PROMPT', 'Шаблон: Пересоздание персонажа', userRegenPrompt, setUserRegenPrompt, DEFAULT_USER_REGENERATE_PROMPT)}
          {renderPromptEditor('USER_ANALYZE_PROMPT', 'Шаблон: Поиск противоречий', userAnalyzePrompt, setUserAnalyzePrompt, DEFAULT_USER_ANALYZE_PROMPT)}
          {renderPromptEditor('USER_FIX_PROMPT', 'Шаблон: Исправление проблем', userFixPrompt, setUserFixPrompt, DEFAULT_USER_FIX_PROMPT)}
        </div>
      </section>
    </div>
  );
}
