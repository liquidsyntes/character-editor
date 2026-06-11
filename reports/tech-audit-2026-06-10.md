# Отчет по проекту: Character Card Editor

**Дата аудита:** 10.06.2026  
**Аудитор:** Hermes Agent (DeepSeek V4 Pro)  
**Путь:** `C:\Screen\character-editor`

---

## Executive Summary

Character Card Editor — fullstack Next.js-приложение для создания карточек персонажей с AI-автозаполнением. Проект на стадии **активного MVP**: всё работает в dev-режиме, но production build сломан из-за отсутствия платформозависимой нативной библиотеки `@libsql/linux-x64-gnu`. Кодовая база в целом чистая, архитектура продуманная, документация детальная. Главные проблемы: дублирование моделей провайдеров, раздутый CharacterForm, платформозависимые баги сборки.

**Вердикт:** проект можно передавать разработчику — документация и онбординг на высоте, код читаемый. Но перед production-запуском нужно починить build и покрыть тестами критический путь.

---

## 1. Краткое описание

### Что это за проект
Веб-приложение для писателей, сценаристов, ролевиков и гейм-дизайнеров. Предоставляет структурированную форму из 145 полей в 24 секциях для детальной проработки персонажа. Встроенный AI-ассистент (через Vercel AI SDK) автоматически заполняет поля, анализирует на противоречия/клише/пробелы и предлагает исправления с визуальным word-level diff.

**Подтверждено:** `src/lib/schema.ts` — 24 секции, 145 полей.  
**Подтверждено:** `src/components/DiffModal.tsx` — word-level diff через библиотеку `diff` v9.

### Для чего он нужен
Замена разрозненным заметкам и таблицам единой структурированной карточкой с AI-ассистентом. Позволяет быстро создать глубокого персонажа и проверить его на логическую целостность.

### Общая оценка зрелости
**MVP, активная разработка.** Функционально rich: CRUD персонажей/проектов, AI-fill, AI-analyze, AI-fix, export, preview. Но production build сломан, тестовое покрытие минимально (7 unit-тестов).

---

## 2. Тип проекта

- **Категория:** Fullstack web (Next.js App Router)
- **Основные части:** React SPA (клиент) + Next.js Server (API Routes + Server Actions) + SQLite (БД) + Vercel AI SDK (интеграция с LLM)
- **Предполагаемые пользователи:** Один автор или малая группа (не SaaS). Архитектурные решения это подтверждают: SQLite, auto-register при входе, rate-limiter в процессе.

**Подтверждено:** `src/lib/auth.ts` — `CredentialsProvider` с auto-register.  
**Подтверждено:** `prisma/schema.prisma` — `provider = "sqlite"`.

---

## 3. Обнаруженный стек

| Слой | Технология | Версия | Где подтверждено |
|------|-----------|--------|------------------|
| Фреймворк | Next.js (App Router) | 16.2.6 | `package.json` |
| UI | React | 19.2.4 | `package.json` |
| CSS | Tailwind CSS | 3.4.19 | `package.json`, `tailwind.config.ts` |
| ORM | Prisma | 7.8.0 | `package.json` |
| БД | SQLite (libsql) | 0.17.3 | `package.json`, `prisma/schema.prisma` |
| AI SDK | `ai` (Vercel) | 6.0.193 | `package.json` |
| AI-провайдеры | `@ai-sdk/xai`, `@ai-sdk/anthropic`, `@ai-sdk/google` | 3.x | `package.json` |
| Аутентификация | NextAuth.js | 4.24.14 | `package.json`, `src/lib/auth.ts` |
| Валидация | Zod | 4.4.3 | `package.json`, `src/lib/env.ts` |
| Diff | `diff` | 9.0.0 | `package.json` |
| Пароли | bcryptjs | 3.0.3 | `package.json`, `src/lib/auth.ts` |
| Тесты | Vitest + Testing Library | 4.1.7 | `package.json`, `vitest.config.ts` |
| Линтер | ESLint 9 | `eslint-config-next` 16.2.6 | `package.json`, `eslint.config.mjs` |
| TypeScript | strict mode | 5.x | `tsconfig.json` |
| CI/CD | GitHub Actions | — | `.github/workflows/ci.yml` |
| Docker | Docker + compose | — | `Dockerfile`, `docker-compose.yml` |

