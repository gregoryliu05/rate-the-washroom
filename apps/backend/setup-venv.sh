#!/bin/bash
# Setup script for local Python virtual environment

set -e

echo "Setting up Python virtual environment for Rate the Washroom API..."

# Check if Python 3.11+ is available
python_version=$(python3 --version 2>&1 | grep -o '[0-9]\+\.[0-9]\+' | head -1)
required_version="3.11"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "Error: Python 3.11 or higher is required. Found: $python_version"
    exit 1
fi

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
if [ "$1" = "dev" ]; then
    echo "Installing development dependencies..."
    pip install -e ".[dev]"
else
    echo "Installing production dependencies..."
    pip install -e .
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rate_the_washroom

# Security
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API
API_V1_STR=/api/v1
PROJECT_NAME=Rate the Washroom

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]

# Environment
ENVIRONMENT=development
DEBUG=true
EOF
    echo "Created .env file with default values. Please update as needed."
fi

echo ""
echo "✅ Virtual environment setup complete!"
echo ""
echo "To activate the virtual environment:"
echo "  source venv/bin/activate"
echo ""
echo "To run the development server:"
echo "  uvicorn app.main:app --reload"
echo ""
echo "To run tests:"
echo "  pytest"
echo ""
echo "To run linting:"
echo "  black ."
echo "  isort ."
echo "  flake8 ."
echo ""
