#!/usr/bin/env bash
# Bloqueia comandos git que tentem adicionar/commitar arquivos .env (não pega .envrc).
set -euo pipefail
input="$(cat)"
cmd="$(printf '%s' "$input" | grep -o '"command"[^,]*' || true)"
if printf '%s' "$cmd" | grep -Eq 'git (add|commit).*\.env([^a-zA-Z]|$)'; then
  echo "BLOQUEADO: tentativa de versionar arquivo .env. Credenciais nunca vão pro git." >&2
  exit 2
fi
exit 0