### AI-провайдеры (подтверждено кодом)

| Провайдер | SDK | Ключ в .env | Статус |
|-----------|-----|-------------|--------|
| DeepSeek | OpenAI-compatible (прямой HTTP) | `DEEPSEEK_API_KEY` | ✅ Работает |
| xAI / Grok | `@ai-sdk/xai` | `XAI_API_KEY` | ⚠️ Код есть, ключа нет |
| OpenAI | Vercel AI SDK | `OPENAI_API_KEY` | ⚠️ Код есть, ключа нет |
| Anthropic | `@ai-sdk/anthropic` | `ANTHROPIC_API_KEY` | ⚠️ Код есть, ключа нет |
| Gemini | `@ai-sdk/google` | `GEMINI_API_KEY` | ⚠️ Код есть, ключа нет |
| OpenRouter | OpenAI-compatible | `OPENROUTER_API_KEY` | ⚠️ Код есть, ключа нет |

**Подтверждено:** `src/lib/ai/provider.ts`, `src/lib/ai/useAiSettings.ts`.

---

## 4. Структура проекта

### Ключевые папки

```
C:\Screen\character-editor\
├── src/
│   ├── app/                    # Next.js App Router — страницы и API
│   │   ├── api/ai/             # 6 API-роутов: fill, analyze, fix, narrative, public, world
│   │   ├── character/[id]/     # Редактор персонажа (SSR)
│   │   ├── project/[id]/       # Дашборд проекта
│   │   ├── login/              # Страница входа
│   │   └── register/           # Страница регистрации
│   ├── components/             # 28 React-компонентов
│   ├── hooks/                  # 3 кастомных хука
│   ├── lib/                    # Бизнес-логика
│   │   ├── ai/                 # AI-подсистема (provider, prompt, парсеры, стримы)
│   │   ├── actions.ts          # Все Server Actions (CRUD)
│   │   ├── schema.ts           # 145 полей персонажа (крупнейший файл: 29K)
│   │   ├── auth.ts             # NextAuth конфигурация
│   │   ├── env.ts              # Валидация .env через Zod
│   │   ├── prisma.ts           # Singleton PrismaClient
│   │   └── rateLimit.ts        # Rate limiter (DB-backed)
│   └── types/                  # TypeScript-типы
├── prisma/
│   ├── schema.prisma           # Схема БД: Character, Project, WorldElement, User, AppSetting
│   └── migrations/             # 2 миграции
├── docs/                       # 14 файлов документации (отличное покрытие!)
├── promt/                      # 2 файла с исходными промптами (нарратив, публичное мнение)
├── scripts/                    # 1 скрипт генерации схемы
├── reports/                    # Результаты аудитов
└── .github/workflows/ci.yml    # GitHub Actions CI
```

### Ключевые файлы

| Файл | Размер | Назначение |
|------|--------|-----------|
| `src/lib/schema.ts` | 29 789 chars | 24 секции / 145 полей — определение модели персонажа |
| `src/components/CharacterForm.tsx` | 13 139 chars / 365 строк | Главный компонент редактора — кандидат на декомпозицию |
| `src/lib/ai/provider.ts` | 12 424 chars | AI-провайдеры: chatCompletion, chatCompletionStream |
| `src/lib/ai/prompt.ts` | 13 030 chars | Системные промпты, билдеры промптов, парсеры |
| `src/lib/ai/prompt-constants.ts` | 18 281 chars | 11 дефолтных промптов (FILL, ANALYZE, FIX и др.) |
| `src/lib/actions.ts` | 8 839 chars | 12+ Server Actions (CRUD персонажей/проектов) |
| `src/lib/ai/useAiSettings.ts` | 7 319 chars | Клиентский хук AI-настроек (staged/apply/revert) |

### Точки входа

