#!/bin/bash
set -e

echo "🚀 Starting application..."

# Initialize database
echo "📦 Initializing database..."
python app/db/init_db.py

# Start the application
echo "🌐 Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
