#!/usr/bin/env bash
# Prepara o ambiente local: cria o .env e instala dependências.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  cp .env.example .env
  if command -v openssl >/dev/null 2>&1; then
    secret="$(openssl rand -hex 32)"
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${secret}|" .env
  fi
  echo "✔ .env criado a partir de .env.example — preencha GROQ_API_KEY e as senhas."
else
  echo "• .env já existe, mantido."
fi

# O npm 10 falha ao resolver as peer deps do NestJS 12
# ("Cannot read properties of null (reading 'edgesOut')"); usa o npm 11 via npx.
NPM=(npm)
if (( $(npm -v | cut -d. -f1) < 11 )); then
  NPM=(npx -y npm@11)
fi

for dir in backend frontend; do
  if [[ -f "$dir/package.json" ]]; then
    echo "→ Instalando dependências de $dir..."
    (cd "$dir" && "${NPM[@]}" install)
  else
    echo "• $dir/ ainda não inicializado, pulando."
  fi
done

echo "✔ Setup concluído."
