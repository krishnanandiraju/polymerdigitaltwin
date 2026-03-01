#!/usr/bin/env bash
# =============================================================================
# scripts/demo/start.sh
# Start the Manas Polymers Digital Twin demo (backend + frontend).
# Works in GitHub Codespaces and local Linux/macOS terminals.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_DIR="${ROOT}/.demo-pids"
mkdir -p "$PID_DIR"

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
echo "  🏭  Manas Polymers Digital Twin  —  Starting Demo"
echo "══════════════════════════════════════════════════════════"

# ── Backend (FastAPI / uvicorn) ───────────────────────────────────────────────
echo ""
echo "▶  Starting Backend (FastAPI on :8000)…"

if ! port_free 8000; then
    echo "   ⚠️  Port 8000 already in use — skipping backend start."
else
    cd "$ROOT/backend"
    nohup python -m uvicorn main:app \
        --host 0.0.0.0 \
        --port 8000 \
        --reload \
        > "$BACKEND_LOG" 2>&1 &
    echo $! > "$BACKEND_PID_FILE"
    echo "   ✅ Backend PID $(cat "$BACKEND_PID_FILE")  →  Log: $BACKEND_LOG"
fi

# ── Frontend (Vite / React) ───────────────────────────────────────────────────
echo ""
echo "▶  Starting Frontend (Vite on :5173)…"

if ! port_free 5173; then
    echo "   ⚠️  Port 5173 already in use — skipping frontend start."
else
    cd "$ROOT/frontend"
    nohup npm run dev -- --host 0.0.0.0 --port 5173 \
        > "$FRONTEND_LOG" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
    echo "   ✅ Frontend PID $(cat "$FRONTEND_PID_FILE")  →  Log: $FRONTEND_LOG"
fi

# ── Codespaces awareness ──────────────────────────────────────────────────────
echo ""
if [[ -n "${CODESPACE_NAME:-}" ]]; then
    FRONTEND_URL="https://${CODESPACE_NAME}-5173.app.github.dev"
    BACKEND_URL="https://${CODESPACE_NAME}-8000.app.github.dev"
    echo "  🚀  Running inside GitHub Codespaces!"
    echo ""
    echo "  Dashboard  →  $FRONTEND_URL"
    echo "  API docs   →  $BACKEND_URL/docs"
    echo ""
    echo "  ℹ️  If the ports panel shows visibility as 'Private', right-click"
    echo "     the port and choose 'Port Visibility → Public' for sharing."
else
    echo "  Dashboard  →  http://localhost:5173"
    echo "  API docs   →  http://localhost:8000/docs"
fi

echo ""
echo "  To stop:   bash scripts/demo/stop.sh   (or: make demo-stop)"
echo "══════════════════════════════════════════════════════════"
echo ""