- **Страницы:** `src/app/page.tsx` (дашборд), `src/app/character/[id]/page.tsx` (редактор)
- **API:** `src/app/api/ai/fill/route.ts`, `src/app/api/ai/analyze/route.ts`, `src/app/api/ai/analyze/fix/route.ts`
- **Аутентификация:** `src/lib/auth.ts` (NextAuth), `src/app/api/auth/[...nextauth]/`

---

## 5. Архитектура

### Основные модули

```
┌─────────────────────────────────────────────────────┐
│  Браузер (React SPA)                                 │
│  ┌──────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │ CharacterForm│  │ AI-хуки    │  │ TweaksPanel │  │
│  │ (24 секции)  │  │ useAiFill  │  │ (провайдер, │  │
│  │              │  │ useCharAn. │  │  модель, t°) │  │
│  └──────┬───────┘  └─────┬──────┘  └─────────────┘  │
│         │ Server Actions  │ fetch /api/ai/*           │
├─────────┼────────────────┼──────────────────────────┤
│  Сервер Next.js           │                          │
│  ┌──────────────┐  ┌──────┴──────────────────┐      │
│  │ actions.ts   │  │ API Routes               │      │
│  │ CRUD         │  │ fill/analyze/fix/narr..  │      │
│  └──────┬───────┘  └──────┬──────────────────┘      │
│         │                 │                          │
│    ┌────┴────┐      ┌─────┴──────────┐              │
│    │ Prisma  │      │ Vercel AI SDK  │              │
│    │ +libsql │      │ provider.ts    │              │
│    └────┬────┘      └─────┬──────────┘              │
├─────────┼─────────────────┼──────────────────────────┤
│    SQLite│           DeepSeek / xAI / OpenAI API     │
└─────────┴─────────────────┴──────────────────────────┘
```

**Подтверждено:** `docs/architecture.md` — схема совпадает с реальным кодом.

### Data flow: AI-заполнение

1. Пользователь жмёт «✨ Заполнить» → `useAiFill` хук → `fetch POST /api/ai/fill`
2. `fill/route.ts` → `buildFillPrompt()` → `chatCompletion()` / `chatCompletionStream()`
3. `provider.ts` → Vercel AI SDK → API провайдера
4. `parseFillResponse()` → парсинг JSON
5. Ответ клиенту → `DiffModal` (word-level diff) → пользователь принимает/отклоняет
6. Принятие → `updateCharacter` Server Action → Prisma → SQLite

**Подтверждено:** `src/app/api/ai/fill/route.ts`, `src/lib/ai/prompt.ts`, `src/components/DiffModal.tsx`.

### Data flow: AI-анализ

1. Пользователь жмёт «🔍 Анализировать» → `useCharacterAnalysis` → `fetch POST /api/ai/analyze` (SSE stream)
2. `analyze/route.ts` → `buildAnalyzePrompt()` → `chatCompletionStream()`
3. `parseAnalyzeResponse()` → categories[], issues[], summary
4. Стриминг в `AnalyzePanel` — категории появляются по мере генерации
5. Пользователь жмёт «Исправить» → `/api/ai/analyze/fix` → `buildFixPrompt()` → DiffModal → БД

### Staged/Apply паттерн (AI-настройки)

```
TweaksPanel (staged) ──apply()──→ saved (localStorage + HttpOnly cookies)
     ↑                                    │
     └────────── revert() ←───────────────┘
```

Два состояния: `staged` (черновик в панели) и `saved` (активные настройки). API-ключи хранятся в HttpOnly cookies, замаскированы в localStorage.

**Подтверждено:** `src/lib/ai/useAiSettings.ts`, `src/lib/settingsActions.ts`.

### Наблюдаемые паттерны

- **Server Actions для CRUD** — согласованно, без исключений. Все мутации через `src/lib/actions.ts`.
- **API Routes для AI** — отдельный канал, не пересекается с Server Actions.
- **Singleton PrismaClient** — `src/lib/prisma.ts`, глобальный кэш в dev.
- **Feature-based в components** — компоненты сгруппированы по фичам, а не по слоям (CharacterForm, AnalyzePanel, DiffModal...).
- **Auth-guard на уровне страниц и API** — `requireAuth()` в API-роутах, `getServerSession()` в страницах.
- **Multi-provider AI абстракция** — единый интерфейс `chatCompletion()` / `chatCompletionStream()` для 6 провайдеров.

