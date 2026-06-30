# Webinar ao Vivo — Produto Instalável (design / spec)

**Data:** 2026-06-30
**Origem:** extração e genericização da feature de webinar do projeto `fortun-caroltabuas`
(`app/aula`, `app/api/aula`, `app/admin/webinar`, tabelas `aula_*`).
**Distribuição:** `git clone` + `iniciar.sh`/`.ps1`, repositório público.
**Repo do produto:** `webinar-ao-vivo` (marcador de setup `.webinar`).

---

## 1. Objetivo

Transformar a tela de aula ao vivo (webinar) num **produto instalável genérico**: o cliente
clona, roda um comando, o Claude conduz o `/setup`, e ele termina com um webinar funcional na
infra dele — configurável por um **admin em runtime** (sem editar código).

O comprador final é **não-técnico**. Toda a configuração do webinar (título, vídeo, horário,
oferta, notificações, roteiro do chat, mensagens oficiais) é feita por **formulários no admin**,
persistida no banco. Código só se edita para branding de produto e deploy.

## 2. Arquitetura em 2 camadas

1. **Base** — o webinar genérico que o cliente possui e sobe na infra dele:
   - Página pública `/aula` (fases aguardando / ao-vivo / replay / encerrada).
   - APIs `/api/aula/*` (gate, chat, eventos, contador ao vivo).
   - Admin `/admin` (auth + CRUD de configuração + dashboard de KPIs).
   - Tabelas `aula_*` no Supabase.
   - `content/config.ts` = **defaults de seed + branding do produto** (o instalador ajusta uma vez;
     valores semeiam a primeira linha de `aula_config`).
2. **Motor + onboarding** — maquinaria de instalação, igual em todo produto (vem dos `assets/` da
   skill `criar-produto-instalavel`): `iniciar.sh`/`.ps1`, `setup/check.mjs`, `bootstrap/install.*`,
   comandos `/setup` `/doctor` `/deploy` `/validar`, hook anti-`.env`, header auto-start no CLAUDE.md,
   `dependencias.md`.

**Quem configura o quê:**
- *Instalador/dono* (roda `/setup`): infra (chaves Supabase, deploy Vercel), branding de produto,
  cria o usuário admin.
- *Comprador final* (não-técnico, usa `/admin`): conteúdo do webinar em runtime.

## 3. Stack

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript. Supabase (Postgres + Auth).
Deploy Vercel. Pagamentos: o produto só **aponta** para um link de checkout configurável (sem
integração de webhook de vendas no MVP).

## 4. Modelo de dados

Prefixo `aula_` mantido (domínio "aula/webinar ao vivo", produto em PT-BR).

### 4.1 `aula_config` (NOVA) — 1 linha ativa
Configuração do webinar editada pelo admin. Campos:
- Identidade: `id` (pk), `ativa` (boolean, só 1 true), `updated_at`.
- Aula: `titulo`, `seo_descricao`, `youtube_video_id`.
- Agenda: `inicio_at` (timestamptz), `duracao_min` (int), `recorrencia` (jsonb nullable:
  `{ weekday, from_date }` p/ recorrência semanal opcional), `timezone` (default America/Sao_Paulo),
  `replay_habilitado` (boolean).
- Timing: `pitch_segundos` (int), `chat_offset_segundos` (int), `ao_vivo_fim_segundos` (int).
- Contador ao vivo: `contador_piso` (int, ex 80), `contador_multiplicador` (numeric, ex 1.0).
- Oferta (jsonb `oferta`): `{ ativo, patrocinado, bannerImagem, marcaLogo, marcaTitulo, marca,
  descricao, cta, link, cardChamada, cardPreco }`.
- Notificações (jsonb `notificacoes`): `{ ativo, inicioAposPitchSegundos, intervaloMinSegundos,
  intervaloMaxSegundos, total, produtoLabel }`.
- Materiais (jsonb `materiais` nullable): `{ titulo, subtitulo, grupos[] }` (opcional).
- Branding (jsonb `branding`): `{ marca, areaLabel, teamName, ogImage }`.

RLS habilitado. Leitura: a página `/aula` lê via service role (server component) — sem policy
pública. Escrita: só service role (admin autenticado via API). **Sem chaves/segredos nesta tabela.**

