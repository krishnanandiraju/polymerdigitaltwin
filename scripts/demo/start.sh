#!/usr/bin/env bash
# =============================================================================
# scripts/demo/start.sh
# Start the Manufacturing Digital Twin demo (backend + frontend).
# Works in GitHub Codespaces and local Linux/macOS terminals.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_DIR="${ROOT}/.demo-pids"
mkdir -p "$PID_DIR"

BACKEND_PORT="${BACKEND_PORT:-${API_PORT:-8000}}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_HOST="${BACKEND_HOST:-0.0.0.0}"
FRONTEND_HOST="${FRONTEND_HOST:-0.0.0.0}"
BACKEND_TARGET="${BACKEND_TARGET:-http://localhost:${BACKEND_PORT}}"

BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"
BACKEND_LOG="$PID_DIR/backend.log"
FRONTEND_LOG="$PID_DIR/frontend.log"

# ── helpers ──────────────────────────────────────────────────────────────────
is_running() {
    local pid_file="$1"
    [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

port_free() {
    ! (ss -tlnp 2>/dev/null | grep -q ":${1} " || lsof -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null)
}

# ── guard: already running? ───────────────────────────────────────────────────
if is_running "$BACKEND_PID_FILE" || is_running "$FRONTEND_PID_FILE"; then
    echo "⚠️  Demo is already running. Use 'scripts/demo/status.sh' for details."
    exit 0
fi

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  🏭  Manufacturing Digital Twin  —  Starting Demo"
echo "══════════════════════════════════════════════════════════"

# ── Backend (FastAPI / uvicorn) ───────────────────────────────────────────────
echo ""
echo "▶  Starting Backend (FastAPI on :${BACKEND_PORT})…"

if ! port_free "$BACKEND_PORT"; then
    echo "   ⚠️  Port ${BACKEND_PORT} already in use — skipping backend start."
else
    cd "$ROOT/backend"
    nohup python -m uvicorn main:app \
        --host "$BACKEND_HOST" \
        --port "$BACKEND_PORT" \
        --reload \
        > "$BACKEND_LOG" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    echo "   ✅ Backend PID $(cat "$BACKEND_PID_FILE")  →  Log: $BACKEND_LOG"
fi

# ── Frontend (Vite / React) ───────────────────────────────────────────────────
echo ""
echo "▶  Starting Frontend (Vite on :${FRONTEND_PORT})…"

if ! port_free "$FRONTEND_PORT"; then
    echo "   ⚠️  Port ${FRONTEND_PORT} already in use — skipping frontend start."
else
    cd "$ROOT/frontend"
    nohup env VITE_BACKEND_TARGET="$BACKEND_TARGET" npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" \
        > "$FRONTEND_LOG" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
    echo "   ✅ Frontend PID $(cat "$FRONTEND_PID_FILE")  →  Log: $FRONTEND_LOG"
fi

# ── Codespaces awareness ──────────────────────────────────────────────────────
echo ""
if [[ -n "${CODESPACE_NAME:-}" ]]; then
    FRONTEND_URL="https://${CODESPACE_NAME}-${FRONTEND_PORT}.app.github.dev"
    BACKEND_URL="https://${CODESPACE_NAME}-${BACKEND_PORT}.app.github.dev"
    echo "  🚀  Running inside GitHub Codespaces!"
    echo ""
    echo "  Dashboard  →  $FRONTEND_URL"
    echo "  API docs   →  $BACKEND_URL/docs"
    echo ""
    echo "  ℹ️  If the ports panel shows visibility as 'Private', right-click"
    echo "     the port and choose 'Port Visibility → Public' for sharing."
else
    echo "  Dashboard  →  http://localhost:${FRONTEND_PORT}"
    echo "  API docs   →  http://localhost:${BACKEND_PORT}/docs"
fi

echo ""
echo "  To stop:   bash scripts/demo/stop.sh   (or: make demo-stop)"
echo "══════════════════════════════════════════════════════════"
echo ""
