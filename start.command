#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

PIDS_DIR="$ROOT_DIR/.pids"
BACKEND_PID_FILE="$PIDS_DIR/backend.pid"
FRONTEND_PID_FILE="$PIDS_DIR/frontend.pid"
BACKEND_LOG="$PIDS_DIR/backend.log"
FRONTEND_LOG="$PIDS_DIR/frontend.log"
BACKEND_URL="http://localhost:8787"
FRONTEND_URL="http://localhost:5173"
SERVER_ENV_FILE="$ROOT_DIR/server/.env"
MAX_BACKEND_RETRIES=2

mkdir -p "$PIDS_DIR"

ensure_refs_dir() {
  mkdir -p "$ROOT_DIR/refs"
  mkdir -p "$ROOT_DIR/public/refs"

  # Keep /refs path available for python http.server from project root.
  if [[ -d "$ROOT_DIR/public/refs" ]]; then
    cp -R "$ROOT_DIR/public/refs/." "$ROOT_DIR/refs/" 2>/dev/null || true
  fi
}

cleanup_started() {
  if [[ -f "$BACKEND_PID_FILE" ]]; then
    local bpid
    bpid="$(cat "$BACKEND_PID_FILE" 2>/dev/null || true)"
    if [[ -n "${bpid}" ]] && kill -0 "$bpid" 2>/dev/null; then
      kill "$bpid" 2>/dev/null || true
    fi
    rm -f "$BACKEND_PID_FILE"
  fi

  if [[ -f "$FRONTEND_PID_FILE" ]]; then
    local fpid
    fpid="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)"
    if [[ -n "${fpid}" ]] && kill -0 "$fpid" 2>/dev/null; then
      kill "$fpid" 2>/dev/null || true
    fi
    rm -f "$FRONTEND_PID_FILE"
  fi
}

is_running() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "${pid}" ]] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

wait_for_http_ok() {
  local url="$1"
  local retries="${2:-15}"
  local i
  for ((i=1; i<=retries; i++)); do
    if curl -sSf "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

start_backend_with_retry() {
  local attempt=0
  local total_attempts=$((MAX_BACKEND_RETRIES + 1))

  while (( attempt < total_attempts )); do
    attempt=$((attempt + 1))
    echo "Запуск backend: попытка $attempt/$total_attempts"

    (
      cd "$ROOT_DIR/server"
      npm run dev
    ) >>"$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    echo "$BACKEND_PID" > "$BACKEND_PID_FILE"

    sleep 2

    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
      echo "Backend завершился сразу после старта (попытка $attempt)."
      rm -f "$BACKEND_PID_FILE"
      continue
    fi

    if wait_for_http_ok "$BACKEND_URL/health" 15; then
      echo "Backend health-check пройден."
      return 0
    fi

    echo "Backend health-check не пройден (попытка $attempt). Перезапуск..."
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
      kill "$BACKEND_PID" 2>/dev/null || true
      sleep 1
      if kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill -9 "$BACKEND_PID" 2>/dev/null || true
      fi
    fi
    rm -f "$BACKEND_PID_FILE"
  done

  return 1
}

echo "Шаг 1/5: Проверка окружения (node, npm, python3, server/.env)"
for cmd in node npm python3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Ошибка: команда '$cmd' не найдена."
    echo "Установите зависимости и запустите ./start.command снова."
    exit 1
  fi
done

if [[ ! -f "$SERVER_ENV_FILE" ]]; then
  echo "Ошибка: не найден файл server/.env"
  echo "Создайте server/.env и вставьте ключ:"
  echo "OPENAI_API_KEY=sk-..."
  exit 1
fi

if ! grep -qE '^[[:space:]]*OPENAI_API_KEY[[:space:]]*=' "$SERVER_ENV_FILE"; then
  echo "Ошибка: в server/.env нет строки OPENAI_API_KEY="
  echo "Добавьте в server/.env:"
  echo "OPENAI_API_KEY=sk-..."
  exit 1
fi

echo "Шаг 2/5: Очистка старых процессов"
if [[ -x "$ROOT_DIR/stop.command" ]]; then
  "$ROOT_DIR/stop.command" >/dev/null 2>&1 || true
fi
# stop.command может удалить .pids, поэтому создаём заново перед логами/PID.
mkdir -p "$PIDS_DIR"

echo "Шаг 3/5: Подготовка статических папок refs/"
ensure_refs_dir

echo "Шаг 4/5: Установка backend-зависимостей (если нужно)"
if [[ ! -d "$ROOT_DIR/server/node_modules" ]]; then
  (
    cd "$ROOT_DIR/server"
    npm install
  )
else
  echo "Зависимости backend уже установлены."
fi

echo "Шаг 5/5: Запуск backend и frontend"
echo "==== $(date '+%Y-%m-%d %H:%M:%S') start.command run ====" >>"$BACKEND_LOG"
echo "==== $(date '+%Y-%m-%d %H:%M:%S') start.command run ====" >>"$FRONTEND_LOG"

if ! start_backend_with_retry; then
  echo "Ошибка: backend не удалось поднять после повторных попыток."
  echo "Лог: $BACKEND_LOG"
  tail -n 40 "$BACKEND_LOG" 2>/dev/null || true
  cleanup_started
  exit 1
fi

python3 -m http.server 5173 >>"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$FRONTEND_PID_FILE"

sleep 2

if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
  echo "Ошибка: frontend не запустился."
  echo "Лог: $FRONTEND_LOG"
  tail -n 30 "$FRONTEND_LOG" 2>/dev/null || true
  cleanup_started
  exit 1
fi

echo "Шаг 6/6: Health-check backend и frontend"
if ! curl -s "$BACKEND_URL/health" >/dev/null 2>&1; then
  echo "Ошибка: backend недоступен ($BACKEND_URL/health)."
  echo "Лог: $BACKEND_LOG"
  tail -n 30 "$BACKEND_LOG" 2>/dev/null || true
  cleanup_started
  exit 1
fi

echo "Открываю браузер: $FRONTEND_URL"
if command -v open >/dev/null 2>&1; then
  open "$FRONTEND_URL" || true
fi

echo "Готово: backend и frontend запущены."
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Логи: $PIDS_DIR"
