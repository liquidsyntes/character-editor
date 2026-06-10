# Character Card Editor — Agent Instructions

Ты работаешь над Character Card Editor — веб-приложением для создания карточек персонажей с AI-автозаполнением.

## Главное правило

Перед любой работой читай:
1. `docs/project-context.md` — цель, стек, критические файлы
2. `docs/architecture.md` — модули, data flow, паттерны
3. `docs/current-state.md` — что сломано, риски, тесты

Не полагайся только на свою память или скиллы — они могут устареть. Код первичен.

## Как работать с проектом

- **Стек:** Next.js 16 (App Router), Prisma 7 + SQLite (libsql), Vercel AI SDK 6, Tailwind 3
- **Запуск:** `npm run dev` → localhost:3000
- **Билд:** `npm run build` (TypeScript + ESLint)
- **Тесты:** `npm test` (Vitest)
- **WSL-питфол:** если падает с `@libsql/linux-x64-gnu` → `npm install @libsql/linux-x64-gnu`

## Добавление AI-модели

Обновлять **два** файла (не один!):
1. `src/lib/ai/useAiSettings.ts` — массив `PROVIDER_MODELS` (UI-селектор)
2. `src/lib/ai/provider.ts` — `PROVIDER_CONFIGS[provider].models` (серверная валидация)

## Git workflow

Строго по `docs/git-workflow.md`:
- Одна задача = одна ветка (`feat/...`, `fix/...`, `refactor/...`, `chore/...`)
- Никогда не коммитить в main напрямую
- `git merge --no-ff` при вливании
- Влил → удалил ветку

## Git workflow

Строго по `docs/git-workflow.md`:
- Одна задача = одна ветка (`feat/`, `fix/`, `refactor/`, `chore/`)
- Никогда не коммитить в main напрямую
- `git merge --no-ff` при вливании
- Влил → удалил ветку

## Стиль кода

- TypeScript strict mode
- ESLint: next/core-web-vitals + next/typescript
- Компоненты: 'use client' где нужно состояние
- Server Actions в `src/lib/actions.ts`
- API-роуты в `src/app/api/`
- Русские UI-лейблы, английский код

## Файлы, которые нельзя ломать

- `prisma/schema.prisma` — схема БД
- `src/lib/schema.ts` — 145 полей персонажа (24 секции)
- `src/lib/ai/provider.ts` — абстракция AI-провайдеров
- `src/lib/actions.ts` — все Server Actions

## В конце задачи
- После каких либо измений в любом из файлов в конце сообщения, сгенерируй мне кратко текст для комита, на русском языке.
- Сам коммит не делай, только выдай текст