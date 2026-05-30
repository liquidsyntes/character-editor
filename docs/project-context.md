# Project Context

## Цель

Веб-приложение для создания, редактирования и AI-автозаполнения карточек персонажей.  
Целевая аудитория: сценаристы, писатели, ролевики, гейм-дизайнеры.  
Замена таблицам и текстовым файлам структурированной формой с AI-ассистентом.

## Текущий стек

| Слой | Технология | Версия |
|------|-----------|--------|
| Фреймворк | Next.js (App Router) | 16.2.6 |
| UI | React | 19.2.4 |
| ORM | Prisma | 7.8.0 |
| БД | SQLite (libsql) | 0.17.3 |
| AI SDK | `ai` (Vercel) | 6.0.193 |
| AI Provider | `@ai-sdk/xai` | 3.0.92 |
| CSS | Tailwind | 3.4.19 |
| Тесты | Vitest | 4.1.7 |
| DIFF | `diff` | 9.0.0 |

**AI-провайдеры:** DeepSeek (основной, ключ в .env), xAI/Grok (задекларирован, без ключа), OpenAI (задекларирован, без ключа).

## Главные архитектурные решения

1. **Server Actions** для CRUD (не отдельные API-роуты) — файл `src/lib/actions.ts`
2. **AI через Vercel AI SDK** — абстракция в `src/lib/ai/provider.ts`, три провайдера
3. **Staged/Apply паттерн** для AI-настроек — `useAiSettings.ts`: staged (черновик) → apply() → saved (активные)
4. **SSE-стриминг** в `/api/ai/fill` и `/api/ai/analyze`
5. **145 полей персонажа** в 24 секциях (см. `src/lib/schema.ts`)
6. **Данные в JSON-поле** `data` таблицы Character (не отдельные колонки)

## Критические файлы

| Файл | Зачем |
|------|-------|
| `src/lib/schema.ts` | 24 секции, 145 полей — определение модели персонажа |
| `prisma/schema.prisma` | Схема БД: Project, Character, AppSetting |
| `src/lib/ai/provider.ts` | AI-провайдеры: DeepSeek, xAI, OpenAI |
| `src/lib/ai/prompt.ts` | Системные промпты, парсеры ответов AI |
| `src/lib/actions.ts` | Все Server Actions (CRUD персонажей и проектов) |
| `src/components/CharacterForm.tsx` | Главный компонент (~37K символов) |
| `src/lib/ai/useAiSettings.ts` | Хук AI-настроек (staged/saved, localStorage) |

## Как запускать

```bash
npm install
npm install @libsql/linux-x64-gnu   # на WSL/Linux
npx prisma migrate dev
npm run dev                         # → localhost:3000
```

## Как тестировать

```bash
npm test          # vitest run (3 теста: prompt.ts, fill/route, analyze/route)
npm run build     # проверка TypeScript + ESLint
```

## Договорённости по стилю

- Git workflow: `docs/git-workflow.md` (ветки, merge --no-ff, не коммитить в main)
- Код на английском, UI-лейблы на русском
- Git workflow: `docs/git-workflow.md` (ветки, merge --no-ff, не коммитить в main)
- `'use client'` только где нужно клиентское состояние
- Новые AI-модели → обновлять 2 файла (useAiSettings.ts + provider.ts)
- Server Actions в `src/lib/actions.ts`, API-роуты в `src/app/api/`
