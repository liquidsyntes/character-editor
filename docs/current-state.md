# Current State

## Что уже сделано

- [x] CRUD персонажей (createCharacter, updateCharacter, deleteCharacter, duplicateCharacter, archiveCharacter)
- [x] CRUD проектов (createProject, updateProject, deleteProject, archiveProject)
- [x] Более 145 полей персонажа в 24 секциях (включая новые `coreValue` и `vibeOrMood` в `src/lib/schema.ts`)
- [x] AI-заполнение всей формы и посекционно (кнопка ✨ на каждой секции)
- [x] AI-анализ персонажа на противоречия/клише/пробелы
- [x] AI-исправление найденных проблем (индивидуально/скопом)
- [x] Word-level diff перед применением AI-изменений (DiffModal)
- [x] SSE-стриминг в fill и analyze API-роутах
- [x] Staged/Apply паттерн для AI-настроек
- [x] Rate limiting **(SQLite-backed, персистентный)** на AI API-роутах
- [x] Экспорт в Markdown, JSON, Text, Obsidian (Dataview) и SillyTavern (Character Card V2)
- [x] Импорт карточек из JSON, Markdown, SillyTavern на дашборде и в редакторе
- [x] Предпросмотр карточки (character/[id]/preview)
- [x] История AI-анализов (AnalyzeHistorySidebar)
- [x] Редактор системных промптов (SystemPromptsEditor с реальным сохранением в базу `AppSetting`)
- [x] Проходят все 37 юнит-тестов (Vitest), полное отсутствие ошибок линтера (0 errors, 0 warnings) и TypeScript
- [x] Tailwind с кастомной Material Design цветовой схемой
- [x] Безопасное хранение API-ключей в HttpOnly cookies
- [x] Поддержка reasoning-моделей (стриминг мыслей, защита от таймаутов)
- [x] Мультипровайдерная архитектура (DeepSeek, xAI, OpenAI, Anthropic, Gemini, OpenRouter)
- [x] Каскадный UI выбора провайдера/модели в TweaksPanel
- [x] Отдельные UI компоненты для боковой панели: `CharacterSidebar.tsx`, `QuickCommands.tsx`
- [x] Typewriter-эффект с сохранением позиции скролла при авторесайзинге (без "прыжков")
- [x] AI-ужатие (Condense) длинных текстов в полях без потери смысла

## Что не сделано / отсутствует

- [x] Аутентификация (NextAuth)
- [x] Валидация .env-переменных при старте
- [x] Docker / docker-compose (node:22-slim, multi-stage, standalone output, SQLite volume)
- [x] CI/CD (GitHub Actions)
- [x] Тесты для `/api/ai/analyze/fix`
- [x] Тесты для Server Actions
- [ ] Интеграционные сквозные тесты (fill -> diff -> save)
- [ ] Офлайн поддержка или PWA
- [ ] Групповые операции над персонажами

## Риски и проблемные места

### 🔴 Критичные
- Нет активных критических проблем на данный момент. Код собирается без ошибок (`npm run build`, `npm run lint`, `npx tsc --noEmit`).

### 🟡 Значимые
- **Prisma 7.8.0** и **Vercel AI SDK 6** — свежие мажорные версии, риск breaking changes.
- **Дублирование SSE-логики** — `fill/route.ts` и `analyze/route.ts` используют стриминг схожим образом (хоть часть и абстрагирована).

### 🟢 Некритичные
- **Отсутствует CORS** в API-роутах (для локального использования ок).

## Покрытие тестами

| Файл | Что тестирует |
|------|--------------|
| `src/lib/ai/prompt.test.ts` | parseFillResponse, parseAnalyzeResponse (4 теста) |
| `src/app/api/ai/fill/route.test.ts` | Валидация, non-stream, stream (3 теста) |
| `src/app/api/ai/analyze/fix/route.test.ts` | Валидация (2 теста) |
| `src/lib/actions.test.ts` | Валидация и безопасность (3 теста) |
| `src/components/CharacterFormHeader.test.tsx` | UI, обработка событий, рендер состояний (5 тестов) |
| `src/components/CharacterFormSummary.test.tsx` | UI, расчет прогресса, рендер данных (4 теста) |

**Не покрыто:** provider.ts, остальные сложные UI компоненты (DiffModal, AnalyzePanel). Из-за кросс-провайдерных отличий написание тестов для `DiffModal` пока отложено по запросу пользователя.

## Состояние зависимостей

Все зависимости актуальны (май/июнь 2026), но мажорные версии свежие:
- Prisma 7
- Vercel AI SDK 6
- Next.js 16
- React 19
