# Marco 1 — Núcleo multi-aula + redesign (light) — spec

**Data:** 2026-07-01
**Contexto:** v2 do zenwebinar. Hoje o sistema assume **uma única aula ativa** (a linha
`aula_config` com `ativa=true` É a aula; eventos/chat chaveados por `aula_date`; roteiro e
inscritos globais; `/aula` estática). Este marco transforma **aulas em entidades** (vários
webinars, cada um com config/roteiro/insights/contatos próprios) e reconstrói o `/admin` no
**visual light** das referências. É a fundação — Marcos 2 (insights VTurb), 3 (conversões
VTurb) e 4 (uploads/contatos/CSV) vêm depois.

Referências de UI: mockup "Zenwebinar Admin Redesign" (light, sidebar 232px, cards brancos
borda `#E7E7EA`, texto `#17171C`, acento âmbar `#F59E0B`, Inter + JetBrains Mono) e o
dashboard com curva de retenção + funil + grade de KPIs.

---

## 1. Objetivo do Marco 1
1. **Aulas como entidades**: criar/listar/editar várias aulas, cada uma com sua config,
   roteiro, mensagens, acessos e eventos.
2. **Rota pública `/aula/[slug]`**: um link por webinar (a `/aula` atual redireciona pra
   última aula ativa por compat).
3. **Admin novo**: `/admin` = **lista de aulas**; abrir uma aula = **painel com tabs**
   (Visão geral · Configuração · Roteiro · Mensagens). Contatos entra como aba stub (dados
   já coletados; tela completa no Marco 4).
4. **Redesign light** de todo o admin, fiel às referências. O bug de texto branco morre
   aqui (nasce light-first).
5. **Instrumentação leve** que prepara o Marco 2: `aula_id` nos eventos, captura de
   **device** e **posição no vídeo** nos heartbeats (dados começam a acumular já).

Fora do Marco 1 (não implementar aqui): curva de retenção/gráficos (M2), vendas/faturamento
(M3), upload de imagens e importar/exportar CSV (M4).

---

## 2. Modelo de dados (migração `007_multi_aula.sql`)

Estratégia: **evolutiva e não-destrutiva**. `aula_config` passa a ser a tabela de entidades
(cada linha = uma aula). Dados atuais viram a "aula 1".

### 2.1 `aula_config` → entidades
- **Remover** o índice único `aula_config_ativa_idx` (o que trava 1 ativa).
- **Adicionar** colunas:
  - `slug text` — único, usado em `/aula/[slug]`. `UNIQUE`.
  - `nome text` — nome interno/curto do webinar (ex.: "Webinar 1 — Marketing Digital"),
    distinto do `titulo` (SEO). `NOT NULL` com default a partir do `titulo` na migração.
  - `arquivada boolean NOT NULL DEFAULT false` — soft-delete (some da lista, não apaga dados).
- **`ativa`** deixa de ser "a única ativa": passa a significar "publicada/visível". Sem índice
  único. (A "aula atual ao vivo" é derivada de `inicio_at`/`recorrencia`+`duracao`, não de flag.)
- **Backfill**: a linha existente ganha `slug` (gerado do titulo, ex.: `marketing-digital`) e
  `nome` = `titulo`. Se não houver linha, o seed cria a aula 1.
- `recorrencia` continua **por aula** (uma aula pode ser semanal ou avulsa).

### 2.2 `aula_roteiro`: adicionar `aula_id`
- `ALTER TABLE aula_roteiro ADD COLUMN aula_id uuid REFERENCES aula_config(id) ON DELETE CASCADE;`
- **Backfill**: `UPDATE aula_roteiro SET aula_id = (SELECT id FROM aula_config ORDER BY updated_at LIMIT 1)`.
- Depois: `NOT NULL`. Índice `(aula_id, delay_segundos, ordem)`.

### 2.3 `aula_eventos` e `aula_chat`: adicionar `aula_id`
- Adicionar `aula_id uuid REFERENCES aula_config(id) ON DELETE CASCADE` em ambas.
- **Backfill** com o id da aula 1 (as linhas atuais são todas dela).
- Manter `aula_date` (bom pra bucketização por data e retrocompat). Novo índice
  `(aula_id, event_type, created_at)` e `(aula_id, aula_date)`.
