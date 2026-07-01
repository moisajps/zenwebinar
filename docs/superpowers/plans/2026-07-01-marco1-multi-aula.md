# Marco 1 — Núcleo multi-aula + redesign (light) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use `- [ ]` checkboxes.

**Goal:** Transformar "aulas" em entidades (vários webinars, cada um com config/roteiro/mensagens/insights próprios), servir a página pública por `/aula/[slug]`, e reconstruir todo o `/admin` no tema **light** das referências.

**Architecture:** `aula_config` vira a tabela de entidades (1 linha = 1 aula); `aula_id` (FK) entra em `aula_roteiro`/`aula_eventos`/`aula_chat` com backfill não-destrutivo da aula existente; a camada `lib/aula-config.ts` passa a carregar por slug/id; rotas e telas do admin são scoped por `aulaId`; o admin é reconstruído light (sem next-themes).

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4 (tokens `--admin-*` via `@utility`), Supabase (Postgres + Auth), Jest.

## Global Constraints
- **Migração não-destrutiva e idempotente**: só `ALTER … ADD`, backfill (`UPDATE`), `CREATE INDEX`, e `DROP INDEX` do índice de unicidade. **Nenhum `DROP TABLE`/`DROP COLUMN`/`DELETE` de dados.** Registrar em `schema_migrations` como `007_multi_aula.sql`.
- **`aulaId: string`** (uuid) threaded em toda a stack: `lib`, rotas públicas (`/api/aula/*`), rotas admin (`/api/admin/aula*`), tracking do cliente e telas do admin.
- **`/aula` runtime preservada visualmente** — muda só: carrega por slug, manda `aula_id` no tracking/chat/ao-vivo, e grava `device`+`video_seg` no heartbeat (aditivo no `metadata`). Nenhuma mudança de layout/comportamento visível ao espectador.
- **Light-only**: remover `next-themes`, `ThemeProviderClient`, `ThemeToggle`, o `@custom-variant dark` e o bloco `.dark {…}`. Um único tema com os tokens da referência. Contraste AA; foco visível âmbar; `cursor-pointer` em clicáveis; hover 150–200ms.
- Tokens: `--admin-bg #F6F6F8` · `--admin-panel #FFFFFF` · `--admin-border #E7E7EA` · `--admin-text #17171C` · `--admin-muted #6E7076` · `--admin-faint #9B9DA3` · `--admin-accent #F59E0B` · `--admin-accent-contrast #231603` · `--admin-input-bg #FFFFFF`.
- `npm run lint` exit 0, `npx jest` verde, build com envs placeholder passa — a cada task. Build: `NEXT_PUBLIC_SUPABASE_URL=https://ph.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ph SUPABASE_SERVICE_ROLE_KEY=ph npm run build`.
- Fora de escopo (NÃO implementar): curva de retenção/gráficos, vendas/faturamento, upload de imagem, importar/exportar CSV. (Marcos 2/3/4.)
- PT-BR na UI.

---

## File Structure
```
supabase/migrations/007_multi_aula.sql        (novo)
lib/aula-config.ts                             (getConfigBySlug/ById, listAulas, getRoteiro(aulaId), status)
lib/aula-status.ts                             (novo — statusDaAula() derivado)
app/aula/[slug]/page.tsx                       (movido de app/aula/page.tsx)
app/aula/page.tsx                              (vira redirect)
app/page.tsx                                   (redirect → /aula/[slug ativo])
app/aula/track.ts                              (trackAula recebe aulaId)
app/aula/AulaContent.tsx, LiveElements.tsx, Offer.tsx  (passam aulaId no tracking/chat)
app/api/aula/{ao-vivo,chat,evento}/route.ts    (aula_id + device no evento)
app/api/admin/aulas/route.ts                   (novo — criar/duplicar) + [id]/route.ts (arquivar)
app/api/admin/aula/{config,roteiro,mensagem}/route.ts  (scoped por aulaId)
app/globals.css                                (tema light único)
app/admin/layout.tsx, components/admin/AdminSidebar.tsx  (nav novo)
app/admin/page.tsx                             (LISTA DE AULAS — reescrita)
app/admin/aulas/[id]/…                         (painel + tabs: visão geral, config, roteiro, mensagens, contatos)
components/admin/*                              (reaproveitados, light + scoped)
__tests__/*                                     (atualizar p/ aulaId)
```

