# Current State

## Что уже сделано

- [x] CRUD персонажей (createCharacter, updateCharacter, deleteCharacter, duplicateCharacter, archiveCharacter)
- [x] CRUD проектов (createProject, updateProject, deleteProject, archiveProject)
- [x] Более 145 полей персонажа в 24 секциях (включая `coreValue` и `vibeOrMood` в `src/lib/schema.ts`)
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
- [x] История AI-анализов (AnalyzeHistorySidebar + модель `AnalysisRecord` в БД)
- [x] Редактор системных промптов (SystemPromptsEditor с реальным сохранением в базу `AppSetting`)
- [x] Проходят все 46 юнит-тестов (Vitest, 9 файлов), полное отсутствие ошибок линтера (0 errors, 0 warnings) и TypeScript
- [x] Tailwind с кастомной Material Design цветовой схемой
- [x] Безопасное хранение API-ключей в HttpOnly cookies
- [x] Поддержка reasoning-моделей (стриминг мыслей, защита от таймаутов)
- [x] Мультипровайдерная архитектура (DeepSeek, xAI, OpenAI, Anthropic, Gemini, OpenRouter)
- [x] Каскадный UI выбора провайдера/модели в TweaksPanel
- [x] Отдельные UI компоненты для боковой панели: `CharacterSidebar.tsx`, `QuickCommands.tsx`
- [x] Typewriter-эффект с сохранением позиции скролла при авторесайзинге (без "прыжков")
- [x] AI-ужатие (Condense) длинных текстов в полях без потери смысла
- [x] Аутентификация (NextAuth) с Credentials-провайдером и авто-регистрацией
- [x] Валидация .env-переменных при старте (Zod-схема в `src/lib/env.ts`)
- [x] Docker / docker-compose (node:22-slim, multi-stage, standalone output, SQLite volume)
- [x] CI/CD (GitHub Actions: lint → test → build)
- [x] Горячие клавиши (хук `useKeyboard.ts`: Ctrl+S, Ctrl+Z, Ctrl+Shift+Z, Ctrl+Enter)
- [x] Речевые паттерны и голос персонажа (VoiceClient, VoiceHeader, VoicePromptsPanel, API-роут `/api/ai/voice`)
- [x] Нарративный модуль (NarrativeClient, NarrativeHeader, NarrativeAnalyzePanel, API-роуты `/api/ai/narrative`, `/api/ai/analyze-narrative`)
- [x] Публичное представление персонажа (PublicClient, PublicHeader, PublicPromptsPanel, API-роут `/api/ai/public`)
- [x] Мировые элементы (WorldElementForm, WorldPromptsPanel, WorldExportModal, API-роут `/api/ai/world`)
- [x] Пошаговый мастер создания персонажа (WizardModal с 11 компонентами + `wizard-config.ts`)
- [x] Единый source of truth для AI-моделей (`models.ts` → `/api/ai/models`)
- [x] Унифицированная SSE-логика (клиент использует `fetchSseStream` из `prompt-parser.ts`)

## Что не сделано / отсутствует

- [ ] Интеграционные сквозные тесты (fill → diff → save)
- [ ] Офлайн поддержка или PWA
- [ ] Групповые операции над персонажами
- [ ] Тестирование DiffModal на разных AI-провайдерах (ручное с реальными ключами)
- [ ] Индикатор автосохранения в хедере
- [ ] Прогресс-бар AI-заполнения (X/Y секций)
- [ ] Тёмная тема без перезагрузки

## Риски и проблемные места

### 🔴 Критичные
- Нет активных критических проблем на данный момент. Код собирается без ошибок (`npm run build`, `npm run lint`, `npx tsc --noEmit`).

### 🟡 Значимые
- **Prisma 7.8.0** и **Vercel AI SDK 6** — свежие мажорные версии, риск breaking changes.

### 🟢 Некритичные
- **Отсутствует CORS** в API-роутах (для локального использования ок).
- Не везде консистентный обработчик ошибок AI — часть роутов использует `routeUtils.ts`, часть нет.

## Покрытие тестами

| Файл | Что тестирует | Тестов |
|------|--------------|--------|
| `src/lib/ai/prompt.test.ts` | parseFillResponse, parseAnalyzeResponse | 4 |
| `src/app/api/ai/fill/route.test.ts` | Валидация, non-stream, stream, wizardAnswers | 4 |
| `src/app/api/ai/analyze/route.test.ts` | Валидация, rate limit, stream | 3 |
| `src/app/api/ai/analyze/fix/route.test.ts` | Валидация | 2 |
| `src/lib/actions.test.ts` | updateProject auth, updateCharacter | 3 |
| `src/lib/ai/provider.test.ts` | resolveApiKey (5 кейсов), createProviderModelInstance (3 кейса), ошибки | 9 |
| `src/components/CharacterFormHeader.test.tsx` | UI, обработка событий, рендер состояний | 5 |
| `src/components/CharacterFormSummary.test.tsx` | UI, расчёт прогресса, рендер данных | 4 |
| `src/components/wizard/WizardModal.test.tsx` | Рендер, навигация, закрытие, генерация | 5 |
| | **Всего** | **46** *(вывод: 9 passed test files)* |

**Не покрыто:** DiffModal, AnalyzePanel, NarrativeClient, VoiceClient, PublicClient (сложные UI с SSE-стримингом).

## Состояние зависимостей

Все зависимости актуальны (июнь 2026), ключевые мажорные версии:
- Prisma 7.8.0
- Vercel AI SDK 6.0.193
- Next.js 16.2.6
- React 19.2.4
- next-auth 4.24.14
- Zod 4.4.3
- Vitest 4.1.7
