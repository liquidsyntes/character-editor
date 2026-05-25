'use client';

import { useState, useEffect, useCallback } from 'react';

export type AiProvider = 'deepseek' | 'xai' | 'openai';

export interface AiSettings {
  provider: AiProvider;
  model: string;
  temperature: number;
}

const STORAGE_KEY = 'cc_ai_settings';

const PROVIDER_MODELS: Record<AiProvider, { id: string; label: string }[]> = {
  deepseek: [
    { id: 'deepseek-chat', label: 'DeepSeek Chat' },
    { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
    { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' },
    { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  ],
  xai: [
    { id: 'grok-4.3', label: 'Grok 4.3' },
    { id: 'grok-4.20-0309-non-reasoning', label: 'Grok 4.20 (non-reasoning)' },
    { id: 'grok-4.20-0309-reasoning', label: 'Grok 4.20 (reasoning)' },
  ],
  openai: [
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  ],
};

const PROVIDER_LABELS: Record<AiProvider, string> = {
  deepseek: 'DeepSeek',
  xai: 'Grok (xAI)',
  openai: 'OpenAI',
};

const DEFAULTS: AiSettings = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  temperature: 0.85,
};

function loadSettings(): AiSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.provider && PROVIDER_LABELS[parsed.provider as AiProvider]) {
        return {
          provider: parsed.provider as AiProvider,
          model: parsed.model || PROVIDER_MODELS[parsed.provider as AiProvider]?.[0]?.id || DEFAULTS.model,
          temperature: typeof parsed.temperature === 'number' ? parsed.temperature : DEFAULTS.temperature,
        };
      }
    }
  } catch {}
  return DEFAULTS;
}

function saveSettings(settings: AiSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(DEFAULTS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const updateProvider = useCallback((provider: AiProvider) => {
    setSettings(prev => {
      const models = PROVIDER_MODELS[provider];
      const next: AiSettings = {
        ...prev,
        provider,
        model: models[0]?.id || prev.model,
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateModel = useCallback((model: string) => {
    setSettings(prev => {
      const next = { ...prev, model };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateTemperature = useCallback((temperature: number) => {
    setSettings(prev => {
      const next = { ...prev, temperature };
      saveSettings(next);
      return next;
    });
  }, []);

  return {
    settings,
    updateProvider,
    updateModel,
    updateTemperature,
    PROVIDER_MODELS,
    PROVIDER_LABELS,
  };
}
