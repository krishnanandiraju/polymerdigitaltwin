#!/usr/bin/env bash
# =============================================================================
# scripts/demo/stop.sh
# Stop the Manufacturing Digital Twin demo (backend + frontend).
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_DIR="${ROOT}/.demo-pids"

BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

stopped_any=false

stop_pid_file() {
    local label="$1"
    local pid_file="$2"

    if [[ -f "$pid_file" ]]; then
        local pid
        pid="$(cat "$pid_file")"
        if kill -0 "$pid" 2>/dev/null; then
            echo "  🛑  Stopping $label (PID $pid)…"
            kill "$pid" 2>/dev/null || true
            # Give it up to 5 s to die gracefully
            for _ in $(seq 1 10); do
                kill -0 "$pid" 2>/dev/null || break
                sleep 0.5
            done
            # Force if still alive
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            echo "     ✅  $label stopped."
        else
            echo "  ℹ️   $label PID $pid is not running (stale PID file)."
        fi
        rm -f "$pid_file"
        stopped_any=true
    fi
}

# ── Stop by PID file ──────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  🏭  Manufacturing Digital Twin  —  Stopping Demo"
echo "══════════════════════════════════════════════════════════"
echo ""

stop_pid_file "Backend (FastAPI)"  "$BACKEND_PID_FILE"
stop_pid_file "Frontend (Vite)"    "$FRONTEND_PID_FILE"

# ── Fallback: kill by port (in case PID files are missing) ────────────────────
kill_port() {
    local port="$1"
    local label="$2"
    local pids
    pids="$(lsof -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
        echo "  🔍  Found leftover process on :$port ($label) — killing…"
        # shellcheck disable=SC2086
        kill $pids 2>/dev/null || kill -9 $pids 2>/dev/null || true
        echo "     ✅  Done."
        stopped_any=true
    fi
}

kill_port 8000 "FastAPI backend"
kill_port 5173 "Vite frontend"

echo ""
if $stopped_any; then
    echo "  ✅  Demo stopped."
else
    echo "  ℹ️   Demo was not running."
fi
echo "══════════════════════════════════════════════════════════"
echo ""