- **Contatos/quem acessou** derivam de `aula_eventos` where `event_type='acesso'` (já tem
  `email` do cookie) agrupado por `aula_id` — **sem** tabela nova. `aula_inscritos` fica como
  lista global de leads, inalterada neste marco.

### 2.4 Instrumentação leve (prepara Marco 2), aditiva em `aula_eventos`
- `metadata` (jsonb já existe) passa a carregar, no `heartbeat`: `{ device: 'desktop'|'mobile',
  video_seg: <int posição no vídeo> }`. Sem coluna nova — vai no metadata.
- `acesso` passa a gravar `{ device }`. Device inferido do `user-agent` no servidor (rota
  `/api/aula/evento`), não confiado do cliente.

> Nada disso muda a resposta das rotas nem a `/aula` visualmente — só passa a **registrar**
> mais. A curva/os gráficos que consomem isso são o Marco 2.

---

## 3. Camada de dados (`lib/aula-config.ts`)
- `getConfigBySlug(slug): Promise<AulaConfig | null>` — `.eq('slug', slug).maybeSingle()`.
- `getConfigById(id)` — idem por id (admin).
- `listAulas(): { id, nome, slug, status, inicioAt, ... }[]` — pra lista do admin (com um
  resumo leve de KPIs por aula, calculado a partir de `aula_eventos` agregado).
- `getRoteiro(aulaId)` — passa a exigir `aulaId`.
- `rowToConfig` inclui `id`, `slug`, `nome`.
- **Status derivado** por aula: `rascunho` (sem `inicioAt`) · `agendada` (futuro) · `ao_vivo`
  (dentro da janela) · `encerrada` (passou), reusando `computarEstadoAula` de `app/aula/lib.ts`.

---

## 4. Rota pública `/aula/[slug]`
- Mover `app/aula/page.tsx` → `app/aula/[slug]/page.tsx`, carregando `getConfigBySlug(params.slug)`.
  404 se não achar.
- `app/aula/page.tsx` (sem slug) e `app/page.tsx`: redirecionam pra `/aula/<slug da aula
  ativa mais recente>` (compat com links antigos).
- `trackAula`, chat, ao-vivo passam a mandar/receber **`aula_id`** (além de `aula_date`).
  Rotas validam que o `aula_id` existe. Chaves de `localStorage`/UTM passam a usar `aula_id`
  (some a colisão de duas aulas no mesmo dia).
- `/api/aula/ao-vivo`: recebe `aula_id`; lê `contadorPiso/multiplicador` **da config daquela
  aula** (hoje pega da única ativa).

---

## 5. Rotas admin (scoping por aula)
- `POST /api/admin/aulas` — **criar** aula (nome, slug auto-editável) a partir do seed ou
  **duplicando** outra. `PATCH /api/admin/aulas/[id]` — arquivar/desarquivar.
- `POST /api/admin/aula/config` → passa a receber `aulaId` e faz update-by-id (fim do
  upsert-única-ativa).
- `POST /api/admin/aula/roteiro` → recebe `aulaId`; o delete-all vira delete **where
  aula_id**; insert com `aula_id`.
- `POST /api/admin/aula/mensagem` → recebe `aulaId`; deriva `aula_date` da timezone daquela aula.
- Auth `requireAdmin()` inalterada.

---

## 6. Sistema visual (light) — tokens da referência
Trocar os tokens `--admin-*` (hoje dark/light) por um único tema light:
`--admin-bg #F6F6F8` · `--admin-panel #FFFFFF` · `--admin-border #E7E7EA` ·
`--admin-text #17171C` · `--admin-muted #6E7076` · `--admin-faint #9B9DA3` ·
`--admin-accent #F59E0B` (texto do botão sobre âmbar: `#231603`) · sombra de card sutil.
Remover `next-themes`/toggle/`ThemeProviderClient`/`@custom-variant dark`. Inter (texto),
JetBrains Mono (números/IDs/tempo). Sidebar 232px branca. Foco visível âmbar. Contraste AA.

---

## 7. Telas do admin (inventário)
1. **`/admin` — Lista de aulas** (nova): header "Aulas" + botão **Nova aula**. Cada aula em
   card/linha: nome, slug/link, status (chip ao vivo/agendada/encerrada/rascunho), data, e
   um resumo (acessos, pico, cliques). Clicar → painel da aula. Menu: duplicar, arquivar,
   abrir link público.