---

## Task 1 — Migração 007 + camada de dados por aula

**Files:** Create `supabase/migrations/007_multi_aula.sql`, `lib/aula-status.ts`; Modify `lib/aula-config.ts`, `app/aula/config-types.ts`; Update `__tests__/roteiro-linhas.test.ts` se referenciar getRoteiro.

**Interfaces:**
- Produces: `getConfigBySlug(slug): Promise<AulaConfig|null>`, `getConfigById(id): Promise<AulaConfig|null>`, `listAulas(): Promise<AulaResumo[]>`, `getRoteiro(aulaId: string)`, `rowToConfig` com `id/slug/nome`. `AulaConfig` ganha `id: string; slug: string; nome: string`.

- [ ] **Step 1: Migração `supabase/migrations/007_multi_aula.sql`** (conteúdo verbatim)
```sql
-- 007_multi_aula.sql — aulas como entidades (não-destrutivo, idempotente).
-- aula_config passa a ser a tabela de entidades: 1 linha = 1 aula.

ALTER TABLE aula_config ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE aula_config ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE aula_config ADD COLUMN IF NOT EXISTS arquivada boolean NOT NULL DEFAULT false;

-- backfill nome/slug da(s) linha(s) existente(s)
UPDATE aula_config SET nome = COALESCE(nome, titulo);
UPDATE aula_config
  SET slug = COALESCE(slug, NULLIF(regexp_replace(lower(titulo), '[^a-z0-9]+', '-', 'g'), ''), 'webinar')
  WHERE slug IS NULL;
-- desempate de slug se colidirem
UPDATE aula_config a SET slug = a.slug || '-' || left(a.id::text, 4)
  WHERE EXISTS (SELECT 1 FROM aula_config b WHERE b.slug = a.slug AND b.id <> a.id);

ALTER TABLE aula_config ALTER COLUMN nome SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS aula_config_slug_idx ON aula_config (slug);

-- remover a trava de "só 1 ativa"
DROP INDEX IF EXISTS aula_config_ativa_idx;

-- aula_id (FK) em roteiro/eventos/chat, nullable (código sempre preenche), com backfill
ALTER TABLE aula_roteiro ADD COLUMN IF NOT EXISTS aula_id uuid;
ALTER TABLE aula_eventos ADD COLUMN IF NOT EXISTS aula_id uuid;
ALTER TABLE aula_chat    ADD COLUMN IF NOT EXISTS aula_id uuid;

UPDATE aula_roteiro SET aula_id = (SELECT id FROM aula_config ORDER BY updated_at NULLS FIRST LIMIT 1) WHERE aula_id IS NULL;
UPDATE aula_eventos SET aula_id = (SELECT id FROM aula_config ORDER BY updated_at NULLS FIRST LIMIT 1) WHERE aula_id IS NULL;
UPDATE aula_chat    SET aula_id = (SELECT id FROM aula_config ORDER BY updated_at NULLS FIRST LIMIT 1) WHERE aula_id IS NULL;

ALTER TABLE aula_roteiro DROP CONSTRAINT IF EXISTS aula_roteiro_aula_fk;
ALTER TABLE aula_eventos DROP CONSTRAINT IF EXISTS aula_eventos_aula_fk;
ALTER TABLE aula_chat    DROP CONSTRAINT IF EXISTS aula_chat_aula_fk;
ALTER TABLE aula_roteiro ADD CONSTRAINT aula_roteiro_aula_fk FOREIGN KEY (aula_id) REFERENCES aula_config(id) ON DELETE CASCADE;
ALTER TABLE aula_eventos ADD CONSTRAINT aula_eventos_aula_fk FOREIGN KEY (aula_id) REFERENCES aula_config(id) ON DELETE CASCADE;
ALTER TABLE aula_chat    ADD CONSTRAINT aula_chat_aula_fk    FOREIGN KEY (aula_id) REFERENCES aula_config(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS aula_roteiro_aula_idx ON aula_roteiro (aula_id, delay_segundos, ordem);
CREATE INDEX IF NOT EXISTS aula_eventos_aula_idx ON aula_eventos (aula_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS aula_chat_aula_idx    ON aula_chat (aula_id, created_at);

INSERT INTO schema_migrations (version) VALUES ('007_multi_aula.sql') ON CONFLICT (version) DO NOTHING;
```
> A migração é aplicada no banco pelo `/setup` ou `/atualizar` — este passo só cria o arquivo. NÃO aplicar no banco aqui.

