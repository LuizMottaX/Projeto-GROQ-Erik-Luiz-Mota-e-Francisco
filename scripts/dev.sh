#!/usr/bin/env bash
# Sobe banco, backend (:3000) e frontend (:5173) para desenvolvimento.
# Ctrl+C encerra backend e frontend (o banco continua rodando).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

"$ROOT/scripts/db-up.sh"

pids=()
cleanup() {
  for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
}
trap cleanup EXIT INT TERM

if [[ -f backend/package.json ]]; then
  (cd backend && npm run start:dev) &
  pids+=($!)
else
  echo "• backend/ ainda não inicializado, pulando."
fi

if [[ -f frontend/package.json ]]; then
  (cd frontend && npm run dev) &
  pids+=($!)
else
  echo "• frontend/ ainda não inicializado, pulando."
fi

if [[ ${#pids[@]} -gt 0 ]]; then
  wait
fi
