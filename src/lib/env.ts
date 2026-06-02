import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().startsWith('file:').or(z.string().url()).default('file:./dev.db'),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com'),
  OPENAI_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Ошибка валидации переменных окружения (Environment Variables):', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