- [ ] **Step 2: `app/aula/config-types.ts`** — adicionar ao tipo `AulaConfig` os campos `id: string`, `slug: string`, `nome: string` (no topo do objeto).

- [ ] **Step 3: `lib/aula-status.ts`** (novo)
```ts
import type { AulaConfig } from '@/app/aula/config-types'
import { computarEstadoAula } from '@/app/aula/lib'

export type StatusAula = 'rascunho' | 'agendada' | 'ao_vivo' | 'encerrada'

export function statusDaAula(cfg: Pick<AulaConfig, 'inicioAt' | 'recorrencia' | 'duracaoMin' | 'timezone' | 'replayHabilitado'>, agora = new Date()): StatusAula {
  if (!cfg.inicioAt && !cfg.recorrencia) return 'rascunho'
  const est = computarEstadoAula(cfg as AulaConfig, agora)
  if (est.fase === 'ao_vivo') return 'ao_vivo'
  if (est.fase === 'aguardando') return 'agendada'
  return 'encerrada'
}
```
> Se as fases/nomes de `computarEstadoAula` diferirem, ajuste o mapeamento lendo `app/aula/lib.ts` primeiro.

- [ ] **Step 4: `lib/aula-config.ts`** — refactor:
  - `rowToConfig(row)` passa a incluir `id: row.id`, `slug: row.slug`, `nome: row.nome`.
  - Substituir `getActiveConfig()` por:
```ts
export async function getConfigBySlug(slug: string): Promise<AulaConfig | null> {
  const { data } = await supabaseAdmin.from('aula_config').select('*').eq('slug', slug).eq('arquivada', false).maybeSingle()
  return data ? rowToConfig(data) : null
}
export async function getConfigById(id: string): Promise<AulaConfig | null> {
  const { data } = await supabaseAdmin.from('aula_config').select('*').eq('id', id).maybeSingle()
  return data ? rowToConfig(data) : null
}
export async function getAulaAtivaMaisRecente(): Promise<AulaConfig | null> {
  const { data } = await supabaseAdmin.from('aula_config').select('*').eq('arquivada', false).order('inicio_at', { ascending: false, nullsFirst: false }).limit(1).maybeSingle()
  return data ? rowToConfig(data) : null
}
export async function listAulas(): Promise<{ id: string; slug: string; nome: string; titulo: string; inicioAt: string | null; recorrencia: AulaConfig['recorrencia']; duracaoMin: number; timezone: string; replayHabilitado: boolean }[]> {
  const { data } = await supabaseAdmin.from('aula_config').select('id,slug,nome,titulo,inicio_at,recorrencia,duracao_min,timezone,replay_habilitado').eq('arquivada', false).order('inicio_at', { ascending: false, nullsFirst: false })
  return (data ?? []).map((r) => ({ id: r.id, slug: r.slug, nome: r.nome, titulo: r.titulo, inicioAt: r.inicio_at, recorrencia: r.recorrencia, duracaoMin: r.duracao_min, timezone: r.timezone, replayHabilitado: r.replay_habilitado }))
}
```
  - `getRoteiro(aulaId: string)`: adicionar `.eq('aula_id', aulaId)` na query; assinatura passa a exigir `aulaId`. Manter fallback `SEED_ROTEIRO` só quando vazio.
  - Manter `getActiveConfig()` como shim `=> getAulaAtivaMaisRecente()` p/ não quebrar chamadas ainda-não-migradas (removido nas tasks seguintes).

- [ ] **Step 5: Ajustar testes** — se `__tests__` chamar `getRoteiro()` sem arg, atualizar para passar um id fake; se houver teste de `rowToConfig`, cobrir `id/slug/nome`. Rodar `npx jest`.

- [ ] **Step 6: Verificar** — `npm run lint` (0), build placeholder passa (as telas ainda usam o shim `getActiveConfig`), `npx jest` verde.
- [ ] **Step 7: Commit** — `feat(marco1): migração 007 (aulas como entidades) + camada de dados por slug/id`

---

## Task 2 — Rota pública `/aula/[slug]` + tracking com aula_id + heartbeat device/posição

