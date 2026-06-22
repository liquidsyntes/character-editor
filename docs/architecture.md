# Architecture

## Общая схема

```
Browser (React SPA)
  ├── Server Actions (CRUD) ──→ Prisma ──→ SQLite (dev.db)
  └── fetch /api/ai/* ──→ AI Provider Layer ──→ LLM APIs
```

## Модули и их связи

```
src/
├── app/
│   ├── layout.tsx                # Root layout, шрифты (Source Sans/Serif, JetBrains Mono)
│   ├── page.tsx                  # Дашборд проектов (SSR)
│   ├── globals.css               # Tailwind + Material Symbols + кастомные утилиты
│   ├── actions/                  # (пусто — Server Actions в lib/)
│   ├── api/ai/
│   │   ├── fill/route.ts         # POST — AI-заполнение (stream + non-stream)
│   │   ├── analyze/route.ts      # POST — AI-анализ (SSE stream)
│   │   ├── analyze/fix/route.ts  # POST — AI-исправление проблем
│   │   ├── condense/route.ts     # POST — AI-ужатие текста (stream)
│   │   ├── models/route.ts       # GET  — Получение списка доступных моделей
│   │   └── voice/..., narrative/..., public/..., world/... # Специфичные роуты (stream)
│   ├── character/[id]/page.tsx   # Редактор (SSR → CharacterForm)
│   └── project/[id]/page.tsx     # Дашборд проекта (SSR → DashboardClient)
├── components/
│   ├── CharacterForm.tsx         # Главная форма (объединяет компоненты ниже)
│   ├── CharacterSidebar.tsx      # Сайдбар с навигацией по секциям и переключением персонажей
│   ├── QuickCommands.tsx         # Быстрые команды AI (Scratchpad, Motive, Conflict)
│   ├── AnalyzePanel.tsx          # Правая панель результатов анализа
│   ├── AnalyzeHistorySidebar.tsx # Левая панель истории
│   ├── TweaksPanel.tsx           # Настройки AI (провайдер, модель, t°, ключи)
│   ├── DiffModal.tsx             # Word-level diff перед применением AI-изменений
│   ├── ExportModal.tsx           # Экспорт в Markdown
│   └── ProjectDashboard.tsx      # Дашборд проектов
├── lib/
│   ├── prisma.ts                 # Singleton PrismaClient
│   ├── schema.ts                 # CHARACTER_SCHEMA: 24 секции, >145 полей
│   ├── actions.ts                # Server Actions: createCharacter, updateCharacter, ...
│   ├── rateLimit.ts              # DB-backed rate limiter (Prisma)
│   └── ai/
│       ├── provider.ts           # chatCompletion, chatCompletionStream, PROVIDER_CONFIGS
│       ├── prompt.ts             # buildFillPrompt, buildAnalyzePrompt, buildFixPrompt
│       ├── prompt-parser.ts      # parsePartialJson, fetchSseStream (универсальный парсинг)
│       ├── routeUtils.ts         # withAiMiddleware (HOC для auth и rate-limit)
│       ├── streamUtils.ts        # sseResponse (серверный стриминг)
│       ├── models.ts             # Единый список моделей (PROVIDER_MODELS)
│       └── useAiSettings.ts      # Клиентский хук: staged/saved/apply/revert
└── types/
    └── character.ts              # TypeScript-типы: FieldDef, SectionDef, AnalyzeIssue, ...
```

## Data flow: AI-заполнение

```
1. Пользователь жмёт «✨ Заполнить» (вся форма или секция)
2. CharacterForm.handleAiFill() / handleAiFillSection()
3. fetch POST /api/ai/fill
   └─ body: { existingData, sectionIds?, context?, provider, model, apiKey, stream }
4. fill/route.ts → buildFillPrompt() → chatCompletion() / chatCompletionStream()
5. provider.ts → Vercel AI SDK → DeepSeek/xAI/OpenAI/Anthropic/Gemini/OpenRouter API
6. parseFillResponse() — парсинг JSON из ответа
7. Ответ клиенту: { data: {...}, filledCount: N } или SSE stream
8. DiffModal — пользователь видит изменения (word-level diff)
9. Принять/отклонить → Server Action updateCharacter → БД
```

## Data flow: AI-анализ

```
1. Пользователь жмёт «🔍 Анализировать»
2. CharacterForm.handleAnalyze()
3. fetch POST /api/ai/analyze (SSE stream)
4. analyze/route.ts → buildAnalyzePrompt() → chatCompletionStream()
5. parseAnalyzeResponse() — парсинг: categories[], issues[], summary
6. Стриминг в AnalyzePanel — категории появляются по мере генерации
7. Пользователь жмёт «Исправить» → /api/ai/analyze/fix → DiffModal → БД
```

## AI-провайдеры

Абстракция в `provider.ts`: единый интерфейс `chatCompletion()` / `chatCompletionStream()`.
Конфигурация: `PROVIDER_CONFIGS` — apiKey, baseUrl, defaultModel, models[].

```typescript
type AiProvider = 'deepseek' | 'xai' | 'openai' | 'anthropic' | 'gemini' | 'openrouter';
```

- **DeepSeek** — основной, поддерживает reasoning, ключ из `DEEPSEEK_API_KEY` в .env
- **xAI** — через `@ai-sdk/xai`, требует `XAI_API_KEY`
- **OpenAI** — через Vercel AI SDK, требует `OPENAI_API_KEY`
- **Anthropic** — через `@ai-sdk/anthropic`, требует `ANTHROPIC_API_KEY`
- **Gemini** — через `@ai-sdk/google`, требует `GEMINI_API_KEY`
- **OpenRouter** — универсальный провайдер, совместим с OpenAI форматом, требует `OPENROUTER_API_KEY`

Приоритет API-ключа: ключ из настроек (localStorage) > переменная окружения.

## Staged/Apply паттерн (AI settings)

```
TweaksPanel (staged) ──apply()──→ saved (localStorage) ──→ CharacterForm (API calls)
       ↑                                                      │
       └─────────────── revert() ←────────────────────────────┘
```

Два состояния: `staged` (черновик в панели) и `saved` (активные настройки).
Изменения в панели не вступают в силу без явного «Применить».

## База данных

```prisma
model Project {
  id, name, description, emoji, color, isArchived, createdAt, updatedAt
  characters Character[]
}

model Character {
  id, name, data (JSON-строка), emoji, color, summary, isDraft, isArchived
  projectId → Project (optional)
}

model AppSetting {
  id, value   // активно используется для хранения System Prompts и других настроек
}

model RateLimit {
  ip, count, resetAt
}
```

Более 145 полей персонажа хранятся как JSON-строка в поле `data`. Таблица `AppSetting` является критичной для работы кастомных системных промптов (SystemPromptsEditor).

## Rate limiting

DB-backed (сохраняет стейт в `RateLimit` SQLite таблице) по IP. 
Используется в `/api/ai/analyze` и `/api/ai/analyze/fix`.
Лимит: 10 запросов в минуту с одного IP.
Сохраняет состояние при перезапуске сервера (решает проблему in-memory), автоматически очищает устаревшие записи.
