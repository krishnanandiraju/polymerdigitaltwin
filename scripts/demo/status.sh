#!/usr/bin/env bash
# =============================================================================
# scripts/demo/status.sh
# Show whether the demo is running and which URLs to open.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PID_DIR="${ROOT}/.demo-pids"

BACKEND_PORT="${BACKEND_PORT:-${API_PORT:-8000}}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

is_running() {
    local pid_file="$1"
    [[ -f "$pid_file" ]] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

port_listening() {
    ss -tlnp 2>/dev/null | grep -q ":${1} " || lsof -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null
}

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  🏭  Manufacturing Digital Twin  —  Demo Status"
echo "══════════════════════════════════════════════════════════"
echo ""

# Backend
if is_running "$BACKEND_PID_FILE" && port_listening "$BACKEND_PORT"; then
    BE_PID="$(cat "$BACKEND_PID_FILE")"
    echo "  Backend  (:${BACKEND_PORT})  🟢  RUNNING  (PID $BE_PID)"
elif port_listening "$BACKEND_PORT"; then
    echo "  Backend  (:${BACKEND_PORT})  🟡  PORT IN USE  (started outside this script)"
else
    echo "  Backend  (:${BACKEND_PORT})  🔴  STOPPED"
fi

# Frontend
if is_running "$FRONTEND_PID_FILE" && port_listening "$FRONTEND_PORT"; then
    FE_PID="$(cat "$FRONTEND_PID_FILE")"
    echo "  Frontend (:${FRONTEND_PORT})  🟢  RUNNING  (PID $FE_PID)"
elif port_listening "$FRONTEND_PORT"; then
    echo "  Frontend (:${FRONTEND_PORT})  🟡  PORT IN USE  (started outside this script)"
else
    echo "  Frontend (:${FRONTEND_PORT})  🔴  STOPPED"
fi

echo ""

# Codespaces vs local URLs
if [[ -n "${CODESPACE_NAME:-}" ]]; then
    echo "  🌐  Codespaces URLs:"
    echo "      Dashboard  →  https://${CODESPACE_NAME}-${FRONTEND_PORT}.app.github.dev"
    echo "      API docs   →  https://${CODESPACE_NAME}-${BACKEND_PORT}.app.github.dev/docs"
    echo ""
    echo "  ℹ️   Check the Ports panel (Ctrl+Shift+P → 'Ports: Focus on Ports View')"
    echo "      to manage visibility (Private / Public) for each forwarded port."
else
    echo "  🌐  Local URLs:"
    echo "      Dashboard  →  http://localhost:${FRONTEND_PORT}"
    echo "      API docs   →  http://localhost:${BACKEND_PORT}/docs"
fi

echo ""
echo "  Commands:"
echo "      Start  →  bash scripts/demo/start.sh   (or: make demo)"
echo "      Stop   →  bash scripts/demo/stop.sh    (or: make demo-stop)"
echo "══════════════════════════════════════════════════════════"
echo ""