**Files:** Create `app/aula/[slug]/page.tsx`; Modify `app/aula/page.tsx`, `app/page.tsx`, `app/aula/track.ts`, `app/aula/AulaContent.tsx`, `app/aula/LiveElements.tsx`, `app/aula/Offer.tsx`, `app/api/aula/evento/route.ts`, `app/api/aula/chat/route.ts`, `app/api/aula/ao-vivo/route.ts`.

**Interfaces:** Consumes `getConfigBySlug`, `getAulaAtivaMaisRecente`, `getRoteiro(aulaId)`. `trackAula(aulaId, aulaDate, evento, extra?)`.

- [ ] **Step 1: Mover a página** — mover o conteúdo de `app/aula/page.tsx` para `app/aula/[slug]/page.tsx`, trocando `getActiveConfig()` por `getConfigBySlug(params.slug)`; se `null` → `notFound()`. Passar `config.id` (aulaId) e `getRoteiro(config.id)` adiante. `params` é `Promise` no Next 16 (`const { slug } = await params`).
- [ ] **Step 2: Redirects** — `app/aula/page.tsx` (sem slug) e `app/page.tsx`: buscar `getAulaAtivaMaisRecente()`; se existir, `redirect('/aula/' + aula.slug)`; senão renderizar um estado "nenhuma aula publicada".
- [ ] **Step 3: `track.ts`** — `trackAula` passa a receber `aulaId` como 1º arg e enviá-lo no body (`{ aula_id, aula_date, session_id, event_type, metadata }`). Chaves de `localStorage` e UTM passam a usar `aulaId` (ex.: `aula_offer_dismissed:${aulaId}`, UTM `webinar_${aulaId}`). Adicionar detecção de posição do vídeo: `trackAula` aceita `extra` (ex.: `{ video_seg }`) que vai pro metadata.
- [ ] **Step 4: Passar aulaId nos componentes** — `AulaContent.tsx` recebe `aulaId` (prop, vindo da page) e o repassa a `trackAula` (acesso/heartbeat) e a `LiveChatFull`/`Offer`. No heartbeat, incluir `{ video_seg: <posição atual do player em s> }` (do `YouTubePlayer`; se indisponível, calcular a partir do tempo decorrido da fase ao vivo). `LiveElements.tsx` e `Offer.tsx` passam `aulaId` nos `trackAula`/POST de chat.
- [ ] **Step 5: `/api/aula/evento`** — aceitar `aula_id` (uuid) no body; validar formato; gravar em `aula_eventos.aula_id`. Inferir `device` do header `user-agent` (`/Mobi|Android|iPhone|iPad/i` → 'mobile' senão 'desktop') e mesclar em `metadata` (`{ ...metadata, device }`). Manter `aula_date` e a extração de email do cookie.
- [ ] **Step 6: `/api/aula/chat`** — aceitar `aula_id`; gravar em `aula_chat.aula_id` (além de `aula_date`).
- [ ] **Step 7: `/api/aula/ao-vivo`** — aceitar `aula_id`; a janela de contagem filtra por `aula_id` (em vez de/junto a `aula_date`); piso/multiplicador vêm de `getConfigById(aula_id)` (não mais da "única ativa").
- [ ] **Step 8: Verificar** — `npm run lint` (0), build placeholder, `npx jest`. Conferir por leitura que a `/aula` não mudou de layout, só de fonte de dados/tracking. Commit — `feat(marco1): /aula/[slug] + tracking por aula_id + heartbeat device/posição`

---

## Task 3 — Rotas admin scoped por aulaId + criar/duplicar/arquivar

**Files:** Create `app/api/admin/aulas/route.ts`, `app/api/admin/aulas/[id]/route.ts`; Modify `app/api/admin/aula/config/route.ts`, `app/api/admin/aula/roteiro/route.ts`, `app/api/admin/aula/mensagem/route.ts`.