### 4.2 `aula_roteiro` (NOVA) — chat populado sincronizado
Linhas: `id` (pk), `delay_segundos` (int), `nome` (text), `mensagem` (text), `ordem` (int),
`created_at`. RLS habilitado, sem policy pública: o roteiro é lido **server-side** no Server
Component de `/aula` (service role) e passado como prop ao chat client — não fica exposto via anon.
As mensagens reais (`aula_chat`) seguem lidas client-side via anon (policy pública hidden=false).
Escrita em `aula_roteiro` só service role.

### 4.3 Tabelas mantidas (já existem no projeto-fonte)
- `aula_chat` — mensagens reais + oficiais (`is_official`). Leitura pública (hidden=false),
  insert só service role.
- `aula_eventos` — tracking (`acesso`, `heartbeat`, `oferta_view`, `cta_click`). Só service role.
- `aula_inscritos` — leads do gate (email pk, first_name). Só service role.

## 5. Página `/aula` (runtime)

Server Component lê a linha ativa de `aula_config` + `aula_roteiro` (service role) e passa para os
componentes client. Comportamento idêntico ao atual:
- **Vídeo travado:** YouTube IFrame API, `controls:0`, escudo transparente anti-clique, botões
  próprios (play/som/fullscreen).
- **Fases:** `computarEstadoAula` calcula aguardando/ao-vivo/replay a partir de `inicio_at` +
  `duracao_min` + `recorrencia`. Tela "encerrada" quando replay desligado.
- **Chat ao vivo:** merge cronológico do roteiro (`aula_roteiro`, sincronizado por `delay_segundos`
  com offset de calibração) + mensagens reais de `aula_chat` (polling 5s). Mensagem oficial
  destacada por `is_official` (nunca pelo nome — anti-impersonação).
- **Oferta:** drawer sobe no `pitch_segundos`, vira card fixo ao fechar (localStorage por data).
- **Notificações de compra:** toasts de prova social, se `notificacoes.ativo`.
- **Materiais:** botão + bottom-sheet, se houver.
- **Gate:** nome+email → `aula_inscritos` + cookie HMAC (secret = service role key), 8h.
- **Tracking:** `acesso` (1x), `heartbeat` (60s), `oferta_view`, `cta_click` com UTM genérico
  (`utm_source=webinar`, campaign `webinar_<data>`).

## 6. Admin (`/admin`)

Protegido por Supabase Auth (`@supabase/ssr`, cookie). O `/setup` cria o usuário admin. Padrão de
queries: `auth.getUser()` no server + service role para as queries (RLS sem policies públicas).

Telas:
1. **Configuração da aula** — título, SEO, ID do vídeo, data/hora/duração, recorrência semanal
   opcional, replay on/off, contador (piso/multiplicador), pitch/offset/fim.
2. **Oferta** — copy, preço, link, imagens (banner/logo), liga/desliga.
3. **Notificações de compra** — on/off, label do produto, timing (início após pitch, intervalo,
   total).
4. **Roteiro do chat** — textarea que aceita linhas `tempo | nome | mensagem` (colável de planilha)
   com preview; salva substituindo `aula_roteiro`. Seed genérico curto (~15 linhas neutras)
   pré-carregado.
5. **Mensagem como admin** — envia mensagem oficial (`is_official=true`, `user_name =
   branding.teamName`) ao chat ao vivo via API; sem SQL.
6. **Dashboard (KPIs essenciais)** — somente de `aula_eventos`:
   - **Ao vivo agora (real)** — sessões com heartbeat nos últimos ~45s.
   - Pico simultâneo, acessos, viram o pitch, retenção até o pitch, cliques no CTA, CTR.
   - **Sem** `oferta_compras` nem `webhook_logs` (fora de escopo).

## 7. Contador ao vivo real

`GET /api/aula/ao-vivo` — conta `session_id` distintos de `aula_eventos` com `event_type` em
(`heartbeat`,`acesso`) nos últimos ~45s para a `aula_date` de hoje; aplica
`max(piso, round(real * multiplicador))`. Live page e admin fazem poll (~8s). Substitui a curva
determinística falsa `viewerCountAt`. Admin pode ver real e exibido lado a lado.

## 8. Genericização — o que sai do código-fonte

