/**
 * AI Provider abstraction — OpenAI-compatible chat completions.
 */

import { createXai } from '@ai-sdk/xai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';
import { env } from '../env';
import { getServerSideApiKeys } from '../settingsActions';

import { AiProvider, PROVIDER_MODELS } from './models';
export type { AiProvider };

interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  /** Available models for UI selector */
  models: { id: string; label: string }[];
}

export const PROVIDER_CONFIGS: Record<AiProvider, ProviderConfig> = {
  deepseek: {
    apiKey: env.DEEPSEEK_API_KEY || '',
    baseUrl: env.DEEPSEEK_BASE_URL,
    defaultModel: 'deepseek-chat',
    models: PROVIDER_MODELS.deepseek,
  },
  xai: {
    apiKey: env.XAI_API_KEY || '',
    baseUrl: 'https://api.x.ai',
    defaultModel: 'grok-4.3',
    models: PROVIDER_MODELS.xai,
  },
  openai: {
    apiKey: env.OPENAI_API_KEY || '',
    baseUrl: 'https://api.openai.com',
    defaultModel: 'gpt-4o',
    models: PROVIDER_MODELS.openai,
  },
  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY || '',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: PROVIDER_MODELS.anthropic,
  },
  gemini: {
    apiKey: env.GEMINI_API_KEY || '',
    baseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-1.5-pro',
    models: PROVIDER_MODELS.gemini,
  },
  openrouter: {
    apiKey: env.OPENROUTER_API_KEY || '',
    baseUrl: 'https://openrouter.ai/api',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: PROVIDER_MODELS.openrouter,
  },
};

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  provider?: AiProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  /** User-supplied API key — overrides env var */
  apiKey?: string;
}

interface CompletionResult {
  content: string;
  usage?: { promptTokens: number; completionTokens: number };
}

export function getProviderConfig(provider: AiProvider): ProviderConfig {
  return PROVIDER_CONFIGS[provider];
}

