#!/usr/bin/env bash
# Sobe o PostgreSQL e aguarda o healthcheck.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "✖ .env não encontrado. Rode ./scripts/setup.sh primeiro." >&2
  exit 1
fi

docker compose up -d --wait db
echo "✔ PostgreSQL pronto em 127.0.0.1:$(grep -E '^DB_PORT=' .env | cut -d= -f2 || echo 5433)"