### Сильные стороны

- **Отличная документация:** 14 файлов в `docs/`, включая onboarding.md (22K), architecture.md, project-context.md, audit.md, roadmap.md.
- **Чистая AI-абстракция:** провайдеры изолированы в `provider.ts`, добавление нового провайдера требует правки 2 файлов (документировано в GEMINI.md).
- **SSE-стриминг:** все AI-роуты поддерживают стриминг, есть переиспользуемая `sseResponse()` в `streamUtils.ts`.
- **Безопасность API-ключей:** HttpOnly cookies + маскировка в localStorage. Не `localStorage` для реальных ключей.
- **Валидация .env через Zod** при старте (`src/lib/env.ts` — импортируется в `next.config.ts`).
- **Настроенный CI/CD:** `.github/workflows/ci.yml` — lint, test, build на push/PR в main.
- **Docker support:** мультистейдж Dockerfile + docker-compose.yml с volume для SQLite.

### Слабые стороны

- **Дублирование моделей провайдеров** — `PROVIDER_MODELS` в `useAiSettings.ts` и `PROVIDER_CONFIGS[].models` в `provider.ts` содержат одинаковые данные. Расхождение уже есть: OpenRouter в `useAiSettings.ts` имеет 9 моделей, в `provider.ts` — 4. `Предположение:` добавление новой модели в одном месте без обновления второго приведёт к багу.
- **CharacterForm.tsx (13K, 365 строк)** — кандидат на декомпозицию. Содержит логику рендера 24 секций, AI-филл, анализ, навигацию. В `refactoring_ideas.md` это документировано.
- **Дублирование SSE-логики** — `fill/route.ts`, `analyze/route.ts`, `narrative/route.ts`, `public/route.ts`, `world/route.ts` содержат повторяющийся boilerplate (auth check, rate limit, validation, stream). Частично вынесено в `routeUtils.ts`.
- **Rate limiter на Prisma** — каждое API-обращение делает 2-3 запроса к SQLite. Для персонального использования ок, но под нагрузкой будет узким местом.
- **Platform-dependent бинарники** — `@libsql/linux-x64-gnu` и `@rolldown/binding-linux-x64-gnu` должны быть установлены вручную на WSL/Linux.

---

## 6. Запуск и разработка

### Install
```bash
npm install
npm install @libsql/linux-x64-gnu    # обязательно на WSL/Linux
npx prisma generate
npx prisma migrate dev
```

### Dev run
```bash
npm run dev    # → localhost:4000
```

**Подтверждено:** порт 4000 прописан в `package.json` (`next dev -p 4000`).

### Build
```bash
npm run build
```
**Текущий статус:** ❌ Сломан. Ошибка: `Cannot find module '@libsql/linux-x64-gnu'`.  
**Фикс:** `npm install @libsql/linux-x64-gnu` (документировано в README и GEMINI.md).

### Test
```bash
npm test    # vitest run
```
**Текущий статус:** ❌ Сломан. Ошибка: `Cannot find module '@rolldown/binding-linux-x64-gnu'`.  
**Причина:** Vitest 4 использует Rolldown как bundler, нужен платформозависимый бинарник.

### Lint
```bash
npm run lint
```
**Текущий статус:** ❌ 17 errors, 7 warnings. В основном `@typescript-eslint/no-explicit-any` в `PublicClient.tsx` (4 шт.), `QuickCommands.tsx` (2 шт.), `WorldElementForm.tsx` (1 шт.).

### Env variables (`.env`)

