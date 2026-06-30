# Webinar ao Vivo

Página de aula ao vivo (vídeo + chat + oferta) instalável, configurável por um admin.
O produto inclui player sincronizado com YouTube, chat simulado por roteiro, contador
de espectadores, drawer de oferta temporizada e painel `/admin` para gerenciar tudo
sem tocar em código. Ideal para infoprodutores que querem lançar ou replicar webinars
com experiência de aula ao vivo.

## Quick Start

**Mac/Linux:**
```bash
git clone <URL> webinar-ao-vivo && cd webinar-ao-vivo && bash iniciar.sh
```

**Windows (PowerShell):**
```powershell
git clone <URL> webinar-ao-vivo; cd webinar-ao-vivo; .\iniciar.ps1
```

O assistente (Claude) conduz a configuração passo a passo — Supabase, criação do admin
e deploy na Vercel — sem você precisar digitar comandos. Depois, configure a aula em `/admin`.

## Pré-requisitos

- Node.js ≥ 18 e Git (o script `iniciar.sh`/`iniciar.ps1` instala automaticamente se necessário)
- Conta Supabase (gratuita) — o assistente orienta a criação durante o setup
- Conta Vercel (gratuita) — para o deploy do site

## Após o setup

Acesse `/admin` no seu site para configurar:
- URL do vídeo YouTube e horário de início
- Oferta (produto, preço, CTA, banner)
- Roteiro do chat automático
- Branding (nome, logo, imagem OG)

## Estrutura rápida

```
supabase/migrations/   # 5 migrations SQL (aplicadas no setup)
content/config.ts      # Valores padrão de seed (aula_config + aula_roteiro)
app/                   # Next.js App Router
.claude/commands/      # Comandos do assistente (/setup, /validar, /deploy…)
```

## Variáveis de ambiente

Veja `.claude/setup/dependencias.md` para a lista completa e notas de segurança.
