#!/usr/bin/env bash
# iniciar.sh — Ponto de partida (macOS/Linux).
# Verifica o ambiente e abre o Claude JÁ conduzindo a configuração.
# >>> Trocar placeholders: Webinar ao Vivo, colocar seu webinar no ar
cd "$(dirname "$0")" || exit 1

echo ""
echo "============================================================"
echo " Webinar ao Vivo — colocar seu webinar no ar"
echo "============================================================"

# 1. Se faltar node ou git, instala automaticamente (bootstrap)
if ! command -v node >/dev/null 2>&1 || ! command -v git >/dev/null 2>&1; then
  echo ""
  echo "Faltam pré-requisitos (Node e/ou git). Vou instalar pra você..."
  bash bootstrap/install.sh || {
    echo "Não consegui instalar automaticamente. Veja docs/prerequisitos.md"
    exit 1
  }
  # Tenta trazer o que foi instalado para o PATH desta sessão (Homebrew no Mac).
  [ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)" 2>/dev/null || true
  [ -x /usr/local/bin/brew ]   && eval "$(/usr/local/bin/brew shellenv)" 2>/dev/null || true
  hash -r 2>/dev/null || true
  # Se ainda não aparecer, é só questão de reabrir o terminal (PATH novo).
  if ! command -v node >/dev/null 2>&1 || ! command -v git >/dev/null 2>&1; then
    echo ""
    echo "✅ Instalei o necessário — agora FECHE e REABRA o terminal e rode de novo:"
    echo "   bash iniciar.sh"
    echo ""
    exit 0
  fi
fi

# 2. Checa pré-requisitos (mostra o que falta, por SO)
node setup/check.mjs || exit 1

# 3. Abre o Claude já disparando a primeira ação (setup na 1ª vez)
echo ""
echo "Abrindo o Claude para configurar seu projeto..."
echo "(é só conversar em português — ele faz o resto)"
echo ""
exec claude "Acabei de abrir este projeto pelo terminal. Execute agora a sua primeira ação conforme o topo do CLAUDE.md (se for a primeira vez, comece a configuração; caso contrário, me cumprimente e pergunte o que eu quero fazer)."