| Переменная | Обязательна | Назначение |
|-----------|-------------|-----------|
| `DATABASE_URL` | Да | Путь к SQLite (`file:./dev.db`) |
| `DEEPSEEK_API_KEY` | Рекомендована | Основной AI-провайдер |
| `XAI_API_KEY` | Нет | xAI / Grok |
| `OPENAI_API_KEY` | Нет | OpenAI |
| `ANTHROPIC_API_KEY` | Нет | Anthropic |
| `GEMINI_API_KEY` | Нет | Google Gemini |
| `OPENROUTER_API_KEY` | Нет | OpenRouter |
| `NEXTAUTH_URL` | Да | URL приложения для NextAuth |
| `NEXTAUTH_SECRET` | Да | Секрет для JWT |

**Подтверждено:** `src/lib/env.ts` (Zod-схема), `.env.example`.

### Docker
```bash
docker compose up    # порт 3000 (не 4000!)
```
**⚠️ Важно:** docker-compose.yml использует порт 3000, а dev-сервер — 4000. Расхождение.

---

## 7. Наблюдения и проблемы

### Несоответствия документации и кода

1. **Rate limiter:** `docs/current-state.md` и `docs/architecture.md` упоминают in-memory rate limiter. В реальности `src/lib/rateLimit.ts` использует **Prisma** (таблица `RateLimit` в БД). Код обновлён, документация — нет.

2. **Модели OpenRouter:** `useAiSettings.ts` содержит 9 моделей для OpenRouter, `provider.ts` — только 4. UI покажет модели, которые сервер не сможет использовать.

3. **Порт в Docker:** dev-сервер на 4000, Docker — на 3000.

### Подозрительные места

4. **AppSetting используется:** `src/lib/ai/prompt.ts` читает `prisma.appSetting.findUnique()` для получения кастомных промптов. В отличие от того, что утверждает `current-state.md` («не используется»), `AppSetting` реально задействован.

5. **Промпты-дубликаты:** `promt/` содержит исходные Markdown-промпты (`promt_narative.md`, `promt_publ.md`), а `src/lib/ai/prompt-constants.ts` — их JSON-адаптированные версии. Неясно, какой вариант канонический.

6. **Пустая папка `src/app/actions/`** — есть `settings.ts`, но архитектура предполагает Server Actions в `src/lib/actions.ts`. Путаница.

### Technical debt

7. **Дублирование PROVIDER_MODELS / PROVIDER_CONFIGS.models** — гарантированный источник багов при добавлении моделей.
8. **CharacterForm 13K** — задокументировано в `refactoring_ideas.md`, не разбито.
9. **SSE boilerplate** — 6 API-роутов с похожей структурой, `routeUtils.ts` вынес часть логики, но не всю.
10. **Нет graceful fallback между провайдерами** — если DeepSeek лёг, ошибка идёт пользователю.

### Security risks

11. **NEXTAUTH_SECRET в .env** — замаскирован (`***`), но в репозитории лежит реальное значение? Проверить `git log -p .env`. **Проверено:** `.env` в `.gitignore`.
12. **Dockerfile содержит `prisma@7.8.0` глобально** — фиксация версии хорошо, но если версия в `package.json` изменится, Docker-образ сломается.
13. **CORS не настроен** в API-роутах (для локального использования ок, но в production — риск).
14. **CSP разрешает `unsafe-eval` и `unsafe-inline`** в `next.config.ts` — ослабляет защиту от XSS.

### Maintainability risks

15. **Prisma 7.8.0** — свежая мажорная версия (вышла в 2026). Breaking changes вероятны.
16. **Vercel AI SDK 6** — тоже свежая мажорная версия.
17. **7 тестов на 87 файлов** —覆盖率 < 5%. Критический путь (fill → diff → save) не покрыт интеграционными тестами.
18. **Vitest 4 использует Rolldown** — ломается на WSL без ручной установки бинарника.

---

## 8. Рекомендации

### Исправить немедленно

1. **Установить платформозависимые пакеты:**
   ```bash
   npm install @libsql/linux-x64-gnu
   npm install @rolldown/binding-linux-x64-gnu
   ```
   Без этого build и test сломаны.

2. **Починить ESLint-ошибки:** 17 errors — заменить `any` на конкретные типы в `PublicClient.tsx`, `QuickCommands.tsx`, `WorldElementForm.tsx`.

### Исправить в первую очередь