export function checkProviderAvailable(provider: AiProvider): boolean {
  return !!PROVIDER_CONFIGS[provider].apiKey;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<CompletionResult> {
  const provider: AiProvider = options.provider || 'deepseek';
  const cfg = PROVIDER_CONFIGS[provider];
  const model = options.model || cfg.defaultModel;
  
  const cookieKeys = await getServerSideApiKeys();
  let apiKey = options.apiKey;
  if (!apiKey || apiKey === '********') {
    apiKey = cookieKeys[provider];
  }
  if (!apiKey) {
    apiKey = cfg.apiKey;
  }

  if (!apiKey) {
    throw new Error(`API-ключ для "${provider}" не указан. Добавьте его в настройках (⚙ → AI) или в .env как ${provider.toUpperCase()}_API_KEY`);
  }

  if (provider === 'xai' || provider === 'anthropic' || provider === 'gemini') {
    let modelInstance;
    if (provider === 'xai') {
      const xai = createXai({ apiKey });
      modelInstance = xai(model);
    } else if (provider === 'anthropic') {
      const anthropic = createAnthropic({ apiKey });
      modelInstance = anthropic(model);
    } else if (provider === 'gemini') {
      const google = createGoogleGenerativeAI({ apiKey });
      modelInstance = google(model);
    }

    const systemMsg = messages.find(m => m.role === 'system')?.content;
    const coreMessages = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    
    const { text, usage } = await generateText({
      model: modelInstance!,
      system: systemMsg,
      messages: coreMessages,
      temperature: options.temperature ?? 0.8,
      maxOutputTokens: options.maxTokens ?? 16384,
      providerOptions: provider === 'xai' ? { xai: { reasoningEffort: "low" } } : undefined,
    });

    return {
      content: text,
      usage: usage ? { promptTokens: usage.inputTokens || 0, completionTokens: usage.outputTokens || 0 } : undefined,
    };
  }

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: options.maxTokens ?? 16384,
    stream: false,
  };

  if (provider === 'deepseek' && (model.includes('pro') || model.includes('reasoner'))) {
    requestBody.thinking = { type: 'enabled' };
    requestBody.reasoning_effort = 'high';
  }

  const res = await fetch(`${cfg.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'unknown');
    throw new Error(`AI API error ${res.status}: ${errBody.slice(0, 500)}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content || '';

  return {
    content,
    usage: json.usage ? {
      promptTokens: json.usage.prompt_tokens,
      completionTokens: json.usage.completion_tokens,
    } : undefined,
  };
}

export async function chatCompletionStream(
  messages: ChatMessage[],
  options: CompletionOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  const provider: AiProvider = options.provider || 'deepseek';
  const cfg = PROVIDER_CONFIGS[provider];
  const model = options.model || cfg.defaultModel;
  
  const cookieKeys = await getServerSideApiKeys();
  let apiKey = options.apiKey;
  if (!apiKey || apiKey === '********') {
    apiKey = cookieKeys[provider];
  }
  if (!apiKey) {
    apiKey = cfg.apiKey;
  }

  if (!apiKey) {
    throw new Error(`API-ключ для "${provider}" не указан. Добавьте его в настройках (⚙ → AI)`);
  }

  if (provider === 'xai' || provider === 'anthropic' || provider === 'gemini') {
    let modelInstance;
    if (provider === 'xai') {
      const xai = createXai({ apiKey });
      modelInstance = xai(model);
    } else if (provider === 'anthropic') {
      const anthropic = createAnthropic({ apiKey });
      modelInstance = anthropic(model);
    } else if (provider === 'gemini') {
      const google = createGoogleGenerativeAI({ apiKey });
      modelInstance = google(model);
    }

    const systemMsg = messages.find(m => m.role === 'system')?.content;
    const coreMessages = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    
    const { textStream, usage } = streamText({
      model: modelInstance!,
      system: systemMsg,
      messages: coreMessages,
      temperature: options.temperature ?? 0.8,
      maxOutputTokens: options.maxTokens ?? 16384,
      providerOptions: provider === 'xai' ? { xai: { reasoningEffort: "low" } } : undefined,
    });

    const encoder = new TextEncoder();
    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            controller.enqueue(encoder.encode(JSON.stringify({ delta: chunk }) + '\n'));
          }
          const u = await usage;
          if (u) {
            controller.enqueue(encoder.encode(JSON.stringify({ 
              done: true, 
              usage: { promptTokens: u.inputTokens || 0, completionTokens: u.outputTokens || 0 } 
            }) + '\n'));
          } else {
            controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });
  }

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: options.maxTokens ?? 16384,
    stream: true,
  };

  if (provider === 'deepseek' && (model.includes('pro') || model.includes('reasoner'))) {
    requestBody.thinking = { type: 'enabled' };
    requestBody.reasoning_effort = 'high';
  }

  const res = await fetch(`${cfg.baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => 'unknown');
    throw new Error(`AI API error ${res.status}: ${errBody.slice(0, 500)}`);
  }

  if (!res.body) throw new Error('No response body from AI API');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      let buffer = '';
      let isThinking = false;
      let chunkCounter = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta;
              if (delta) {
                let outStr = '';
                
                if (delta.reasoning_content) {
                  if (!isThinking) {
                    outStr += '<think>\n';
                    isThinking = true;
                  }
                  outStr += delta.reasoning_content;
                }
                
                if (delta.content !== undefined && delta.content !== null && delta.content !== '') {
                  if (isThinking) {
                    outStr += '\n</think>\n';
                    isThinking = false;
                  }
                  outStr += delta.content;
                }
                
                if (outStr) {
                  chunkCounter++;
                  controller.enqueue(new TextEncoder().encode(JSON.stringify({ delta: outStr }) + '\n'));
                }
              }
              if (json.usage) {
                controller.enqueue(new TextEncoder().encode(JSON.stringify({
                  done: true,
                  usage: {
                    promptTokens: json.usage.prompt_tokens,
                    completionTokens: json.usage.completion_tokens,
                  },
                }) + '\n'));
              }
            } catch {
              // skip malformed
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        console.log(`[Stream] Finished yielding ${chunkCounter} chunks.`);
        controller.close();
      }
    },
  });
}

export function getDefaultProvider(): AiProvider {
  if (env.OPENAI_API_KEY) return 'openai';
  if (env.XAI_API_KEY) return 'xai';
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  if (env.GEMINI_API_KEY) return 'gemini';
  if (env.OPENROUTER_API_KEY) return 'openrouter';
  return 'deepseek';
}
