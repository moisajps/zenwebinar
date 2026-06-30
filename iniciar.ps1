# iniciar.ps1 — Ponto de partida (Windows).
# Verifica o ambiente e abre o Claude JA conduzindo a configuracao.
# >>> Trocar placeholders: Webinar ao Vivo, colocar seu webinar no ar
Set-Location $PSScriptRoot

Write-Host ""
Write-Host "============================================================"
Write-Host " Webinar ao Vivo - colocar seu webinar no ar"
Write-Host "============================================================"

# 1. Se faltar node ou git, instala automaticamente (bootstrap)
if ((-not (Get-Command node -ErrorAction SilentlyContinue)) -or (-not (Get-Command git -ErrorAction SilentlyContinue))) {
  Write-Host ""
  Write-Host "Faltam pre-requisitos (Node e/ou git). Vou instalar pra voce..."
  & "$PSScriptRoot\bootstrap\install.ps1"
  # winget nao atualiza o PATH da sessao atual: se ainda nao aparecer, e so reabrir.
  if ((-not (Get-Command node -ErrorAction SilentlyContinue)) -or (-not (Get-Command git -ErrorAction SilentlyContinue))) {
    Write-Host ""
    Write-Host "Instalei o necessario - agora FECHE e REABRA o PowerShell e rode de novo:" -ForegroundColor Yellow
    Write-Host "   .\iniciar.ps1"
    Write-Host ""
    exit 0
  }
}

# 2. Checa pre-requisitos (mostra o que falta, por SO)
node setup/check.mjs
if ($LASTEXITCODE -ne 0) { exit 1 }

# 3. Abre o Claude ja disparando a primeira acao (setup na 1a vez)
Write-Host ""
Write-Host "Abrindo o Claude para configurar seu projeto..."
Write-Host "(e so conversar em portugues - ele faz o resto)"
Write-Host ""
claude "Acabei de abrir este projeto pelo terminal. Execute agora a sua primeira acao conforme o topo do CLAUDE.md (se for a primeira vez, comece a configuracao; caso contrario, me cumprimente e pergunte o que eu quero fazer)."