3. **Синхронизировать PROVIDER_MODELS и PROVIDER_CONFIGS.models** — вынести модели в один источник правды (например, общий массив в `provider.ts`, от которого оба импортируют).
4. **Обновить `docs/current-state.md`:** rate limiter стал DB-backed, AppSetting используется.
5. **Унифицировать порты:** dev и Docker на один порт (4000 или 3000).

### Что задокументировать

6. **Канонические промпты:** где правда — `promt/` или `prompt-constants.ts`?
7. **Процесс добавления модели:** сейчас документирован (2 файла), но из-за дублирования риск ошибки высок.

### Что проверить вручную

8. **xAI, OpenAI, Anthropic, Gemini, OpenRouter** с реальными ключами — код написан, но не тестировался.
9. **Reasoning-модели (DeepSeek Reasoner)** — по документации упираются в таймауты, нужен retry/fallback.
10. **Docker-сборка** — не тестировалась в WSL-окружении.

### Что упростить или переработать

11. **Вынести SSE-logic** в общий middleware/хелпер для 6 API-роутов.
12. **Декомпозировать CharacterForm** — вынести секции в отдельные компоненты (AppearanceSection, PsychologySection и т.д.).
13. **Добавить graceful fallback** между AI-провайдерами.

---

## 9. С чего начать новому разработчику

### Первые файлы для чтения (в порядке)

1. `docs/onboarding.md` — 22K исчерпывающего онбординга, 15 минут чтения
2. `docs/architecture.md` — диаграммы, data flow, модули
3. `docs/project-context.md` — стек, критические файлы, конвенции
4. `src/lib/schema.ts` — 145 полей персонажа (понять домен)
5. `src/lib/ai/provider.ts` — AI-абстракция (ключевой architectural decision)
6. `src/lib/actions.ts` — все Server Actions (CRUD)

### Как поднять проект

```bash
npm install
npm install @libsql/linux-x64-gnu    # WSL/Linux
npm install @rolldown/binding-linux-x64-gnu  # для тестов
cp .env.example .env                 # добавить DEEPSEEK_API_KEY
npx prisma migrate dev
npm run dev                          # → localhost:4000
```

### Какие части изучить сначала

- **AI-подсистема** (`src/lib/ai/`) — самое сложное и самое важное
- **CharacterForm** (`src/components/CharacterForm.tsx`) — главный компонент, 365 строк
- **API Routes** (`src/app/api/ai/`) — 6 роутов, похожая структура

### Какие риски держать в голове

- Добавление AI-модели требует правки **двух** файлов (useAiSettings.ts + provider.ts)
- Prisma 7 и AI SDK 6 — свежие мажорные версии, breaking changes вероятны
- WSL/Linux требует ручной установки `@libsql/linux-x64-gnu`
- `NEXTAUTH_SECRET` в `.env` — не коммитить, не терять

---

## 10. Краткий итог

- **Проект:** fullstack Next.js-приложение для создания карточек персонажей с AI-автозаполнением
- **Статус:** MVP, активная разработка, production build сломан из-за отсутствия платформозависимого пакета
- **Стек:** Next.js 16, React 19, Prisma 7 + SQLite (libsql), Vercel AI SDK 6, Tailwind 3, 6 AI-провайдеров
- **Архитектура:** чистая, двухканальная (Server Actions для CRUD, API Routes для AI), с продуманной AI-абстракцией
- **Документация:** отличная (14 файлов в docs/, включая 22K onboarding), но есть устаревшие места
- **Тесты:** 7 unit-тестов, покрытие < 5%, критические пути не покрыты
- **Код:** чистый, читаемый, с конвенциями. Главный техдолг: дублирование моделей провайдеров, раздутый CharacterForm (365 строк)
- **Безопасность:** API-ключи в HttpOnly cookies, валидация .env через Zod, CSP с послаблениями, auto-register пользователей
- **DevOps:** GitHub Actions CI, Docker поддержка, но порты в Docker и dev не совпадают
- **Рекомендация:** починить build → синхронизировать модели провайдеров → покрыть тестами критический путь → декомпозировать CharacterForm
