#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

"$ROOT_DIR/stop.command" || true
sleep 1
"$ROOT_DIR/start.command"

