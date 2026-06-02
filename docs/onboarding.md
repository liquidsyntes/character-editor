# Character Card Editor — Технический онбординг

**Дата:** 02.06.2026 · **Аудитор:** Hermes Agent
**Цель этого документа:** через 15 минут чтения вы понимаете кодовую базу достаточно, чтобы вносить изменения.

---

## 0. Оглавление

1. [Что это и зачем](#1-что-это-и-зачем)
2. [Ментальная модель](#2-ментальная-модель)
3. [Сквозной проход: что происходит, когда пользователь...](#3-сквозной-проход)
4. [Стек и почему именно он](#4-стек-и-почему-именно-он)
5. [Структура проекта: карта папок](#5-структура-проекта)
6. [Ключевые файлы: что где лежит](#6-ключевые-файлы)
7. [Конвенции и негласные правила](#7-конвенции)
8. [Как запустить и разрабатывать](#8-как-запустить)
9. [Что сломано прямо сейчас](#9-что-сломано)
10. [Куда смотреть, чтобы что-то поменять](#10-куда-смотреть)

---

## 1. Что это и зачем

**Character Card Editor** — веб-приложение для создания детальных карточек персонажей. Целевая аудитория: сценаристы, писатели, ролевики, гейм-дизайнеры. Проблема, которую решает проект: вместо разрозненных заметок и таблиц — единая структурированная форма на 145 полей в 24 секциях, с AI-ассистентом, который сам предлагает заполнение, находит противоречия и исправляет ошибки.

Приложение **персональное** (не SaaS) — рассчитано на одного автора или малую группу. Отсюда архитектурные решения: SQLite, auto-register при первом входе, API-ключи в HttpOnly cookies, rate-limiter в памяти процесса.

**Состояние на сейчас:** MVP. Всё работает в dev-режиме (`npm run dev`). Production build (`npm run build`) сломан — маршрут preview падает на инициализации PrismaClient при статической генерации.

---

## 2. Ментальная модель

### Как думать о проекте

Проект построен вокруг **трёх слоёв**, разделённых чёткой границей:

```
╔════════════════════════════════════════════════════╗
║  Браузер (React SPA)                              ║
║  ┌──────────────┐  ┌────────────┐  ┌───────────┐  ║
║  │ CharacterForm │  │ AI-хуки    │  │ Tweaks    │  ║
║  │ (рендерит     │  │ (useAiFill │  │ Panel     │  ║
║  │  24 секции)   │  │  useChar-  │  │ (настройки║
║  │               │  │  acterAna- │  │  AI)      │  ║
║  │               │  │  lysis)    │  │           │  ║
║  └──────┬───────┘  └─────┬──────┘  └───────────┘  ║
║         │                │                         ║
╚═════════╪════════════════╪═════════════════════════╝
          │ Server Actions │ fetch /api/ai/*
          ▼                ▼
╔════════════════════════════════════════════════════╗
║  Сервер Next.js                                    ║
║                                                    ║
║  ┌──────────────────┐  ┌──────────────────────┐   ║
║  │ Server Actions    │  │ API Routes            │   ║
║  │ (src/lib/         │  │ (src/app/api/ai/)     │   ║
║  │  actions.ts)      │  │                       │   ║
║  │                   │  │ fill/route.ts         │   ║
║  │ CRUD персонажей   │  │ analyze/route.ts      │   ║
║  │ и проектов        │  │ analyze/fix/route.ts  │   ║
║  └────────┬─────────┘  └───────────┬───────────┘   ║
║           │                        │               ║
║           ▼                        ▼               ║
║  ┌────────────────┐  ┌────────────────────────┐   ║
║  │ Prisma ORM     │  │ Vercel AI SDK           │   ║
║  │ + libsql       │  │ (provider.ts)           │   ║
║  └───────┬────────┘  └──────────┬─────────────┘   ║
╚══════════╪══════════════════════╪══════════════════╝
           ▼                      ▼
     ┌──────────┐    ┌───────────────────────┐
     │ SQLite   │    │ DeepSeek / xAI /      │
     │ (dev.db) │    │ OpenAI API            │
     └──────────┘    └───────────────────────┘
```

**Главное правило:** данные из формы в БД идут **только** через Server Actions (`src/lib/actions.ts`). AI-запросы идут **только** через API Routes (`src/app/api/ai/`). Эти два канала не пересекаются.

### Две «половины» приложения

У приложения есть два режима, как два разных экрана:

| Режим | URL | Компонент | Что делает |
|-------|-----|-----------|-----------|
| **Дашборд** | `/` , `/project/[id]` | `ProjectDashboard`, `DashboardClient` | Список проектов и персонажей, CRUD, навигация |
| **Редактор** | `/character/[id]` | `CharacterForm` | Форма на 145 полей, AI-заполнение/анализ, undo/redo |

Между ними — ссылки `<Link>`. При переходе в редактор страница рендерится на сервере (SSR), затем гидратируется в клиентский SPA.

### Модель данных одним взглядом

```
Project ──1:N──▶ Character
   │                │
   │                └── data: JSON-строка (все 145 полей)
   │
   └── User (владелец)

User ──1:N──▶ Character (может быть без проекта)
User ──1:N──▶ Project

AppSetting — key-value хранилище для системных промптов
```

**Важно:** поля персонажа хранятся как **один JSON-объект** в колонке `Character.data`. Это осознанное решение: 145 отдельных колонок в SQLite были бы неудобны, а схема полей часто меняется. Парсинг/сериализация происходит в `actions.ts` при каждом сохранении.

---

## 3. Сквозной проход: что происходит, когда пользователь...

### ...заполняет форму AI

```
1. Пользователь в CharacterForm жмёт "✨ Заполнить"
2. useAiFill.handleAiFill() — клиентский хук
3. fetch POST /api/ai/fill
   body: { existingData: {...}, sectionIds?: [...], provider: 'deepseek', model: 'deepseek-chat', stream: true, apiKey: 'sk-...' }
4. fill/route.ts:
   ├── requireAuth()          → проверяет NextAuth сессию
   ├── checkApiRateLimit(20)  → in-memory лимит на IP
   ├── validateExistingData() → body.existingData — объект?
   ├── buildFillPrompt({existingData, sectionIds}) → собирает системный и пользовательский промпты
   ├── chatCompletionStream(messages, {provider, model, temperature, maxTokens})
   │   └── provider.ts → createXai() или fetch к DeepSeek/OpenAI
   └── sseResponse(aiStream) → оборачивает ReadableStream в SSE (text/event-stream)
5. Клиент получает SSE-поток: data: {"text":"{\"firstName\": \"Анна\"}"} ...
6. useAiFill парсит JSON по мере прихода чанков (parsePartialJson)
7. Когда поток закрывается → DiffModal показывает изменения (word-level diff)
8. Пользователь принимает → updateCharacter(id, mergedData) Server Action → Prisma → SQLite
9. revalidatePath() → страница перерендеривается
```

### ...анализирует персонажа

```
1. Пользователь жмёт "🔍 Анализировать"
2. useCharacterAnalysis.handleAnalyze()
3. fetch POST /api/ai/analyze (SSE)
4. analyze/route.ts → buildAnalyzePrompt → chatCompletionStream
5. Результат — JSON: { summary, categories: [{ title, icon, severity, issues: [...] }] }
6. Каждый issue имеет severity: contradiction | gap | cliche | inconsistency | opportunity
7. SSE-поток парсится в AnalyzePanel (правая панель)
8. Результат кешируется в AnalyzeHistorySidebar (левая панель)
```

### ...исправляет проблему, найденную AI

```
1. Пользователь в AnalyzePanel жмёт "🔧 Исправить" рядом с issue
2. fetch POST /api/ai/analyze/fix
   body: { existingData, issues: [{ title, description, severity, fields: ['age', 'backstory'] }] }
3. fix/route.ts → buildFixPrompt → chatCompletion (не стриминг — ждём полный ответ)
4. parseFillResponse → DiffModal → пользователь принимает → updateCharacter
```

### ...сохраняет персонажа вручную

```
1. Пользователь редактирует поле в CharacterForm
2. useCharacterFormState.handleChange(fieldId, value)
   ├── setData(prev => ({...prev, [fieldId]: value})) — обновляет состояние
   ├── pushUndo(prevState) — сохраняет в стек undo
   └── scheduleSave() — debounce 2 секунды
3. Через 2 секунды: doSave(data)
4. doSave → updateCharacter(id, data) Server Action
5. actions.ts: prisma.character.updateMany({ where: { id, userId }, data: { data: JSON.stringify(formData) } })
```

---

## 4. Стек и почему именно он

| Технология | Версия | Почему выбрана |
|-----------|--------|---------------|
| **Next.js 16** | 16.2.6 | App Router + Server Actions — безопасный CRUD без написания API |
| **React 19** | 19.2.4 | Последняя стабильная, клиентские компоненты где нужно |
| **TypeScript** | ^5 | Strict mode, типизация schema.ts критична |
| **Prisma 7** | 7.8.0 | Лучшая DX для SQLite, миграции, типизированный клиент |
| **SQLite (libsql)** | 0.17.3 | Персональный инструмент — не нужен PostgreSQL. libsql быстрее better-sqlite3 |
| **Vercel AI SDK** | 6.0.193 | Единый API для трёх провайдеров, стриминг из коробки |
| **Tailwind 3** | 3.4.19 | Кастомная Material Design палитра, утилитарный CSS |
| **NextAuth 4** | 4.24.14 | JWT-сессии, Credentials provider с авторегистрацией |
| **Vitest** | 4.1.7 | Быстрые тесты, нативная поддержка ESM, JSDOM |
| **Zod** | 4.4.3 | Валидация .env при старте |
| **diff** | 9.0.0 | Word-level diff AI-изменений |
| **bcryptjs** | 3.0.3 | Хэширование паролей (чистый JS, не требует node-gyp) |

### Почему AI SDK 6, а не прямое fetch?

`provider.ts` абстрагирует трёх провайдеров за одним интерфейсом:

```typescript
// provider.ts — упрощённо
export async function chatCompletion(messages, { provider, model, ... }) {
  switch (provider) {
    case 'xai':     return xaiChat(messages, model);     // @ai-sdk/xai
    case 'deepseek': return deepseekChat(messages, model); // fetch к api.deepseek.com
    case 'openai':  return openaiChat(messages, model);   // fetch к api.openai.com
  }
}
```

Это позволяет UI переключать провайдера на лету без изменения остального кода.

### Почему JSON-поле Character.data, а не отдельные колонки?

- 145 полей × N персонажей = 145 колонок в SQLite — неудобно
- Схема полей меняется (добавляются/удаляются поля) — с JSON не нужны миграции на каждое изменение
- Prisma генерирует типы из schema.prisma, но для полей персонажа типы живут в `src/types/character.ts`

---

## 5. Структура проекта: карта папок

```
character-editor/
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout, подключает шрифты
│   │   ├── page.tsx                # "/" — дашборд проектов (SSR)
│   │   ├── globals.css             # Tailwind + Material Symbols
│   │   │
│   │   ├── api/ai/                 # AI API-роуты
│   │   │   ├── fill/route.ts       # POST /api/ai/fill
│   │   │   ├── analyze/route.ts    # POST /api/ai/analyze (SSE)
│   │   │   └── analyze/fix/route.ts # POST /api/ai/analyze/fix
│   │   │
│   │   ├── api/auth/               # NextAuth (автоматически)
│   │   ├── character/[id]/page.tsx # Редактор (SSR → CharacterForm)
│   │   ├── character/layout.tsx    # Боковая навигация по секциям
│   │   ├── project/[id]/page.tsx   # Дашборд проекта
│   │   ├── login/page.tsx          # Страница входа
│   │   └── register/page.tsx       # Страница регистрации
│   │
│   ├── components/                 # React-компоненты
│   │   ├── CharacterForm.tsx       # ★ Главный (37 KB) — форма + AI-кнопки
│   │   ├── CharacterSection.tsx    # Одна секция формы
│   │   ├── AnalyzePanel.tsx        # Результаты анализа (правая панель)
│   │   ├── AnalyzeHistorySidebar.tsx # История анализов
│   │   ├── DiffModal.tsx           # Word-level diff AI-изменений
│   │   ├── ExportModal.tsx         # Экспорт в Markdown/JSON/Text
│   │   ├── TweaksPanel.tsx         # Настройки AI (провайдер, модель, ключи)
│   │   ├── SystemPromptsEditor.tsx # Редактор системных промптов
│   │   ├── ProjectDashboard.tsx    # Дашборд проектов
│   │   ├── DashboardClient.tsx     # Клиентская часть дашборда
│   │   └── CharacterListPanel.tsx  # Список персонажей в проекте
│   │
│   ├── hooks/                      # Реакт-хуки (бизнес-логика)
│   │   ├── useAiFill.ts           # AI-заполнение (стриминг)
│   │   ├── useCharacterAnalysis.ts # AI-анализ (SSE + буферизация)
│   │   └── useCharacterFormState.ts # Состояние формы: undo, save, dirty
│   │
│   ├── lib/                        # Бизнес-логика (сервер + клиент)
│   │   ├── schema.ts              # ★ 24 секции, 145 полей персонажа
│   │   ├── actions.ts             # ★ Server Actions (CRUD)
│   │   ├── prisma.ts              # PrismaClient singleton + libsql adapter
│   │   ├── auth.ts                # NextAuth конфигурация
│   │   ├── env.ts                 # Zod-валидация process.env
│   │   ├── rateLimit.ts           # In-memory rate limiter
│   │   ├── export.ts              # Экспорт в Markdown/JSON/Text
│   │   ├── constants.ts           # SEVERITY_LABELS для UI
│   │   ├── settingsActions.ts     # Server Actions для API-ключей в cookies
│   │   │
│   │   └── ai/                    # AI-подсистема
│   │       ├── provider.ts        # chatCompletion, chatCompletionStream
│   │       ├── prompt.ts          # buildFillPrompt, buildAnalyzePrompt, buildFixPrompt
│   │       ├── prompt-constants.ts # Системные промпты по умолчанию
│   │       ├── prompt-parser.ts   # parseFillResponse, parseAnalyzeResponse
│   │       ├── routeUtils.ts      # Общие утилиты API-роутов
│   │       ├── streamUtils.ts     # sseResponse — SSE-обёртка
│   │       └── useAiSettings.ts   # Клиентский staged/apply хук
│   │
│   └── types/
│       ├── character.ts           # FieldDef, SectionDef, AnalyzeIssue, ...
│       └── next-auth.d.ts         # Расширение Session.user.id
│
├── prisma/
│   ├── schema.prisma              # Project, Character, User, Session, AppSetting
│   └── migrations/                # 2 миграции: init, add_projects
│
├── docs/                          # Документация (6 файлов)
│   ├── project-context.md         # Быстрый старт
│   ├── architecture.md            # Диаграммы, data flow
│   ├── current-state.md           # Статус, TODO, покрытие тестами
│   ├── git-workflow.md            # Правила git
│   └── session-*.md               # Логи сессий разработки
│
├── .github/workflows/ci.yml       # GitHub Actions
├── Dockerfile                     # Мультистейдж (node:20-alpine)
├── docker-compose.yml             # Порт 3000, volume для SQLite
├── docker-entrypoint.sh           # prisma db push → node server.js
├── .env.example                   # Шаблон переменных
├── .env                           # ★ Реальные ключи (НЕ КОММИТИТЬ)
└── dev.db                         # SQLite база (380 KB)
```

---

## 6. Ключевые файлы: что где лежит

| Если нужно... | Иди в файл | Что там |
|--------------|-----------|---------|
| Добавить поле персонажа | `src/lib/schema.ts` | Массив `CHARACTER_SCHEMA` — 24 секции, каждая с полями |
| Поменять логику сохранения | `src/lib/actions.ts` | `updateCharacter()`, `createCharacter()`, `deleteCharacter()` |
| Добавить AI-провайдера | `src/lib/ai/provider.ts` + `src/lib/ai/useAiSettings.ts` | **Два файла обязательно!** Иначе UI сломается |
| Поменять системный промпт | `src/lib/ai/prompt-constants.ts` | `DEFAULT_FILL_SYSTEM_PROMPT`, `DEFAULT_ANALYZE_SYSTEM_PROMPT` |
| Настроить rate limit | `src/lib/rateLimit.ts` + `src/lib/ai/routeUtils.ts` | Параметры в вызовах `checkApiRateLimit(req, N)` |
| Поменять аутентификацию | `src/lib/auth.ts` | NextAuth options: провайдеры, callbacks |
| Поменять схему БД | `prisma/schema.prisma` | Затем `npx prisma migrate dev` |
| Поменять UI формы | `src/components/CharacterForm.tsx` | Самый большой файл, будь осторожен |
| Поменять логику AI-заполнения | `src/hooks/useAiFill.ts` | Клиентская логика стриминга и парсинга |
| Посмотреть типы | `src/types/character.ts` | `CharacterData`, `AnalyzeIssue`, `SectionDef`, `FieldDef` |
| Понять data flow | `docs/architecture.md` | Диаграммы и описание потоков |

---

## 7. Конвенции и негласные правила

### Код

- **Язык кода:** английский (имена переменных, функций, комментарии)
- **Язык UI:** русский (лейблы, плейсхолдеры, сообщения об ошибках)
- **'use client'** — только там, где реально нужно клиентское состояние (useState, useEffect, обработчики)
- **Server Actions** — для CRUD. Не пиши API-роуты для сохранения данных
- **API Routes** — только для AI-запросов (`/api/ai/*`)
- **Zod-валидация** — для .env (уже есть). Для API-запросов — ручная проверка через `routeUtils.ts`

### Git (из `docs/git-workflow.md`)

- `main` — неприкосновенная ветка. Никаких прямых коммитов
- Ветки: `feat/...`, `fix/...`, `refactor/...`, `chore/...`
- Одна задача = одна ветка
- `git merge --no-ff` при вливании
- Влил → удалил ветку

### Добавление AI-модели

**Всегда обновляй ДВА файла:**

1. `src/lib/ai/useAiSettings.ts` — массив `PROVIDER_MODELS` (то, что видит пользователь в UI)
2. `src/lib/ai/provider.ts` — объект `PROVIDER_CONFIGS[provider].models` (серверная валидация)

Если обновить только один — либо модель не появится в UI, либо сервер отклонит запрос.

### API-ключи

Ключи **не хранятся в БД**. Они живут в HttpOnly cookies (`cc_api_keys`) и передаются клиентом при каждом AI-запросе в теле запроса. Клиентский хук `useAiSettings` использует staged/apply паттерн: изменения в TweaksPanel накапливаются в `staged`, по кнопке «Применить» сохраняются в `saved` + localStorage + cookies.

### Схема персонажа

`src/lib/schema.ts` — единственный источник правды о полях персонажа. Не дублируй определения полей в других файлах. Если добавляешь поле:

1. Добавь запись в соответствующую секцию в `CHARACTER_SCHEMA`
2. TypeScript автоматически подхватит `id` поля через `CharacterData` (это `Record<string, string>`)
3. CharacterForm автоматически отрендерит поле благодаря перебору `CHARACTER_SCHEMA`
4. AI-промпты автоматически включат поле в JSON-схему

---

## 8. Как запустить и разрабатывать

### Первый запуск

```bash
# 1. Клонирование (если с нуля)
cd character-editor

# 2. Зависимости
npm install
# На WSL/Linux обязательно:
npm install @libsql/linux-x64-gnu

# 3. .env
cp .env.example .env
# Отредактировать: DEEPSEEK_API_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL

# 4. База данных
npx prisma generate
npx prisma migrate dev

# 5. Запуск
npm run dev
# → http://localhost:3000
```

### Основные команды

| Команда | Что делает |
|---------|-----------|
| `npm run dev` | Dev-сервер (Turbopack, hot reload) |
| `npm run build` | Production build (⚠ сейчас сломан) |
| `npm start` | Production сервер (после build) |
| `npm test` | Vitest — 7 тестовых файлов |
| `npm run lint` | ESLint (next/core-web-vitals + typescript) |
| `npx prisma studio` | GUI для просмотра БД |
| `npx prisma migrate dev` | Применить миграции |

### Docker

```bash
docker compose up -d
# → localhost:3000
# SQLite в volume: sqlite_data
# Entrypoint: prisma db push → node server.js
```

### Тесты (7 файлов)

| Файл | Что тестирует |
|------|--------------|
| `src/lib/ai/prompt.test.ts` | Парсеры AI-ответов (parseFillResponse, parseAnalyzeResponse) |
| `src/app/api/ai/fill/route.test.ts` | Валидация, non-stream, stream |
| `src/app/api/ai/analyze/route.test.ts` | Валидация, rate limit, stream |
| `src/app/api/ai/analyze/fix/route.test.ts` | Валидация, обработка issues |
| `src/lib/actions.test.ts` | Server Actions: авторизация, CRUD |
| `src/components/CharacterFormHeader.test.tsx` | UI-компонент: рендер, события |
| `src/components/CharacterFormSummary.test.tsx` | UI-компонент: рендер, состояния |

Запускаются через `npm test` (vitest run). Быстрые — меньше секунды на все 7 файлов.

---

## 9. Что сломано прямо сейчас

### 🔴 Production build

```
$ npm run build
...
Failed to collect configuration for /character/[id]/preview
PrismaClientInitializationError: PrismaClient needs to be constructed 
with a non-empty, valid PrismaClientOptions
```

**Причина:** Next.js пытается статически сгенерировать страницу `/character/[id]/preview` на этапе сборки. PrismaClient с адаптером `@prisma/adapter-libsql` не может инициализироваться без реальной БД (статический анализ не находит `DATABASE_URL`).

**Как чинить (варианты):**
- Добавить `export const dynamic = 'force-dynamic'` на страницу preview — отключит статическую генерацию
- Или: добавить `export const dynamicParams = true` + обернуть PrismaClient в условную инициализацию

### 🔴 TypeScript ошибка

```
src/hooks/useCharacterAnalysis.ts(32,XX): error TS1351: 
An identifier or keyword cannot immediately follow a numeric literal.
```

**Причина:** синтаксическая ошибка в строковом литерале — вероятно, неэкранированные кавычки или бэкслеши в регулярном выражении или строке.

**Строка 32** в `useCharacterAnalysis.ts` — нужно посмотреть и исправить.

### 🟡 Предупреждения

- **Три HTML-файла в корне** (`login_temp.html`, `register_temp.html`, `stitch_screen.html`) — дизайн-прототипы. Не используются, но лежат в корне и путают. Перенести в `docs/mockups/` или удалить.
- **AGENTS.md** ссылается на `node_modules/next/dist/docs/` — такой директории нет в Next.js 16.
- **CLAUDE.md** практически пустой (только `@AGENTS.md`).
- **AppSetting** модель в БД есть, Server Actions для неё написаны, но в реальном flow приложения не используется (системные промпты грузятся из `prompt-constants.ts`, а не из БД).

---

## 10. Куда смотреть, чтобы что-то поменять

### «Хочу добавить новое поле персонажу»

1. Открой `src/lib/schema.ts`
2. Найди нужную секцию в `CHARACTER_SCHEMA`
3. Добавь объект поля: `{ id: 'newField', label: 'Новое поле', placeholder: '...', type: 'textarea' }`
4. Всё. CharacterForm, AI-промпты, экспорт — подхватят автоматически.

### «Хочу добавить четвёртого AI-провайдера (например, Anthropic)»

1. `src/lib/ai/provider.ts` — добавь case в `PROVIDER_CONFIGS` и реализуй `anthropicChat()`
2. `src/lib/ai/useAiSettings.ts` — добавь модели в `PROVIDER_MODELS` и лейбл в `PROVIDER_LABELS`
3. `src/types/character.ts` — расширь тип `AiProvider` (если есть)

### «Хочу изменить системный промпт для AI-заполнения»

1. `src/lib/ai/prompt-constants.ts` — `DEFAULT_FILL_SYSTEM_PROMPT`
2. Или: открой приложение → панель промптов (Ctrl+/) → отредактируй → сохрани в БД

### «Хочу починить production build»

1. Найди страницу preview (вероятно `src/app/character/[id]/preview/page.tsx`)
2. Добавь `export const dynamic = 'force-dynamic';`
3. `npm run build` — проверь

### «Хочу понять, как работает SSE-стриминг»

Прочитай три файла по порядку:
1. `src/lib/ai/streamUtils.ts` — обёртка `ReadableStream → SSE`
2. `src/app/api/ai/analyze/route.ts` — как API-роут использует streamUtils
3. `src/hooks/useCharacterAnalysis.ts` — как клиент читает SSE-поток с буферизацией

---

## A. Быстрые ссылки

| Ресурс | Путь |
|--------|------|
| README | `/README.md` |
| Схема персонажа | `src/lib/schema.ts` |
| Server Actions | `src/lib/actions.ts` |
| AI-провайдеры | `src/lib/ai/provider.ts` |
| Промпты | `src/lib/ai/prompt-constants.ts` |
| Документация | `docs/` (6 файлов) |
| Переменные окружения | `.env.example` |
| CI/CD | `.github/workflows/ci.yml` |
| Docker | `Dockerfile`, `docker-compose.yml` |
