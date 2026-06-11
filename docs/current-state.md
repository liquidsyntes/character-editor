# Current State

## Что уже сделано

- [x] CRUD персонажей (createCharacter, updateCharacter, deleteCharacter, duplicateCharacter, archiveCharacter)
- [x] CRUD проектов (createProject, updateProject, deleteProject, archiveProject)
- [x] 145 полей персонажа в 24 секциях (схема: `src/lib/schema.ts`)
- [x] AI-заполнение всей формы и посекционно (кнопка ✨ на каждой секции)
- [x] AI-анализ персонажа на противоречия/клише/пробелы
- [x] AI-исправление найденных проблем (индивидуально/скопом)
- [x] Word-level diff перед применением AI-изменений (DiffModal)
- [x] SSE-стриминг в fill и analyze API-роутах
- [x] Staged/Apply паттерн для AI-настроек
- [x] Rate limiting (DB-backed) на AI API-роутах
- [x] Экспорт в Markdown (ExportModal)
- [x] Предпросмотр карточки (character/[id]/preview)
- [x] История AI-анализов (AnalyzeHistorySidebar)
- [x] Редактор системных промптов (SystemPromptsEditor — задекларирован)
- [x] 3 unit-теста: prompt.test.ts, fill/route.test.ts, analyze/route.test.ts
- [x] ESLint strict + TypeScript strict
- [x] Tailwind с кастомной Material Design цветовой схемой
- [x] Material Symbols иконки
- [x] 2 миграции Prisma (init + add_projects)
- [x] Безопасное хранение API-ключей в HttpOnly cookies
- [x] Поддержка reasoning-моделей (стриминг мыслей, защита от таймаутов)
- [x] Мультипровайдерная архитектура (DeepSeek, xAI, OpenAI, Anthropic, Gemini, OpenRouter)
- [x] Каскадный UI выбора провайдера/модели в TweaksPanel

## Что не сделано / отсутствует

- [x] Аутентификация (NextAuth)
- [x] Валидация .env-переменных при старте
- [x] Docker / docker-compose
- [x] CI/CD (GitHub Actions)
- [x] `.env.example` — добавлен как шаблон
- [x] Тесты для `/api/ai/analyze/fix`
- [x] Тесты для Server Actions
- [x] Тесты компонентов (UI)
- [x] Транзакционная целостность (атомарные Prisma-запросы)

## Риски и проблемные места

### 🔴 Критичные
- Критические ошибки сборки (npm run build) и TypeScript устранены. Нет активных критических проблем на данный момент.

### 🟡 Значимые
- **Дублирование SSE-логики** — `fill/route.ts` и `analyze/route.ts` содержат почти идентичный код (Хотя часть уже абстрагирована)
- **Prisma 7.8.0** и **Vercel AI SDK 6** — свежие мажорные версии, риск breaking changes

### 🟢 Некритичные
- **AppSetting** в Prisma активно используется для хранения настроек (в т.ч. системных промптов в `SystemPromptsEditor`).
- **xAI и OpenAI** задекларированы но нет ключей в .env — не тестировались
- **Отсутствует CORS** в API-роутах (для локального использования ок)
- **SystemPromptsEditor** — неясно, сохраняются ли промпты между сессиями

## Покрытие тестами

| Файл | Что тестирует |
|------|--------------|
| `src/lib/ai/prompt.test.ts` | parseFillResponse, parseAnalyzeResponse (4 теста) |
| `src/app/api/ai/fill/route.test.ts` | Валидация, non-stream, stream (3 теста) |
| `src/app/api/ai/analyze/fix/route.test.ts` | Валидация (2 теста) |
| `src/lib/actions.test.ts` | Валидация и безопасность (3 теста) |
| `src/components/CharacterFormHeader.test.tsx` | UI, обработка событий, рендер состояний (5 тестов) |
| `src/components/CharacterFormSummary.test.tsx` | UI, расчет прогресса, рендер данных (4 теста) |

**Не покрыто:** provider.ts, остальные сложные UI компоненты (DiffModal, AnalyzePanel).

## Состояние зависимостей

Все зависимости актуальны (май 2026), но мажорные версии свежие:
- Prisma 7 (вышла ~апрель 2026)
- Vercel AI SDK 6
- Next.js 16
- React 19

При обновлении любой из них — высокая вероятность breaking changes.
