#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
#  dev.sh  —  Start backend (port 3001) + frontend (port 3000)
#  Usage: ./dev.sh
# ─────────────────────────────────────────────────────────────────

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/fintech-landing"

echo "🧹  Killing any stale node processes on ports 3000 / 3001..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
sleep 1

echo "🚀  Starting backend on :3001..."
cd "$BACKEND" && npm run dev &
BACKEND_PID=$!

echo "⏳  Waiting for backend to be ready..."
for i in {1..20}; do
  if curl -s http://localhost:3001/api/auth/me > /dev/null 2>&1 || \
     curl -o /dev/null -s -w "%{http_code}" http://localhost:3001/api/auth/register | grep -q "^[2-4]"; then
    echo "✅  Backend is up!"
    break
  fi
  sleep 1
done

echo "🎨  Starting frontend on :3000..."
cd "$FRONTEND" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Backend  → http://localhost:3001/api"
echo "  Frontend → http://localhost:3000"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Press Ctrl+C to stop both"
echo ""

# Wait for both processes; kill both on Ctrl+C
trap "echo '🛑 Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait $BACKEND_PID $FRONTEND_PID
