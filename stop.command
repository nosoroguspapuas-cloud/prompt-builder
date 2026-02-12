#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PIDS_DIR="$ROOT_DIR/.pids"
BACKEND_PID_FILE="$PIDS_DIR/backend.pid"
FRONTEND_PID_FILE="$PIDS_DIR/frontend.pid"
BACKEND_PORT=8787
FRONTEND_PORT=5173

stop_from_file() {
  local pid_file="$1"
  local name="$2"

  if [[ ! -f "$pid_file" ]]; then
    echo "$name: pid file not found"
    return
  fi

  local pid
  pid="$(cat "$pid_file" 2>/dev/null || true)"
  if [[ -z "${pid}" ]]; then
    echo "$name: empty pid"
    rm -f "$pid_file"
    return
  fi

  if kill -0 "$pid" 2>/dev/null; then
    echo "Stopping $name ($pid)..."
    kill "$pid" 2>/dev/null || true
    sleep 1
    if kill -0 "$pid" 2>/dev/null; then
      echo "$name still running, force stopping..."
      kill -9 "$pid" 2>/dev/null || true
    fi
    echo "$name stopped"
  else
    echo "$name process not running"
  fi

  rm -f "$pid_file"
}

kill_by_port() {
  local port="$1"
  local name="$2"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"

  if [[ -z "$pids" ]]; then
    echo "Port $port was free"
    return
  fi

  local pid
  for pid in $pids; do
    kill -TERM "$pid" 2>/dev/null || true
  done

  sleep 1

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    for pid in $pids; do
      kill -9 "$pid" 2>/dev/null || true
    done
  fi

  local remaining
  remaining="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$remaining" ]]; then
    echo "Killed $name on $port (pid ${pids:-unknown})"
  else
    echo "Failed to fully stop $name on $port (pid $remaining)"
  fi
}

echo "Step 1: stop by PID files (if present)"
stop_from_file "$BACKEND_PID_FILE" "backend"
stop_from_file "$FRONTEND_PID_FILE" "frontend"

echo "Step 2: ensure ports are free"
kill_by_port "$BACKEND_PORT" "backend"
kill_by_port "$FRONTEND_PORT" "frontend"

if [[ -d "$PIDS_DIR" ]]; then
  rm -f "$PIDS_DIR"/*.pid "$PIDS_DIR"/*.log 2>/dev/null || true
fi

echo "Done."
