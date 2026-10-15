#!/usr/bin/env bash
# Para o PostgreSQL. Use --purge para apagar também o volume de dados.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "${1:-}" == "--purge" ]]; then
  docker compose down -v
  echo "✔ Banco parado e volume removido."
else
  docker compose down
  echo "✔ Banco parado (dados preservados)."
fi
