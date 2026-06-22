#!/bin/sh
set -e

# Ensure data directory exists
mkdir -p /app/prisma/data

# Apply database schema (pass URL explicitly for Prisma 7)
echo "=== Running Prisma db push..."
prisma db push --url="${DATABASE_URL}" --accept-data-loss

echo "=== Starting Character Editor..."
exec "$@"
