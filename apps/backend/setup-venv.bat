@echo off
REM Setup script for local Python virtual environment on Windows

echo Setting up Python virtual environment for Rate the Washroom API...

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.11 or higher from https://python.org
    pause
    exit /b 1
)

REM Create virtual environment
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

REM Install dependencies
echo Installing dependencies...
if "%1"=="dev" (
    echo Installing development dependencies...
    pip install -e ".[dev]"
) else (
    echo Installing production dependencies...
    pip install -e .
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
        echo # Database
        echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rate_the_washroom
        echo.
        echo # Security
        echo SECRET_KEY=your-secret-key-change-in-production
        echo ALGORITHM=HS256
        echo ACCESS_TOKEN_EXPIRE_MINUTES=30
        echo.
        echo # API
        echo API_V1_STR=/api/v1
        echo PROJECT_NAME=Rate the Washroom
        echo.
        echo # CORS
        echo BACKEND_CORS_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
        echo.
        echo # Environment
        echo ENVIRONMENT=development
        echo DEBUG=true
    ) > .env
    echo Created .env file with default values. Please update as needed.
)

echo.
echo ✅ Virtual environment setup complete!
echo.
echo To activate the virtual environment:
echo   venv\Scripts\activate.bat
echo.
echo To run the development server:
echo   uvicorn app.main:app --reload
echo.
echo To run tests:
echo   pytest
echo.
echo To run linting:
echo   black .
echo   isort .
echo   flake8 .
echo.
pause
