'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getMaskedApiKeysFromCookie, saveApiKeysToCookie } from '../settingsActions';

import { AiProvider, PROVIDER_MODELS, PROVIDER_LABELS } from './models';
export type { AiProvider };
export { PROVIDER_MODELS, PROVIDER_LABELS };

export interface AiSettings {
  provider: AiProvider;
  model: string;
  temperature: number;
  apiKeys: Partial<Record<AiProvider, string>>;
}

const STORAGE_KEY = 'cc_ai_settings';

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
  dynamicModels: Record<string, { id: string; label: string }[]>;
}

export function useAiSettings(): Return {
  const [saved, setSaved] = useState<AiSettings>(DEFAULTS);
  const [staged, setStaged] = useState<AiSettings>(DEFAULTS);
  const [dynamicModels, setDynamicModels] = useState<Record<string, { id: string; label: string }[]>>({});

  const fetchModels = useCallback(async (provider: AiProvider) => {
    if (dynamicModels[provider]) return;
    try {
      const res = await fetch(`/api/ai/models?provider=${provider}`);
      if (res.ok) {
        const data = await res.json();
        if (data.models && data.models.length > 0) {
          setDynamicModels(prev => ({ ...prev, [provider]: data.models }));
        }
      }
    } catch {}
  }, [dynamicModels]);

  useEffect(() => {
    const loaded = loadSettings();
    setTimeout(() => {
      setSaved(loaded);
      setStaged(loaded);
      if (loaded.provider) {
        fetchModels(loaded.provider);
      }
    }, 0);
    
    // Asynchronously load masked API keys from HTTP-only cookies
    getMaskedApiKeysFromCookie().then(maskedKeys => {
      setSaved(prev => ({ ...prev, apiKeys: maskedKeys }));
      setStaged(prev => ({ ...prev, apiKeys: maskedKeys }));
    }).catch(err => console.error('Failed to load masked keys', err));
  }, [fetchModels]);

  const hasChanges = useMemo(() => {
    return (
      staged.provider !== saved.provider ||
      staged.model !== saved.model ||
      staged.temperature !== saved.temperature ||
      JSON.stringify(staged.apiKeys) !== JSON.stringify(saved.apiKeys)
    );
  }, [staged, saved]);

  const updateProvider = useCallback((provider: AiProvider) => {
    fetchModels(provider);
    setStaged(prev => {
      const availableModels = dynamicModels[provider] || PROVIDER_MODELS[provider];
      return { ...prev, provider, model: availableModels[0]?.id || prev.model };
    });
  }, [fetchModels, dynamicModels]);

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
    dynamicModels,
  };
}