- [ ] **Step 1: `POST /api/admin/aulas`** (novo) — auth `requireAdmin()`. Body `{ nome, duplicarDe?: string }`. Gera `slug` (slugify do nome + sufixo único se colidir). Se `duplicarDe`, copia a config daquela aula (menos id/slug/nome). Senão, cria a partir de `SEED_CONFIG`. Insere linha em `aula_config` (`arquivada=false`). Se `duplicarDe`, copia também o roteiro (insert com o novo `aula_id`). Retorna `{ id, slug }`.
- [ ] **Step 2: `PATCH /api/admin/aulas/[id]`** (novo) — auth. Body `{ arquivada: boolean }`. Update `aula_config.arquivada`.
- [ ] **Step 3: `config/route.ts`** — passar a receber `aulaId` no body; **update-by-id** (`.eq('id', aulaId)`), sem o padrão upsert-única-ativa e sem forçar `ativa`. Nunca tocar `slug`/`nome` aqui a não ser que venham no body.
- [ ] **Step 4: `roteiro/route.ts`** — receber `aulaId`; o delete passa a ser `.eq('aula_id', aulaId)`; cada linha inserida leva `aula_id: aulaId`. Manter `normalizarLinhas`/fallback `{texto}`.
- [ ] **Step 5: `mensagem/route.ts`** — receber `aulaId`; `getConfigById(aulaId)` p/ timezone/teamName; gravar `aula_chat` com `aula_id` + `is_official`.
- [ ] **Step 6: Verificar + Commit** — lint/build/jest. Commit — `feat(marco1): rotas admin scoped por aulaId + criar/duplicar/arquivar aula`

---

## Task 4 — Tema light único (remover dark/next-themes)

**Files:** Modify `app/globals.css`, `app/admin/layout.tsx`; Delete usage of `components/admin/ThemeProviderClient.tsx`, `ThemeToggle.tsx`; Modify `components/admin/AdminHeader.tsx`, `UserMenu.tsx`, `AdminTour.tsx` (remover refs a tema); `package.json` (remover `next-themes`).

- [ ] **Step 1: `globals.css`** — remover a linha `@custom-variant dark …` e o bloco `.dark { … }`. Substituir os valores do `:root` pelos tokens light finais:
```css
:root {
  --admin-bg: #F6F6F8;
  --admin-panel: #FFFFFF;
  --admin-elev: #FFFFFF;
  --admin-border: #E7E7EA;
  --admin-text: #17171C;
  --admin-muted: #6E7076;
  --admin-faint: #9B9DA3;
  --admin-accent: #F59E0B;
  --admin-accent-contrast: #231603;
  --admin-input-bg: #FFFFFF;
}
```
Manter os `@utility admin-*` existentes; adicionar `@utility admin-faint { color: var(--admin-faint); }`. Manter `.admin-accent:hover { filter: brightness(1.04); }` e `.admin-input:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 1px; }`.
- [ ] **Step 2: layout admin** — remover `ThemeProviderClient` de `app/admin/layout.tsx` (envolver direto em `admin-bg`). Remover `suppressHydrationWarning` do `<html>` se só existia pro next-themes.
- [ ] **Step 3: header/menu** — em `AdminHeader.tsx` remover o `<ThemeToggle/>`. Deletar imports de `ThemeToggle`/`ThemeProviderClient`. Remover `data-tour="theme-toggle"` e o passo de tema do `AdminTour`.
- [ ] **Step 4: deps** — `npm uninstall next-themes`. Remover os arquivos `ThemeProviderClient.tsx` e `ThemeToggle.tsx`.
- [ ] **Step 5: Verificar + Commit** — lint (0), build, jest. Conferir que nenhuma referência a `next-themes`/`dark:` sobrou (`grep -rn "next-themes\|dark:" app components`). Commit — `feat(marco1): tema light único (remove dark/next-themes)`

---

## Task 5 — `/admin` = Lista de aulas (nova)

**Files:** Rewrite `app/admin/page.tsx`; Create `app/admin/AulasList.tsx` (client, ações) + `components/admin/StatusChip.tsx`; Modify `components/admin/AdminSidebar.tsx`.

**Interfaces:** Consumes `listAulas()`, `statusDaAula()`, e um resumo leve por aula de `aula_eventos`.

