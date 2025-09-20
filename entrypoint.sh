#!/bin/sh
set -e

echo "Running Prisma migrations with DATABASE_URL..."
npx prisma migrate deploy

echo "Starting application with Accelerate..."
exec "$@"
