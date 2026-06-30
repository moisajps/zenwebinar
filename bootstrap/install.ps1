# bootstrap/install.ps1 — Instala os pre-requisitos no Windows.
# Idempotente: instala so o que falta. Falha de forma legivel.
# >>> Trocar placeholder: Webinar ao Vivo
$ErrorActionPreference = "Stop"

function Say($m){ Write-Host "`n$m" -ForegroundColor Cyan }
function Ok($m){ Write-Host "OK: $m" -ForegroundColor Green }
function Fail($m,$h){ Write-Host "`nERRO: $m" -ForegroundColor Red; Write-Host "-> $h"; exit 1 }
function Have($c){ return [bool](Get-Command $c -ErrorAction SilentlyContinue) }

Say "Webinar ao Vivo - instalando o que falta na sua maquina"

if (-not (Have "winget")) {
  Fail "winget nao encontrado" "Atualize o 'App Installer' pela Microsoft Store e rode de novo."
}

if (Have "git") { Ok "git ja instalado" } else {
  Say "Instalando Git..."
  try { winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements }
  catch { Fail "falha ao instalar git" "Baixe manualmente: https://git-scm.com/download/win" }
}

if (Have "node") { Ok "Node ja instalado" } else {
  Say "Instalando Node.js (LTS)..."
  try { winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-source-agreements --accept-package-agreements }
  catch { Fail "falha ao instalar Node" "Baixe o LTS: https://nodejs.org" }
}

if (-not (Have "claude")) {
  Say "Instalando Claude Code (CLI)..."
  try { Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression }
  catch { Say "Nao instalei a CLI do Claude - tudo bem se voce usa o app desktop." }
} else { Ok "Claude Code ja instalado" }

Say "Validando..."
if ((-not (Have "node")) -or (-not (Have "git"))) {
  Write-Host ""
  Write-Host "Instalei os programas. O Windows so reconhece no PATH em uma NOVA sessao:" -ForegroundColor Yellow
  Write-Host "FECHE e REABRA o PowerShell para continuar." -ForegroundColor Yellow
  exit 0
}

Ok "Node e git prontos."
Say "Pre-requisitos instalados! Pode seguir."