- [ ] **Step 1: `app/admin/page.tsx`** (server) — `requireAdmin()`. `const aulas = await listAulas()`. Para cada aula, um resumo leve: `acessos` (distinct session em `acesso`) e `cliques` (`cta_click`) via uma query agregada por `aula_id` (uma query cobrindo todas as aulas; agrupar em memória). Renderizar `<PageShell><PageHeader title="Aulas" actions={<botão Nova aula>} /><AulasList aulas={...} /></PageShell>`.
- [ ] **Step 2: `StatusChip.tsx`** — chip por status: `ao_vivo` (ponto pulsante vermelho + "Ao vivo"), `agendada` (âmbar), `encerrada` (cinza), `rascunho` (contorno). Tokens light.
- [ ] **Step 3: `AulasList.tsx`** (client) — grid/lista de cards: nome, `StatusChip`, data formatada (timezone da aula), link público `/aula/[slug]` (copiar/abrir), resumo (acessos, cliques). Card inteiro é link pra `/admin/aulas/[id]` (`cursor-pointer`, hover sutil). Menu "⋯": **Duplicar** (POST `/api/admin/aulas` com `duplicarDe`), **Arquivar** (PATCH), **Abrir link**. Botão **Nova aula** abre um mini-form (nome) → POST `/api/admin/aulas` → redireciona pra `/admin/aulas/[novo id]`.
- [ ] **Step 4: Sidebar** — `AdminSidebar` no topo mostra "Aulas" (link `/admin`). Quando dentro de uma aula (`/admin/aulas/[id]`), a sidebar mostra a navegação da aula (as tabs) — ou deixar as tabs no header do painel (Task 6) e a sidebar só com "Aulas" + link de voltar. Escolher tabs-no-painel (mais simples); sidebar = marca + "Aulas" + usuário.
- [ ] **Step 5: Verificar + Commit** — lint/build/jest. Commit — `feat(marco1): dashboard vira lista de aulas`

---

## Task 6 — Painel da aula + tabs + Visão geral (KPIs + funil)

**Files:** Create `app/admin/aulas/[id]/layout.tsx` (carrega a aula + header + tabs), `app/admin/aulas/[id]/page.tsx` (Visão geral), `app/admin/aulas/[id]/AulaTabs.tsx`; reaproveitar `components/admin/Funnel.tsx`, `AoVivoAgora.tsx`.

**Interfaces:** Consumes `getConfigById(id)`, stats de `aula_eventos` por `aula_id`.

- [ ] **Step 1: `layout.tsx`** — `requireAdmin()`; `const aula = await getConfigById(id)`; se null → `notFound()`. Renderiza `<PageShell><PageHeader title={aula.nome} subtitle={<link público>} actions={<StatusChip/>} /><AulaTabs id={id} /><div>{children}</div></PageShell>`. `AulaTabs` = links pras sub-rotas (Visão geral `/admin/aulas/[id]`, Configuração `…/config`, Roteiro `…/roteiro`, Mensagens `…/mensagens`, Contatos `…/contatos`), com aba ativa por pathname.
- [ ] **Step 2: `page.tsx` (Visão geral)** — portar a lógica de `getStats` do dashboard antigo, agora filtrando `aula_eventos` por `aula_id` (não `aula_date`). Renderizar: hero `AoVivoAgora` (recebe `aulaId`, polla `/api/aula/ao-vivo?aula_id=`), grade de KPIs (acessos, pico, viram o pitch, retenção-até-pitch, cliques, CTR) em `Section` Aquisição/Oferta, e `Funnel` (Acessos→Pitch→Cliques). Tudo no tema light, layout da referência. **Sem** curva de retenção (M2) — deixar um card placeholder discreto "Curva de retenção — em breve" NÃO; apenas omitir.
- [ ] **Step 3: `AoVivoAgora.tsx`** — aceitar `aulaId` e pollar `/api/aula/ao-vivo?aula_id=${aulaId}`.
- [ ] **Step 4: Verificar + Commit** — lint/build/jest. Commit — `feat(marco1): painel da aula com tabs e visão geral (KPIs+funil)`

---

## Task 7 — Aba Configuração (scoped + light)

**Files:** Create `app/admin/aulas/[id]/config/page.tsx`; Modify `app/admin/aula/ConfigForm.tsx` (aceitar `aulaId`, postar com ele); remover a antiga `app/admin/aula/page.tsx` (ou deixá-la redirecionando).

- [ ] **Step 1: page** — `getConfigById(id)` → `<ConfigForm cfg={cfg} aulaId={id} />`.
- [ ] **Step 2: `ConfigForm`** — aceitar prop `aulaId`; no `salvar`, incluir `aulaId` no body do POST `/api/admin/aula/config`. **Não** mudar o resto da lógica de estado/campos. Garantir tema light (os tokens já mudaram na Task 4; conferir que nada usa cor hardcoded escura). Campos de imagem seguem URL (upload é M4).
- [ ] **Step 3: Verificar + Commit** — lint/build/jest; conferir por diff que o payload do save é o mesmo + `aulaId`. Commit — `feat(marco1): aba configuração scoped por aula`

