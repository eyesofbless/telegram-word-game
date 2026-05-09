@echo off
echo ================================
echo Telegram Word Game - Launcher
echo ================================
echo.

REM Check if .env exists
if not exist .env (
    echo [ERROR] File .env not found!
    echo.
    echo Please create .env file:
    echo 1. Copy .env.example to .env
    echo 2. Add your BOT_TOKEN from @BotFather
    echo 3. Add your WEB_APP_URL
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

echo [INFO] Starting server...
echo.
echo Server will run on http://localhost:3000
echo.
echo Commands:
echo - Ctrl+C to stop server
echo - Open http://localhost:3000 in browser to test
echo.
echo ================================
echo.

call npm start
