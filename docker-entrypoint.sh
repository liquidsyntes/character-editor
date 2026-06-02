#!/bin/sh
set -e

# Ожидаем, пока директория /app/prisma/data будет доступна (если примонтирована)
mkdir -p /app/prisma/data

# Применяем миграции (db push безопасно применять для SQLite)
echo "Running Prisma db push..."
npx prisma db push --accept-data-loss

echo "Starting Next.js server..."
exec "$@"
