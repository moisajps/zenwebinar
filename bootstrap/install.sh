#!/usr/bin/env bash
# bootstrap/install.sh — Instala os pré-requisitos no macOS/Linux.
# Idempotente: detecta o que já existe e instala só o que falta. Falha de forma legível.
# >>> Trocar placeholder: Webinar ao Vivo
set -uo pipefail

say()  { printf "\n\033[1;36m%s\033[0m\n" "$1"; }
ok()   { printf "\033[32m✔ %s\033[0m\n" "$1"; }
fail() { printf "\n\033[31m✖ ERRO: %s\033[0m\n→ %s\n" "$1" "$2" >&2; exit 1; }

say "Webinar ao Vivo — instalando o que falta na sua máquina"

OS="$(uname -s)"

if [ "$OS" = "Darwin" ]; then
  if ! command -v brew >/dev/null 2>&1; then
    say "Instalando o Homebrew (gerenciador de programas)..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" \
      || fail "não consegui instalar o Homebrew" "Instale manualmente em https://brew.sh e rode de novo."
    [ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
    [ -x /usr/local/bin/brew ] && eval "$(/usr/local/bin/brew shellenv)"
  else ok "Homebrew já instalado"; fi

  command -v git  >/dev/null 2>&1 && ok "git já instalado"  || { say "Instalando git...";  brew install git  || fail "falha ao instalar git"  "https://git-scm.com/download/mac"; }
  command -v node >/dev/null 2>&1 && ok "Node já instalado" || { say "Instalando Node..."; brew install node || fail "falha ao instalar Node" "Baixe o LTS em https://nodejs.org"; }
else
  if command -v apt-get >/dev/null 2>&1; then
    command -v git  >/dev/null 2>&1 && ok "git já instalado"  || { say "Instalando git...";  sudo apt-get update -y && sudo apt-get install -y git  || fail "falha ao instalar git"  "sudo apt install git"; }
    command -v node >/dev/null 2>&1 && ok "Node já instalado" || { say "Instalando Node..."; curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs || fail "falha ao instalar Node" "https://nodejs.org"; }
  else
    fail "gerenciador de pacotes não reconhecido" "Instale git e Node manualmente (https://nodejs.org) e rode de novo."
  fi
fi

if ! command -v claude >/dev/null 2>&1; then
  say "Instalando o Claude Code (CLI)..."
  curl -fsSL https://claude.ai/install.sh | bash || say "⚠️  Não instalei a CLI do Claude — tudo bem se você usa o app desktop."
else ok "Claude Code já instalado"; fi

say "Validando..."
command -v node >/dev/null 2>&1 || fail "Node não respondeu" "Feche e reabra o terminal e rode de novo."
command -v git  >/dev/null 2>&1 || fail "git não respondeu"  "Feche e reabra o terminal."

ok "Node: $(node --version)  |  git: $(git --version | awk '{print $3}')"
say "✅ Pré-requisitos instalados! Pode seguir."
