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
- **Запуск:** `npm run dev` → localhost:4000
- **Билд:** `npm run build` (TypeScript + ESLint)
- **Тесты:** `npm test` (Vitest)
- **WSL-питфол:** если падает с `@libsql/linux-x64-gnu` → `npm install @libsql/linux-x64-gnu`

## Добавление AI-модели

Модели теперь загружаются динамически через единый источник истины (`/api/ai/models`).
Для добавления новой модели достаточно обновить **один** файл:
- `src/lib/ai/models.ts` — добавить нужную модель в массив `PROVIDER_MODELS` для вашего провайдера.

## Git workflow

Строго по `docs/git-workflow.md`:
- Одна задача = одна ветка (`feat/...`, `fix/...`, `refactor/...`, `chore/...`)
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
- `src/lib/ai/models.ts` — единый список моделей для всех провайдеров
- `src/lib/actions.ts` — все Server Actions


Always run `npm run lint` and `npm run build` to verify your changes.

---

## Начало новой задачи

Всегда стартуй от свежего `main`:

```bash
git checkout main
git pull
git checkout -b префикс/название-задачи
```

---

## Во время работы
## В конце каждой задачи

После любых изменений в файлах — в конце своего сообщения сгенерируй краткий текст для коммита на русском языке.

Затем делай коммит чтобы не копить изменения. Использовать `add -p` для точечного выбора изменений:

```bash
git add -p
git commit -m "краткое и понятное описание изменений"
```

> `git add .` тоже допустим, но `add -p` даёт более чистые атомарные коммиты.

---

## Перед merge в main

Подтянуть свежий `main` через `rebase` для линейной истории:

```bash
git checkout main
git pull
git checkout префикс/название-задачи
git rebase main
# Решить конфликты если есть
# Протестировать что всё работает
```

> Альтернатива: `git merge main` вместо `rebase` — оба варианта рабочие.  
> `rebase` даёт чистую линейную историю, `merge` сохраняет контекст параллельной работы.

---

## Влить в main

```bash
git checkout main
git merge --no-ff префикс/название-задачи
git push
```

> `--no-ff` создаёт merge-коммит и сохраняет видимую границу фичи в истории.

---

## Убрать использованную ветку

Локально:

```bash
git branch -d префикс/название-задачи
```

Если ветка была запушена в remote:

```bash
git push origin --delete префикс/название-задачи
```

---

## Проверить историю

```bash
git log --graph --all --decorate --oneline --date-order
```

Или через алиас (добавить в `~/.gitconfig`):

```ini
[alias]
  lg = log --graph --all --decorate --oneline --date-order
```

Тогда достаточно просто:

```bash
git lg
```

---
