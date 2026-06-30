# Dependências do Webinar ao Vivo

## Runtime (obrigatório)

| Dependência | Papel | Como obter |
|---|---|---|
| **Node.js ≥ 18** | Executa o Next.js e os scripts de setup | [nodejs.org](https://nodejs.org) ou `bootstrap/install.sh` |
| **Git** | Versionamento e deploy via push | [git-scm.com](https://git-scm.com) ou `bootstrap/install.sh` |
| **Supabase** (conta do cliente) | Banco de dados (chat, config, roteiro, inscritos, eventos) + autenticação admin | [supabase.com](https://supabase.com) — cliente cria o próprio projeto |
| **Vercel** (conta do cliente) | Hospedagem e deploy contínuo do Next.js | [vercel.com](https://vercel.com) — cliente conecta o repositório |

## Plugins / MCP (durante o setup)

| Plugin | Papel | Obrigatório? |
|---|---|---|
| **Supabase MCP** (`plugin:supabase`) | Permite ao Claude aplicar migrations e executar SQL diretamente durante o `/setup` | Recomendado — alternativa: usar o SQL Editor do dashboard Supabase manualmente |
| **Vercel MCP** (`plugin:vercel`) | Permite ao Claude verificar deploys e logs diretamente | Opcional — alternativa: acompanhar pelo dashboard Vercel |

> **Nenhuma skill de marketplace obrigatória** para o produto funcionar em produção.
> Os plugins Supabase e Vercel agilizam o `/setup` via MCP, mas o setup pode ser
> feito inteiramente pelos dashboards web de cada serviço.

## Variáveis de ambiente obrigatórias

Estas variáveis devem estar presentes **antes** do primeiro `npm run build` ou deploy
na Vercel — o app lança erro na importação se alguma estiver ausente:

```
NEXT_PUBLIC_SUPABASE_URL=<URL do projeto Supabase do cliente>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do projeto>
SUPABASE_SERVICE_ROLE_KEY=<service_role key do projeto>
```

## Variáveis de ambiente recomendadas

```
ADMIN_EMAILS=<email-do-dono@exemplo.com>
```

> Se `ADMIN_EMAILS` não for definida, **qualquer** usuário autenticado no Supabase
> poderá acessar `/admin`. Para produção, sempre defina com o(s) e-mail(s) do dono.

## O que NÃO é necessário

- Nenhuma chave de API da Anthropic ou do Claude — o produto roda sem LLM em produção.
- Nenhum serviço de e-mail, SMS ou pagamentos está embutido no produto base.
- Nenhuma conta Docker ou banco local — o Supabase é remoto (plano gratuito é suficiente para começar).
