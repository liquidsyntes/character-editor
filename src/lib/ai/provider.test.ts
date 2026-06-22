import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveApiKey, createProviderModelInstance } from './provider';

vi.mock('../settingsActions', () => ({
  getServerSideApiKeys: vi.fn().mockResolvedValue({
    openai: 'cookie-openai-key',
    deepseek: 'cookie-deepseek-key'
  }),
}));

vi.mock('../env', () => ({
  env: {
    OPENAI_API_KEY: 'env-openai-key',
    DEEPSEEK_API_KEY: 'env-deepseek-key',
    XAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
    GEMINI_API_KEY: '',
    OPENROUTER_API_KEY: '',
  }
}));

describe('provider.ts helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveApiKey', () => {
    it('should prefer options.apiKey over cookie and env', async () => {
      const key = await resolveApiKey('openai', { apiKey: 'custom-key' });
      expect(key).toBe('custom-key');
    });

    it('should use cookie key if options.apiKey is missing', async () => {
      const key = await resolveApiKey('openai', {});
      expect(key).toBe('cookie-openai-key');
    });

    it('should use cookie key if options.apiKey is "********"', async () => {
      const key = await resolveApiKey('openai', { apiKey: '********' });
      expect(key).toBe('cookie-openai-key');
    });

    it('should fallback to env key if options and cookie are missing', async () => {
      // Mock getServerSideApiKeys to return empty for deepseek
      const { getServerSideApiKeys } = await import('../settingsActions');
      vi.mocked(getServerSideApiKeys).mockResolvedValueOnce({});
      
      const key = await resolveApiKey('deepseek', {});
      expect(key).toBe('env-deepseek-key');
    });

    it('should throw Error if no API key is found', async () => {
      const { getServerSideApiKeys } = await import('../settingsActions');
      vi.mocked(getServerSideApiKeys).mockResolvedValueOnce({});
      
      await expect(resolveApiKey('anthropic', {})).rejects.toThrow(/API-ключ для "anthropic" не указан/);
    });
  });

  describe('createProviderModelInstance', () => {
    it('should return a model instance for xai', () => {
      const instance = createProviderModelInstance('xai', 'grok-4.3', 'test-key');
      expect(instance).toBeDefined();
      expect(instance.provider).toBe('xai.chat');
    });

    it('should return a model instance for anthropic', () => {
      const instance = createProviderModelInstance('anthropic', 'claude-3-5-sonnet', 'test-key');
      expect(instance).toBeDefined();
      expect(instance.provider).toBe('anthropic.messages');
    });

    it('should return a model instance for gemini', () => {
      const instance = createProviderModelInstance('gemini', 'gemini-1.5-pro', 'test-key');
      expect(instance).toBeDefined();
      expect(instance.provider).toBe('google.generative-ai');
    });

    it('should throw Error for unsupported AI SDK providers', () => {
      expect(() => createProviderModelInstance('openai', 'gpt-4', 'test-key')).toThrow();
      expect(() => createProviderModelInstance('deepseek', 'deepseek-chat', 'test-key')).toThrow();
    });
  });
});
