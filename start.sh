#!/bin/bash

echo "================================"
echo "Telegram Word Game - Launcher"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "[ERROR] File .env not found!"
    echo ""
    echo "Please create .env file:"
    echo "1. Copy .env.example to .env"
    echo "2. Add your BOT_TOKEN from @BotFather"
    echo "3. Add your WEB_APP_URL"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "[INFO] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies"
        exit 1
    fi
    echo ""
fi

echo "[INFO] Starting server..."
echo ""
echo "Server will run on http://localhost:3000"
echo ""
echo "Commands:"
echo "- Ctrl+C to stop server"
echo "- Open http://localhost:3000 in browser to test"
echo ""
echo "================================"
echo ""

npm start
