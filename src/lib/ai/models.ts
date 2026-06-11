export type AiProvider = 'deepseek' | 'xai' | 'openai' | 'anthropic' | 'gemini' | 'openrouter';

export interface AiModel {
  id: string;
  label: string;
}

export const PROVIDER_MODELS: Record<AiProvider, AiModel[]> = {
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
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  ],
  gemini: [
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  ],
  openrouter: [
    { id: 'qwen/qwen3.7-max', label: 'Qwen 3.7 Max' },
    { id: 'openrouter/owl-alpha', label: 'Owl Alpha' },
    { id: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B (Free)' },
    { id: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B (Free)' },
    { id: 'qwen/qwen3.6-plus', label: 'Qwen 3.6 Plus' },
    { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (OR)' },
    { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
    { id: 'google/gemini-pro-1.5', label: 'Gemini 1.5 Pro (OR)' },
    { id: 'microsoft/wizardlm-2-8x22b', label: 'WizardLM-2 8x22B' },
  ],
};

export const PROVIDER_LABELS: Record<AiProvider, string> = {
  deepseek: 'DeepSeek',
  xai: 'Grok (xAI)',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
};
