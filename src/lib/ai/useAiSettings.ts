'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMaskedApiKeysFromCookie, saveApiKeysToCookie } from '../settingsActions';

export type AiProvider = 'deepseek' | 'xai' | 'openai';

export interface AiSettings {
  provider: AiProvider;
  model: string;
  temperature: number;
  apiKeys: Partial<Record<AiProvider, string>>;
}

const STORAGE_KEY = 'cc_ai_settings';

export const PROVIDER_MODELS: Record<AiProvider, { id: string; label: string }[]> = {
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

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  deepseek: 'DeepSeek',
  xai: 'Grok (xAI)',
  openai: 'OpenAI',
};

const DEFAULTS: AiSettings = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  temperature: 0.85,
  apiKeys: {},
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
          apiKeys: {}, // always empty from localstorage now
        };
      }
    }
  } catch {}
  return DEFAULTS;
}

function saveSettings(settings: Omit<AiSettings, 'apiKeys'>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface Return {
  /** Committed settings — what the app actually uses */
  saved: AiSettings;
  /** Staged settings — what's shown in the tweaks panel */
  staged: AiSettings;
  /** True when staged differs from saved (unsaved changes) */
  hasChanges: boolean;
  updateProvider: (provider: AiProvider) => void;
  updateModel: (model: string) => void;
  updateTemperature: (temperature: number) => void;
  updateApiKey: (provider: AiProvider, key: string) => void;
  /** Commit staged → saved + localStorage + cookies */
  apply: () => void;
  /** Reset staged to saved */
  revert: () => void;
  PROVIDER_MODELS: typeof PROVIDER_MODELS;
  PROVIDER_LABELS: typeof PROVIDER_LABELS;
}

export function useAiSettings(): Return {
  const [saved, setSaved] = useState<AiSettings>(DEFAULTS);
  const [staged, setStaged] = useState<AiSettings>(DEFAULTS);

  useEffect(() => {
    const loaded = loadSettings();
    setSaved(loaded);
    setStaged(loaded);
    
    // Asynchronously load masked API keys from HTTP-only cookies
    getMaskedApiKeysFromCookie().then(maskedKeys => {
      setSaved(prev => ({ ...prev, apiKeys: maskedKeys }));
      setStaged(prev => ({ ...prev, apiKeys: maskedKeys }));
    }).catch(err => console.error('Failed to load masked keys', err));
  }, []);

  const hasChanges = useMemo(() => {
    return (
      staged.provider !== saved.provider ||
      staged.model !== saved.model ||
      staged.temperature !== saved.temperature ||
      JSON.stringify(staged.apiKeys) !== JSON.stringify(saved.apiKeys)
    );
  }, [staged, saved]);

  const updateProvider = useCallback((provider: AiProvider) => {
    setStaged(prev => {
      const models = PROVIDER_MODELS[provider];
      return { ...prev, provider, model: models[0]?.id || prev.model };
    });
  }, []);

  const updateModel = useCallback((model: string) => {
    setStaged(prev => ({ ...prev, model }));
  }, []);

  const updateTemperature = useCallback((temperature: number) => {
    setStaged(prev => ({ ...prev, temperature }));
  }, []);

  const updateApiKey = useCallback((provider: AiProvider, key: string) => {
    setStaged(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [provider]: key.trim() || undefined },
    }));
  }, []);

  const apply = useCallback(() => {
    // Optimistic update
    setSaved(staged);
    
    const { apiKeys, ...localSettings } = staged;
    saveSettings(localSettings);
    
    // Save to HTTP-only cookies in background
    saveApiKeysToCookie(apiKeys).then(() => {
      return getMaskedApiKeysFromCookie();
    }).then(maskedKeys => {
      // Replace with masked versions so actual keys aren't hanging in memory
      setSaved(prev => ({ ...prev, apiKeys: maskedKeys }));
      setStaged(prev => ({ ...prev, apiKeys: maskedKeys }));
    }).catch(err => console.error('Failed to save API keys to cookie', err));
    
  }, [staged]);

  const revert = useCallback(() => {
    setStaged(saved);
  }, [saved]);

  return {
    saved,
    staged,
    hasChanges,
    updateProvider,
    updateModel,
    updateTemperature,
    updateApiKey,
    apply,
    revert,
    PROVIDER_MODELS,
    PROVIDER_LABELS,
  };
}
