#!/bin/bash
# Database migration script for Docker

set -e

echo "Starting database migrations..."

# Wait for database to be ready
echo "Waiting for database connection..."
until pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER; do
    echo "Database is unavailable - sleeping"
    sleep 1
done

echo "Database is ready - proceeding with migrations"

# Run migrations
alembic upgrade head

echo "Migrations completed successfully!"
