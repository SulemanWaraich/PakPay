#!/bin/sh
set -e

echo "Running Prisma migrations with DATABASE_URL..."
npm run db:migrate

echo "Starting application with Accelerate..."
exec "$@"
