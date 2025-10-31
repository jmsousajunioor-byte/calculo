#!/usr/bin/env bash
set -euo pipefail

# Resolve project root (script lives in scripts/)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Default port can be overridden with PORT env var.
PORT="${PORT:-8080}"

# Best-effort detection of WSL host IP for convenience messages.
DETECTED_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"

echo "Starting PHP built-in server for Cálculo Judiciário..."
echo "Document root: ${ROOT_DIR}/public"
echo "Listening on: 0.0.0.0:${PORT}"
if [[ -n "${DETECTED_IP}" ]]; then
  echo "If you're on the same network, try: http://${DETECTED_IP}:${PORT}"
fi
echo "Override PORT by running: PORT=9090 $(basename "$0")"
echo

cd "${ROOT_DIR}/public"
exec php -S "0.0.0.0:${PORT}"