- **CHAT_SCRIPT** (180 msgs reais da turma) → removido; seed neutro curto em `aula_roteiro`.
- **Oferta** PrecificaFacil/Kiwify → placeholder genérico.
- **Materiais** "cesta de café da manhã" → exemplo genérico/opcional.
- **Branding** "Carol Tabuas / Carol Scoralick" → `branding` (config).
- **OG / banners / logos** reais → placeholders neutros em `public/`.
- **HOSTS_CONFIAVEIS** (kiwify/caroltabuas) → allowlist derivada do host do link de checkout +
  hosts comuns (wa.me) configurável.
- **UTM** `precifica_` → `webinar_`.
- Nenhum dado de cliente real, domínio, chave ou copy permanece no repo.

## 9. Maquinaria de instalação (assets)

Copiar de `~/.claude/skills/criar-produto-instalavel/assets/` e trocar placeholders
(`{{NOME_PRODUTO}}` = "Webinar ao Vivo", `{{FRASE_OBJETIVO}}` = "colocar seu webinar no ar",
`{{MARCADOR}}` = `.webinar`):
- `iniciar.sh` / `iniciar.ps1` (raiz) — Fase 0: instala node/git se faltar; abre
  `claude "<prompt de setup>"`.
- `setup/check.mjs` — verifica pré-requisitos (`execFileSync`, nunca `exec` com string).
- `bootstrap/install.sh` / `.ps1` / `LINKS.md`.
- `.claude/hooks/block-env-commit.sh` (+ `chmod +x`), registrado em `.claude/settings.json`.
- `.claude/commands/`: `setup`, `doctor`, `deploy`, `validar` (adaptados ao produto).
- `CLAUDE.md` = header auto-start + convenções + **travas de segurança** (prompt-injection, ações
  destrutivas, credenciais, deploy, escopo).
- `.claude/setup/dependencias.md` — skills de marketplace + repos usados.

`/setup` segue o esqueleto: pré-requisitos → conta Supabase (projeto + chaves) → conta Vercel →
config inicial (semeia `aula_config`/`aula_roteiro`, cria usuário admin) → deploy → `/validar`.

## 10. Segurança

- `CLAUDE.md` com travas (template do `assets/claude-md-header.md` + corpo da referência).
- Hook bloqueia commit de `.env`. `.gitignore`: `node_modules/`, `.next/`, `.env*`, `.config/`,
  `.DS_Store`, `.vercel/`, `*.tsbuildinfo`, `*.log`, `.webinar/`.
- Service role key só no servidor; cookie do gate assinado com HMAC.
- Admin sempre via `auth.getUser()` + service role nas queries.

## 11. Fora de escopo (YAGNI)

- Atribuição de vendas por webhook (Kiwify/outros) e KPIs de faturamento.
- Múltiplos webinars ativos simultâneos (MVP = 1 `aula_config` ativa por vez).
- DNS/domínio automático (passo de risco — vira serviço).
- E-mails / recuperação / Z-API / contatos.
- Realtime do Supabase (mantém polling).
- Distribuição via `npx` (evolução futura; hoje é `git clone`).

## 12. Estrutura de pastas (produto)

```
webinar-ao-vivo/
├── app/
│   ├── aula/                 (página pública: page, lib, componentes client)
│   ├── api/aula/             (verificar, chat, evento, ao-vivo)
│   ├── admin/                (auth + telas de config + dashboard)
│   └── api/admin/aula/       (salvar config, roteiro, msg oficial)
├── content/config.ts        (defaults de seed + branding do produto + tipos)
├── lib/                      (supabase admin/ssr, helpers)
├── supabase/migrations/      (aula_config, aula_roteiro, aula_chat, aula_eventos, aula_inscritos)
├── public/                   (placeholders neutros: og, banner, logo)
├── iniciar.sh / iniciar.ps1
├── setup/check.mjs
├── bootstrap/install.sh / .ps1 / LINKS.md
├── .claude/ (settings.json, hooks/, commands/, setup/dependencias.md)
├── CLAUDE.md
├── README.md                (Quick Start por SO)
└── .gitignore
```

`docs/` (specs/planos internos) é removida da cópia do cliente antes da entrega oficial.

## 13. Verificação

- `node setup/check.mjs`, `bash -n` nos scripts, `npm run build`, `npm run lint`.
- Teste em clone limpo: sem `.webinar/setup-ok`, build do zero, sem dado real residual
  (`grep` por "Carol", "PrecificaFacil", "kiwify", "caroltabuas", IDs de vídeo reais).
- Subagente revisor independente (compliance + segurança); aplicar Críticos/Importantes.
