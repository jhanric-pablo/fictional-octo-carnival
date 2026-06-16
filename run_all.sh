#!/bin/bash

# Smart Stray - Unified Startup Script
# This script runs the Backend, Frontend, and AI Service.

echo "------------------------------------------------"
echo "Cleaning up old processes to free ports..."
# Stronger port kill to ensure Vite starts on 3000
killall -9 node python python3 tsx 2>/dev/null || true
lsof -ti:3000,3001,5000 | xargs kill -9 2>/dev/null || true
sleep 1
echo "------------------------------------------------"

PREV_URL=""
if [ -f .env ]; then
  PREV_URL=$(grep "^VITE_COLAB_URL=" .env | cut -d'=' -f2-)
fi

if [ -n "$PREV_URL" ]; then
  echo "Previous Colab URL found: $PREV_URL"
  read -p "Press Enter to reuse previous URL, or paste a new one: " NEW_URL
  if [ -z "$NEW_URL" ]; then
    COLAB_URL="$PREV_URL"
  else
    COLAB_URL="$NEW_URL"
  fi
else
  read -p "Paste your Colab URL here and press Enter: " COLAB_URL
fi

# Save the URL to an environment variable file so Vite can read it automatically
echo "VITE_COLAB_URL=$COLAB_URL" > .env

echo "------------------------------------------------"
echo "Initializing Smart Stray System..."
echo "------------------------------------------------"

# 1. Install Python dependencies for AI Service
echo "[1/4] Installing Python dependencies..."
pip install flask flask-cors pyjwt bcrypt requests google-generativeai --quiet

# 2. Seed Database (Ensures demo data is present)
echo "[2/4] Initializing database with demo data..."
npx tsx server/seed.ts

# 3. Start Unified Python Flask Backend in background
echo "[3/4] Launching Unified Flask Backend & AI Service (Port 5000)..."
python3 ai_service.py 2>&1 | sed 's/^/[BACKEND] /' &
AI_PID=$!

# 4. Express Server Disabled (Now handled by unified Flask on Port 5000)
echo "[4/4] Express server retired. All routing moves to Python..."

# 5. Start Frontend Development Server
echo "------------------------------------------------"
echo "Launching Frontend... (Port 3000)"
echo "------------------------------------------------"
echo "SERVICES ARE RUNNING:"
echo " - Frontend: http://localhost:3000"
echo " - Backend:  http://localhost:5000"
echo " - AI Link:  $COLAB_URL"
echo "------------------------------------------------"
echo "LIVE SYSTEM LOGS:"

# Run frontend in foreground but also pipe its output with a prefix
npm run dev 2>&1 | sed 's/^/[FRONTEND] /'

# Cleanup background processes on exit
trap "kill $AI_PID" EXIT