---

## Task 8 — Aba Roteiro (scoped + light)

**Files:** Create `app/admin/aulas/[id]/roteiro/page.tsx`; Modify `app/admin/roteiro/RoteiroEditor.tsx` (aceitar `aulaId`).

- [ ] **Step 1: page** — `getRoteiro(id)` → `<RoteiroEditor inicial={roteiro} aulaId={id} />`.
- [ ] **Step 2: `RoteiroEditor`** — aceitar `aulaId`; incluir no body do POST `/api/admin/aula/roteiro`. Manter add-no-topo + lista + `ChatPreview`. Tema light.
- [ ] **Step 3: Verificar + Commit** — lint/build/jest. Commit — `feat(marco1): aba roteiro scoped por aula`

---

## Task 9 — Abas Mensagens + Contatos (stub) (scoped + light)

**Files:** Create `app/admin/aulas/[id]/mensagens/page.tsx`, `app/admin/aulas/[id]/contatos/page.tsx`; Modify `app/admin/mensagem/MensagemForm.tsx` (aceitar `aulaId`).

- [ ] **Step 1: Mensagens** — `getConfigById(id)` → `<MensagemForm teamName={cfg.branding.teamName} aulaId={id} />`; o POST inclui `aulaId`. Mantém compor + `ChatPreview` oficial. Light.
- [ ] **Step 2: Contatos (stub)** — server: query `aula_eventos` where `aula_id=id AND event_type='acesso'`, distinct por `email` (ignorando nulos), com `min(created_at)` como "acessou em". Renderizar tabela simples (nome/email/quando) em `Card`. Sem exportar CSV (M4). Estado vazio amigável.
- [ ] **Step 3: Verificar + Commit** — lint/build/jest. Commit — `feat(marco1): abas mensagens e contatos (stub) scoped por aula`

---

## Task 10 — Consistência + limpeza + verificação final

**Files:** limpeza de rotas antigas; ajustes.

- [ ] **Step 1: Limpeza** — remover/500-redirect as telas antigas não usadas (`app/admin/aula`, `app/admin/roteiro`, `app/admin/mensagem` de nível raiz) que foram substituídas por `/admin/aulas/[id]/*`. Remover o shim `getActiveConfig` de `lib/aula-config.ts` se ninguém mais o usa (`grep -rn getActiveConfig`).
- [ ] **Step 2: Consistência light** — varrer as telas: `cursor-pointer` em clicáveis, hover 150–200ms, foco visível, sem cor hardcoded escura remanescente, contraste AA (texto `--admin-text`/`--admin-muted` sobre branco/`--admin-bg`). Sidebar/telas coesas.
- [ ] **Step 3: `/aula` intocada** — `git diff <base>..HEAD -- app/aula` deve mostrar só: mover pra `[slug]`, aulaId no tracking, device/posição no heartbeat. Nenhuma mudança de layout do espectador.
- [ ] **Step 4: Suite** — `npm run lint` (0), `npx jest` (verde), build placeholder. Registrar saídas.
- [ ] **Step 5: Revisor independente** — dispatch de revisor (modelo de dados/migração não-destrutiva + scoping correto por aulaId em todas as rotas + `/aula` preservada + a11y/contraste light). Aplicar Críticos/Importantes.
- [ ] **Step 6: Commit final** — `chore(marco1): consistência e verificação final`

---

## Self-Review
- Entidades + migração não-destrutiva → Task 1. ✓
- `/aula/[slug]` + tracking aula_id + semente device/posição → Task 2. ✓
- Rotas admin scoped + criar/duplicar/arquivar → Task 3. ✓
- Tema light (remove dark) → Task 4. ✓
- Lista de aulas → 5; painel+tabs+visão geral → 6; config/roteiro/mensagens/contatos scoped → 7/8/9. ✓
- Consistência + review + `/aula` preservada → 10. ✓
- **Tipos:** `aulaId: string` consistente entre lib/rotas/telas; `AulaConfig` com `id/slug/nome`; `getRoteiro(aulaId)`. ✓
- **Fora de escopo** (curva/gráficos, vendas, upload, CSV) não aparece em nenhuma task. ✓
- **Sem placeholders** de lógica: migração e lib com código verbatim; telas com instruções concretas + tokens.
