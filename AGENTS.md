# Welcome, AI Agent!

To get up to speed with this project (Character Editor), you MUST read the following files before making changes:
1. `GEMINI.md` - Core project guidelines, stack info, and AI-specific rules.
2. `docs/roadmap.md` - The current tasks, backlog, and roadmap.
3. `docs/current-state.md` - The latest project status.
4. `docs/character-schema.json` - The schema definition for character fields.


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