2. **`/admin/aulas/[id]` — Painel da aula** com `PageHeader` (nome + status + link público) e
   **tabs**:
   - **Visão geral** — KPIs atuais (acessos, pico, viram o pitch, retenção-até-pitch, cliques,
     CTR) + funil (Visitas→Acessou→Pitch→Clicou), no visual da referência. (Curva de retenção
     e KPIs ricos = Marco 2; aqui fica a versão com os dados de hoje, já bonita.)
   - **Configuração** — tabs internas (Aula/Oferta/Notificações/Branding), campos em 2 colunas,
     **preview fiel fixo**, **footer de salvar fixo**. (Campos de imagem seguem URL neste
     marco; upload é Marco 4.)
   - **Roteiro** — adicionar no topo, lista abaixo, **preview do chat**. (Importar CSV = M4.)
   - **Mensagens** — compor + preview da bolha oficial.
   - **Contatos** — stub: lista de quem acessou (derivada de `aula_eventos.acesso` com email),
     simples. (Exportar CSV = M4.)
3. **`/admin/login`** — repaginada no tema light.

O que já existe (ConfigForm, RoteiroEditor, MensagemForm, AulaPreview, ChatPreview, Funnel,
PageShell/Header/Card/Section, Tabs, Tooltip) é **reaproveitado**, agora (a) scoped por
`aulaId` e (b) no tema light. `AdminSidebar` passa a listar: Aulas (lista) + navegação dentro
da aula quando numa aula.

---

## 8. Preservação / compatibilidade / segurança
- **`/aula` runtime**: comportamento visual inalterado — só passa a carregar por slug e a mandar
  `aula_id` no tracking, e a gravar device/posição no heartbeat (aditivo).
- **Migração idempotente e não-destrutiva** (nenhum `DROP`/`DELETE` de dados; só `ALTER ADD`,
  backfill, `DROP INDEX` do índice de unicidade). Registrar no `schema_migrations` (007).
- `/setup` e `content/config.ts`: seed passa a criar a **aula 1** (com slug/nome).
- Travas de segurança do CLAUDE.md valem (sem exibir chaves, sem push/deploy sem confirmação).

---

## 9. Verificação
- `npm run lint` (0), `npx jest` (verde — atualizar testes de `getRoteiro`/roteiro-linhas pra
  `aulaId`), `npm run build` (envs placeholder).
- Migração roda limpa num banco com a linha atual (backfill preenche `aula_id`/`slug`/`nome`).
- Round-trips preservados: salvar config/roteiro/mensagem de uma aula específica grava só nela.
- `/aula/[slug]` renderiza a aula certa; `/aula` redireciona.
- Revisor independente no fim (modelo de dados + scoping + a11y/contraste light).

---

## 10. Decomposição em tasks (alto nível, pro plano)
1. Migração `007` + `lib/aula-config` (getBySlug/ById/listAulas, getRoteiro(aulaId)) + testes.
2. `/aula/[slug]` + redirects + tracking com `aula_id` + device/posição no heartbeat.
3. Rotas admin scoped por `aulaId` + criar/duplicar/arquivar aula.
4. Tema light (tokens, remover next-themes) — base visual.
5. `/admin` lista de aulas (nova).
6. Painel da aula + tabs + Visão geral (KPIs+funil) redesenhada.
7. Configuração redesenhada (2-col + preview + save fixo), scoped.
8. Roteiro redesenhado (add-topo + lista + preview), scoped.
9. Mensagens redesenhada + Contatos stub, scoped.
10. Passada de consistência + revisão final.

---

## Self-review
- Cobre: entidades (2), rota pública (4), admin IA (7), redesign light (6/7), scoping de todas
  as rotas (5), instrumentação-semente pro M2 (2.4). ✓
- Não-destrutivo/idempotente na migração. ✓
- Fora de escopo explícito (curva/gráficos, vendas, uploads, CSV) → M2/M3/M4. ✓
- Tipos: `aulaId: string` consistente entre lib, rotas e telas; `AulaConfig` ganha `id/slug/nome`. ✓
