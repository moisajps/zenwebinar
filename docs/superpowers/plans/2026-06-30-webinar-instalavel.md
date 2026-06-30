# Webinar ao Vivo — Produto Instalável — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Empacotar a feature de webinar ao vivo num produto instalável genérico (Next.js + Supabase + Vercel), com toda a configuração editável por um admin em runtime e instalação conduzida pelo Claude.

**Architecture:** Repo novo `webinar-ao-vivo`, separado do projeto-fonte `fortun-caroltabuas`. Duas camadas: (1) **base** = a página pública `/aula`, APIs, admin e tabelas `aula_*`; (2) **motor de onboarding** = `iniciar.sh`/`.ps1`, `/setup`, `/doctor`, etc., copiado dos assets da skill `criar-produto-instalavel`. O que era estático em código (`config.ts`, `CHAT_SCRIPT`) passa a viver no banco (`aula_config`, `aula_roteiro`), editado por formulários no admin. Muito do código é **portado e genericizado** do projeto-fonte; lógica nova pura é escrita por TDD.

**Tech Stack:** Next.js 16.1.7 (App Router), React 19.2.3, Tailwind CSS 4, TypeScript 5, `@supabase/supabase-js`, `@supabase/ssr`, Jest + Testing Library. Deploy Vercel.

## Convenções deste plano

- **SOURCE** = `/Users/moisa/Downloads/claude/fortun-caroltabuas` (repo-fonte, somente leitura — nunca modificar).
- **DEST** = `/Users/moisa/Downloads/claude/webinar-ao-vivo` (repo do produto; cwd de todos os comandos).
- Branch de trabalho já criada: `feat/base-instalavel`.
- Para arquivos **portados**, o passo "copiar" usa `cp` do SOURCE e os passos seguintes aplicam edits de genericização explícitos. Não re-transcrever arquivos grandes já existentes no SOURCE.
- TDD (teste-primeiro) é obrigatório para **lógica pura** (schedule, parser de roteiro, fórmula do contador, UTM, loader de config). Componentes de UI portados são verificados por `npm run build` + `npm run lint` + checagem manual descrita.

## Global Constraints

- Next.js **16.1.7**, React **19.2.3**, Tailwind CSS **4**, TypeScript **5**. (versões idênticas ao SOURCE)
- ESLint: usar **flat config** direto (`eslint-config-next/core-web-vitals` + `/typescript`). NÃO usar `FlatCompat` (quebra com erro circular no Next 16).
- Scripts Node de setup: usar **`execFileSync`** (sem shell), nunca `exec` com string.
- Marcador de setup **`.webinar/`** deve estar no `.gitignore` (senão clone novo vem "configurado").
- Idioma do produto: **português do Brasil** em toda UI e mensagens.
- **Nenhum dado real** de cliente no repo: proibido conter "Carol", "Scoralick", "caroltabuas", "PrecificaFacil", "kiwify", ou IDs de vídeo/links reais do SOURCE. Tudo vira placeholder/seed neutro.
- Prefixo de tabelas: **`aula_`**.
- Service role key só no servidor; nunca commitar `.env*`; nunca exibir chaves.
- Placeholders dos assets a substituir: `{{NOME_PRODUTO}}`="Webinar ao Vivo", `{{FRASE_OBJETIVO}}`="colocar seu webinar no ar", `{{MARCADOR}}`=`.webinar`.

---

## File Structure

```
webinar-ao-vivo/
├── app/
│   ├── layout.tsx, globals.css, page.tsx          (raiz: redireciona p/ /aula)
│   ├── aula/
│   │   ├── page.tsx          (server: fetch config+roteiro, branding)
│   │   ├── lib.ts            (computarEstadoAula — schedule)
│   │   ├── config-types.ts   (tipos AulaConfig/Oferta/etc. — sem dados)
│   │   ├── track.ts          (tracking + linkComUtm)
│   │   ├── AulaGate.tsx       (gate nome+email)
│   │   ├── AulaContent.tsx    (fases + YouTube player travado)
│   │   ├── LiveElements.tsx   (chat sincronizado + contador real)
│   │   ├── Offer.tsx, Notificacoes.tsx, Materiais.tsx
│   ├── api/aula/
│   │   ├── verificar/route.ts (HMAC cookie + captura lead)
│   │   ├── chat/route.ts, evento/route.ts
│   │   └── ao-vivo/route.ts   (contador ao vivo real)
│   ├── admin/
│   │   ├── layout.tsx, login/page.tsx
│   │   ├── page.tsx           (dashboard KPIs)
│   │   ├── aula/page.tsx + forms (config, oferta, notificações)
│   │   ├── roteiro/page.tsx   (editor colar+preview)
│   │   └── mensagem/page.tsx  (msg oficial)
│   └── api/admin/aula/
│       ├── config/route.ts, roteiro/route.ts, mensagem/route.ts
├── content/config.ts          (defaults de seed + branding do produto)
├── lib/
│   ├── supabase.ts (admin), supabase-ssr.ts, supabase-browser.ts
│   ├── aula-config.ts (loader DB→config c/ fallback ao seed)
│   ├── roteiro-parse.ts (parser "tempo | nome | mensagem")
│   └── require-admin.ts
├── supabase/migrations/        (5 arquivos aula_*)
├── public/                     (placeholders: og, banner, logo)
├── iniciar.sh / iniciar.ps1, setup/check.mjs, bootstrap/*
├── .claude/ (settings.json, hooks/, commands/, setup/dependencias.md)
├── CLAUDE.md, README.md, .gitignore
└── (config raiz: package.json, tsconfig.json, next.config.ts, etc.)
```

---

## Task 1: Scaffold base (Next 16 + React 19 + Tailwind 4 + TS)

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `eslint.config.mjs`, `next-env.d.ts`(auto), `jest.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Copy-ref (SOURCE): `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `tailwind.config.ts`, `eslint.config.mjs`, `app/layout.tsx`, `app/globals.css`

**Interfaces:**
- Produces: projeto Next que builda e linta limpo; rota `/` redireciona para `/aula`.

- [ ] **Step 1: Copiar arquivos de config do SOURCE**

```bash
cd /Users/moisa/Downloads/claude/webinar-ao-vivo
S=/Users/moisa/Downloads/claude/fortun-caroltabuas
cp "$S/tsconfig.json" "$S/next.config.ts" "$S/postcss.config.mjs" "$S/tailwind.config.ts" "$S/eslint.config.mjs" .
mkdir -p app
cp "$S/app/globals.css" app/globals.css
```

- [ ] **Step 2: Criar `package.json` enxuto** (só o que o webinar usa — sem `@anthropic-ai/sdk`, `recharts`, `framer-motion`, `canvas-confetti`, `nanoid`, `csv-parse` que são de outras features)

```json
{
  "name": "webinar-ao-vivo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "@supabase/ssr": "^0.9.0",
    "@supabase/supabase-js": "^2.99.2",
    "next": "16.1.7",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "server-only": "^0.0.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/jest": "^30.0.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.7",
    "jest": "^30.3.0",
    "jest-environment-jsdom": "^30.3.0",
    "tailwindcss": "^4",
    "ts-jest": "^29.4.6",
    "typescript": "^5"
  }
}
```

- [ ] **Step 3: Copiar `jest.config.ts` e mocks do SOURCE**

```bash
S=/Users/moisa/Downloads/claude/fortun-caroltabuas
cp "$S/jest.config.ts" jest.config.ts
cp -r "$S/__mocks__" __mocks__ 2>/dev/null || true
```

Conferir que `jest.config.ts` não referencia caminhos inexistentes; se referenciar `jest.setup.ts`, copiá-lo também (`cp "$S/jest.setup.ts" .` se existir).

- [ ] **Step 4: Criar `app/layout.tsx`** (genérico — sem fontes/branding da Carol). Copiar do SOURCE e remover qualquer import de fonte específica ou metadata com nome real:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Webinar ao Vivo',
  description: 'Aula ao vivo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

Se `app/globals.css` do SOURCE tiver `@font-face`/variáveis de fonte custom, manter (são genéricas); se referenciar arquivos de fonte em `public/fonts`, copiar a pasta `public/fonts` do SOURCE.

- [ ] **Step 5: Criar `app/page.tsx`** (redireciona p/ /aula)

```tsx
import { redirect } from 'next/navigation'
export default function Home() { redirect('/aula') }
```

- [ ] **Step 6: Instalar e verificar build/lint**

```bash
npm install
npm run lint
npm run build
```
Expected: lint sem erros; build falha em `/aula` por enquanto? Não — ainda não há `/aula`; o `redirect` em `/` builda. Se o build reclamar de `/aula` inexistente, é só o redirect em runtime (ok). Build deve **passar**.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next 16 + React 19 + Tailwind 4 + TS"
```

---

## Task 2: Clientes Supabase + env

**Files:**
- Create: `lib/supabase.ts`, `lib/supabase-ssr.ts`, `lib/supabase-browser.ts`, `.env.example`, `types/env.d.ts`
- Copy-ref (SOURCE): `lib/supabase.ts`, `lib/supabase-ssr.ts`, `lib/supabase-browser.ts`

**Interfaces:**
- Produces:
  - `supabaseAdmin` (de `lib/supabase.ts`) — client service-role, server-only.
  - `createSupabaseServer()` (de `lib/supabase-ssr.ts`) — client SSR p/ `auth.getUser()`.
  - `createSupabaseBrowser()` (de `lib/supabase-browser.ts`) — client anon no browser.

- [ ] **Step 1: Copiar os 3 clients do SOURCE**

```bash
S=/Users/moisa/Downloads/claude/fortun-caroltabuas
mkdir -p lib types
cp "$S/lib/supabase.ts" "$S/lib/supabase-ssr.ts" "$S/lib/supabase-browser.ts" lib/
```

- [ ] **Step 2: Abrir cada um e remover acoplamentos**

Ler `lib/supabase.ts`, `lib/supabase-ssr.ts`, `lib/supabase-browser.ts`. Garantir que só usam as envs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Remover qualquer import de outros módulos do SOURCE (ex.: helpers de projeto). Se `supabase-browser.ts` referenciar tabelas/tipos específicos, deixar genérico (só `createBrowserClient`).

- [ ] **Step 3: Criar `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 4: Criar `types/env.d.ts`**

```ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    SUPABASE_SERVICE_ROLE_KEY: string
  }
}
export {}
```

- [ ] **Step 5: Verificar typecheck**

```bash
npx tsc --noEmit
```
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: clientes supabase (admin/ssr/browser) + env"
```

---

## Task 3: Migrations das tabelas `aula_*`

**Files:**
- Create: `supabase/migrations/001_aula_chat.sql`, `002_aula_eventos.sql`, `003_aula_inscritos.sql`, `004_aula_config.sql`, `005_aula_roteiro.sql`
- Copy-ref (SOURCE): `supabase/migrations/023_aula_chat.sql`, `024_aula_eventos.sql`, `025_aula_inscritos.sql`, `026_aula_chat_is_official.sql`

**Interfaces:**
- Produces: schema completo. `aula_config` (1 linha ativa), `aula_roteiro` (linhas do chat populado), + as 3 existentes.

- [ ] **Step 1: `001_aula_chat.sql`** (fundir 023 + a coluna is_official de 026)

```sql
-- Chat interativo das aulas ao vivo (mensagens reais + oficiais)
CREATE TABLE aula_chat (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  aula_date   date        NOT NULL,
  user_name   text        NOT NULL,
  message     text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 300),
  hidden      boolean     NOT NULL DEFAULT false,
  is_official boolean     NOT NULL DEFAULT false
);
CREATE INDEX ON aula_chat (aula_date, created_at);
ALTER TABLE aula_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura publica" ON aula_chat FOR SELECT USING (hidden = false);
CREATE POLICY "insercao service role" ON aula_chat FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

- [ ] **Step 2: `002_aula_eventos.sql`** (copiar 024 verbatim)

```sql
CREATE TABLE aula_eventos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  aula_date   date        NOT NULL,
  session_id  text        NOT NULL,
  email       text,
  event_type  text        NOT NULL,
  metadata    jsonb
);
CREATE INDEX aula_eventos_date_type_idx ON aula_eventos (aula_date, event_type, created_at);
CREATE INDEX aula_eventos_date_session_idx ON aula_eventos (aula_date, session_id);
ALTER TABLE aula_eventos ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 3: `003_aula_inscritos.sql`** (copiar 025 verbatim)

```sql
CREATE TABLE aula_inscritos (
  email      text PRIMARY KEY,
  first_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aula_inscritos ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 4: `004_aula_config.sql`** (nova — 1 linha ativa)

```sql
-- Configuração do webinar, editada pelo admin em runtime. 1 linha ativa.
CREATE TABLE aula_config (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ativa                    boolean     NOT NULL DEFAULT true,
  updated_at               timestamptz NOT NULL DEFAULT now(),
  titulo                   text        NOT NULL DEFAULT 'Aula ao vivo',
  seo_descricao            text        NOT NULL DEFAULT 'Participe da aula ao vivo.',
  youtube_video_id         text        NOT NULL DEFAULT '',
  inicio_at                timestamptz,
  duracao_min              int         NOT NULL DEFAULT 100,
  recorrencia              jsonb,                       -- { weekday:int, from_date:'YYYY-MM-DD' } | null
  timezone                 text        NOT NULL DEFAULT 'America/Sao_Paulo',
  replay_habilitado        boolean     NOT NULL DEFAULT false,
  pitch_segundos           int         NOT NULL DEFAULT 1800,
  chat_offset_segundos     int         NOT NULL DEFAULT 0,
  ao_vivo_fim_segundos     int         NOT NULL DEFAULT 6000,
  contador_piso            int         NOT NULL DEFAULT 0,
  contador_multiplicador   numeric     NOT NULL DEFAULT 1.0,
  oferta                   jsonb,
  notificacoes             jsonb,
  materiais                jsonb,
  branding                 jsonb       NOT NULL DEFAULT '{"marca":"Webinar","areaLabel":"Área do Aluno","teamName":"Equipe","ogImage":"/og-aula.jpg"}'::jsonb
);
-- Só pode haver 1 config ativa
CREATE UNIQUE INDEX aula_config_ativa_idx ON aula_config (ativa) WHERE ativa = true;
ALTER TABLE aula_config ENABLE ROW LEVEL SECURITY;
-- Sem policies: leitura/escrita só via service role (server).
```

- [ ] **Step 5: `005_aula_roteiro.sql`** (nova — chat populado)

```sql
-- Roteiro do chat populado, sincronizado por tempo. Editado pelo admin.
CREATE TABLE aula_roteiro (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  delay_segundos  int         NOT NULL,
  nome            text        NOT NULL,
  mensagem        text        NOT NULL,
  ordem           int         NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX aula_roteiro_ordem_idx ON aula_roteiro (delay_segundos, ordem);
ALTER TABLE aula_roteiro ENABLE ROW LEVEL SECURITY;
-- Sem policies: leitura server-side (service role); escrita só service role.
```

- [ ] **Step 6: Validar SQL localmente** (sintaxe)

```bash
for f in supabase/migrations/00*.sql; do echo "== $f =="; done
```
(Validação real ocorre no `/setup` ao aplicar no Supabase; aqui só garantir que os 5 arquivos existem e estão bem-formados a olho.)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: migrations aula_config, aula_roteiro + chat/eventos/inscritos"
```

---

## Task 4: Tipos de config + seed (`config-types.ts` + `content/config.ts`)

**Files:**
- Create: `app/aula/config-types.ts`, `content/config.ts`
- Reference (SOURCE): `app/aula/config.ts` (extrair só os TIPOS; descartar os dados reais)

**Interfaces:**
- Produces:
  - Tipos: `Oferta`, `NotificacoesCompra`, `MateriaisGrupo`, `Materiais`, `Branding`, `AulaConfig`, `EstadoAula`; função `isPlaceholder(value: string): boolean`.
  - `SEED_CONFIG: AulaConfig` e `SEED_ROTEIRO: { delay: number; name: string; msg: string }[]` (de `content/config.ts`) — dados neutros usados pra semear o banco no `/setup`.

- [ ] **Step 1: Criar `app/aula/config-types.ts`** — copiar os blocos `export type ...` de `SOURCE/app/aula/config.ts` (linhas dos types `Oferta`, `NotificacoesCompra`, `MateriaisGrupo`, `Materiais`, `AulaConfig`, `EstadoAula`) e a função `isPlaceholder`. Adicionar `Branding` e ajustar `AulaConfig`:

```ts
export type Branding = {
  marca: string       // ex.: "Webinar" — usado nos headers/footers
  areaLabel: string   // ex.: "Área do Aluno"
  teamName: string    // nome exibido nas mensagens oficiais
  ogImage: string     // caminho da imagem OG
}

export type Oferta = {
  ativo: boolean
  pitchSegundos: number
  patrocinado: string
  bannerImagem: string
  marcaLogo: string
  marcaTitulo: string
  marca: string
  descricao: string
  cta: string
  link: string
  cardChamada: string
  cardPreco: string
}

export type NotificacoesCompra = {
  ativo: boolean
  inicioAposPitchSegundos: number
  intervaloMinSegundos: number
  intervaloMaxSegundos: number
  total: number
  produtoLabel: string
}

export type MateriaisGrupo = { categoria: string; itens: readonly string[]; nota?: string }
export type Materiais = { titulo: string; subtitulo: string; grupos: readonly MateriaisGrupo[] }

export type AulaConfig = {
  titulo: string
  seoDescricao: string
  youtubeVideoId: string
  inicioAt: string | null         // ISO; null = sem aula agendada
  duracaoMin: number
  recorrencia: { weekday: number; fromDate: string } | null
  timezone: string
  replayHabilitado: boolean
  pitchSegundos: number
  chatOffsetSegundos: number
  aoVivoFimSegundos: number
  contadorPiso: number
  contadorMultiplicador: number
  oferta?: Oferta
  notificacoes?: NotificacoesCompra
  materiais?: Materiais
  branding: Branding
}

export type EstadoAula =
  | { fase: 'aguardando'; proximoInicio: string; isToday: boolean }
  | { fase: 'ao_vivo';    inicio: string; fim: string }
  | { fase: 'replay';     proximoInicio: string }

export function isPlaceholder(value: string): boolean {
  return /X{4,}/.test(value) || value === ''
}
```

- [ ] **Step 2: Criar `content/config.ts`** — defaults de seed NEUTROS (sem dados reais) + roteiro genérico curto

```ts
// Defaults de seed do produto. O instalador pode ajustar o branding aqui uma vez;
// o conteúdo do webinar é editado depois pelo admin (vai pro banco aula_config).
import type { AulaConfig } from '@/app/aula/config-types'

export const SEED_CONFIG: AulaConfig = {
  titulo: 'Aula ao vivo',
  seoDescricao: 'Participe da nossa aula ao vivo.',
  youtubeVideoId: '',                 // admin define
  inicioAt: null,                     // admin agenda
  duracaoMin: 100,
  recorrencia: null,
  timezone: 'America/Sao_Paulo',
  replayHabilitado: false,
  pitchSegundos: 1800,
  chatOffsetSegundos: 0,
  aoVivoFimSegundos: 6000,
  contadorPiso: 0,
  contadorMultiplicador: 1.0,
  oferta: {
    ativo: false,
    pitchSegundos: 1800,
    patrocinado: 'Oferta exclusiva da aula',
    bannerImagem: '/oferta-banner.png',
    marcaLogo: '/marca-logo.png',
    marcaTitulo: 'Sua oferta especial',
    marca: 'Sua Marca',
    descricao: 'Descreva aqui o benefício principal da sua oferta.',
    cta: 'Quero garantir',
    link: 'https://exemplo.com/checkout',
    cardChamada: 'Garanta agora por',
    cardPreco: '12x de R$ 00,00 ou R$ 000,00 à vista',
  },
  notificacoes: {
    ativo: false,
    inicioAposPitchSegundos: 300,
    intervaloMinSegundos: 25,
    intervaloMaxSegundos: 70,
    total: 20,
    produtoLabel: 'a sua oferta',
  },
  branding: {
    marca: 'Webinar',
    areaLabel: 'Área do Aluno',
    teamName: 'Equipe',
    ogImage: '/og-aula.jpg',
  },
}

// Roteiro neutro de exemplo (~15 linhas). delay = segundos desde o início do vídeo.
export const SEED_ROTEIRO: { delay: number; name: string; msg: string }[] = [
  { delay: 3,   name: 'Ana',      msg: 'Boa noite!' },
  { delay: 6,   name: 'Marcos',   msg: 'Cheguei 🙌' },
  { delay: 9,   name: 'Bia',      msg: 'Ansiosa pela aula' },
  { delay: 14,  name: 'Carla',    msg: 'Está ótimo o som por aqui' },
  { delay: 22,  name: 'Diego',    msg: 'De onde todo mundo é?' },
  { delay: 30,  name: 'Ana',      msg: 'Falo de São Paulo' },
  { delay: 38,  name: 'Bia',      msg: 'Aqui do Rio!' },
  { delay: 52,  name: 'Eduardo',  msg: 'Primeira vez assistindo, animado' },
  { delay: 70,  name: 'Fernanda', msg: 'Anotando tudo 📝' },
  { delay: 95,  name: 'Marcos',   msg: 'Muito bom esse conteúdo' },
  { delay: 130, name: 'Carla',    msg: 'Dá pra rever depois?' },
  { delay: 180, name: 'Diego',    msg: 'Faz sentido, obrigado!' },
  { delay: 240, name: 'Ana',      msg: 'Top demais 👏' },
  { delay: 300, name: 'Fernanda', msg: 'Curtindo bastante' },
  { delay: 360, name: 'Bia',      msg: 'Melhor aula até agora' },
]
```

- [ ] **Step 3: Verificar typecheck**

```bash
npx tsc --noEmit
```
Expected: sem erros (o alias `@/*` deve existir no tsconfig copiado; conferir `paths`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: tipos de config + seed neutro (config-types, content/config)"
```

---

## Task 5: Loader de config DB→app (`lib/aula-config.ts`)

**Files:**
- Create: `lib/aula-config.ts`, `__tests__/aula-config.test.ts`

**Interfaces:**
- Consumes: `supabaseAdmin` (Task 2), tipos `AulaConfig` (Task 4), `SEED_CONFIG` (Task 4).
- Produces:
  - `rowToConfig(row: Record<string, unknown> | null): AulaConfig` — converte a linha do banco (snake_case + jsonb) no `AulaConfig` (camelCase), caindo no `SEED_CONFIG` campo a campo quando faltar.
  - `getActiveConfig(): Promise<AulaConfig>` — busca a linha `ativa=true` e retorna `rowToConfig`.
  - `getRoteiro(): Promise<{ delay: number; name: string; msg: string }[]>` — lê `aula_roteiro` ordenado; se vazio, retorna `SEED_ROTEIRO`.

- [ ] **Step 1: Escrever o teste (falha)** — `__tests__/aula-config.test.ts`

```ts
import { rowToConfig } from '@/lib/aula-config'
import { SEED_CONFIG } from '@/content/config'

describe('rowToConfig', () => {
  it('cai no seed quando row é null', () => {
    expect(rowToConfig(null)).toEqual(SEED_CONFIG)
  })

  it('mapeia snake_case e jsonb para o AulaConfig', () => {
    const cfg = rowToConfig({
      titulo: 'Minha Aula',
      youtube_video_id: 'abc123',
      inicio_at: '2026-07-01T23:00:00.000Z',
      duracao_min: 90,
      replay_habilitado: true,
      pitch_segundos: 1200,
      contador_piso: 80,
      contador_multiplicador: 1.5,
      oferta: { ativo: true, link: 'https://x.com', cta: 'Comprar' },
      branding: { marca: 'X', areaLabel: 'Alunos', teamName: 'Time X', ogImage: '/o.jpg' },
    })
    expect(cfg.titulo).toBe('Minha Aula')
    expect(cfg.youtubeVideoId).toBe('abc123')
    expect(cfg.inicioAt).toBe('2026-07-01T23:00:00.000Z')
    expect(cfg.duracaoMin).toBe(90)
    expect(cfg.replayHabilitado).toBe(true)
    expect(cfg.contadorPiso).toBe(80)
    expect(cfg.contadorMultiplicador).toBe(1.5)
    expect(cfg.oferta?.ativo).toBe(true)
    expect(cfg.branding.marca).toBe('X')
    // campo ausente cai no seed
    expect(cfg.timezone).toBe(SEED_CONFIG.timezone)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npx jest aula-config -t rowToConfig
```
Expected: FAIL ("Cannot find module '@/lib/aula-config'").

- [ ] **Step 3: Implementar `lib/aula-config.ts`**

```ts
import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { SEED_CONFIG, SEED_ROTEIRO } from '@/content/config'
import type { AulaConfig } from '@/app/aula/config-types'

type Row = Record<string, unknown>
const pick = <T,>(v: unknown, fallback: T): T => (v === null || v === undefined ? fallback : (v as T))

export function rowToConfig(row: Row | null): AulaConfig {
  if (!row) return SEED_CONFIG
  const s = SEED_CONFIG
  return {
    titulo: pick(row.titulo, s.titulo),
    seoDescricao: pick(row.seo_descricao, s.seoDescricao),
    youtubeVideoId: pick(row.youtube_video_id, s.youtubeVideoId),
    inicioAt: pick(row.inicio_at as string | null, s.inicioAt),
    duracaoMin: pick(row.duracao_min, s.duracaoMin),
    recorrencia: pick(row.recorrencia as AulaConfig['recorrencia'], s.recorrencia),
    timezone: pick(row.timezone, s.timezone),
    replayHabilitado: pick(row.replay_habilitado, s.replayHabilitado),
    pitchSegundos: pick(row.pitch_segundos, s.pitchSegundos),
    chatOffsetSegundos: pick(row.chat_offset_segundos, s.chatOffsetSegundos),
    aoVivoFimSegundos: pick(row.ao_vivo_fim_segundos, s.aoVivoFimSegundos),
    contadorPiso: pick(row.contador_piso, s.contadorPiso),
    contadorMultiplicador: Number(pick(row.contador_multiplicador, s.contadorMultiplicador)),
    oferta: pick(row.oferta as AulaConfig['oferta'], s.oferta),
    notificacoes: pick(row.notificacoes as AulaConfig['notificacoes'], s.notificacoes),
    materiais: pick(row.materiais as AulaConfig['materiais'], s.materiais),
    branding: pick(row.branding as AulaConfig['branding'], s.branding),
  }
}

export async function getActiveConfig(): Promise<AulaConfig> {
  const { data } = await supabaseAdmin.from('aula_config').select('*').eq('ativa', true).maybeSingle()
  return rowToConfig(data ?? null)
}

export async function getRoteiro(): Promise<{ delay: number; name: string; msg: string }[]> {
  const { data } = await supabaseAdmin
    .from('aula_roteiro')
    .select('delay_segundos, nome, mensagem, ordem')
    .order('delay_segundos', { ascending: true })
    .order('ordem', { ascending: true })
  if (!data || data.length === 0) return SEED_ROTEIRO
  return data.map(r => ({ delay: r.delay_segundos as number, name: r.nome as string, msg: r.mensagem as string }))
}
```

Nota: `rowToConfig` é pura (testável). `getActiveConfig`/`getRoteiro` tocam o banco (não testados unitariamente). Para o teste rodar sem `server-only`/supabase, ver Step 4.

- [ ] **Step 4: Isolar import no teste** — para evitar carregar `supabaseAdmin` no teste de `rowToConfig`, mover `rowToConfig`, `SEED` e tipos de forma que o teste importe só funções puras. Se o `import 'server-only'` quebrar o Jest, adicionar mock em `__mocks__/server-only.js` com `module.exports = {}` e mapear `@/lib/supabase` para um stub no `jest.config.ts` (`moduleNameMapper`). Aplicar o mock mínimo necessário até o teste passar.

- [ ] **Step 5: Rodar e ver passar**

```bash
npx jest aula-config
```
Expected: PASS (2 testes).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: loader de config DB->app com fallback ao seed (TDD)"
```

---

## Task 6: Schedule (`app/aula/lib.ts`) — config-driven

**Files:**
- Create: `app/aula/lib.ts`, `__tests__/aula-lib.test.ts`
- Reference (SOURCE): `app/aula/lib.ts`

**Interfaces:**
- Consumes: tipos `AulaConfig`, `EstadoAula` (Task 4).
- Produces: `computarEstadoAula(agora: Date, cfg: AulaConfig): EstadoAula`. Diferente do SOURCE: deriva a agenda de `cfg.inicioAt` + `cfg.duracaoMin` + `cfg.recorrencia` (não de `aulaSchedule`/`horaInicio`).

- [ ] **Step 1: Escrever o teste (falha)** — `__tests__/aula-lib.test.ts`

```ts
import { computarEstadoAula } from '@/app/aula/lib'
import type { AulaConfig } from '@/app/aula/config-types'

const base: AulaConfig = {
  titulo: 't', seoDescricao: 'd', youtubeVideoId: 'v',
  inicioAt: '2026-07-01T23:00:00.000Z', // 20:00 BRT (UTC-3)
  duracaoMin: 100, recorrencia: null, timezone: 'America/Sao_Paulo',
  replayHabilitado: false, pitchSegundos: 1800, chatOffsetSegundos: 0,
  aoVivoFimSegundos: 6000, contadorPiso: 0, contadorMultiplicador: 1,
  branding: { marca: 'W', areaLabel: 'A', teamName: 'T', ogImage: '/o.jpg' },
}

describe('computarEstadoAula (sem recorrência)', () => {
  it('antes do início → aguardando', () => {
    const e = computarEstadoAula(new Date('2026-07-01T22:00:00Z'), base)
    expect(e.fase).toBe('aguardando')
  })
  it('dentro da janela → ao_vivo', () => {
    const e = computarEstadoAula(new Date('2026-07-01T23:30:00Z'), base)
    expect(e.fase).toBe('ao_vivo')
  })
  it('depois da janela → replay', () => {
    const e = computarEstadoAula(new Date('2026-07-02T02:00:00Z'), base)
    expect(e.fase).toBe('replay')
  })
  it('sem inicioAt → aguardando (sem data)', () => {
    const e = computarEstadoAula(new Date(), { ...base, inicioAt: null })
    expect(e.fase).toBe('aguardando')
  })
})

describe('computarEstadoAula (recorrência semanal)', () => {
  const rec: AulaConfig = { ...base, inicioAt: '2026-07-01T23:00:00.000Z',
    recorrencia: { weekday: 3, fromDate: '2026-07-01' } } // quarta
  it('próxima quarta após a janela → aguardando dessa quarta', () => {
    const e = computarEstadoAula(new Date('2026-07-03T12:00:00Z'), rec) // sexta
    expect(e.fase === 'aguardando' || e.fase === 'replay').toBe(true)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npx jest aula-lib
```
Expected: FAIL ("Cannot find module").

- [ ] **Step 3: Implementar `app/aula/lib.ts`** — portar a lógica de timezone do SOURCE (`partsBR`, UTC-3) e reescrever o agendamento sobre `inicioAt`/`duracaoMin`/`recorrencia`:

```ts
import type { AulaConfig, EstadoAula } from './config-types'

function partsBR(d: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
  const p = Object.fromEntries(fmt.formatToParts(d).map(x => [x.type, x.value]))
  return { yyyy: +p.year, mm: +p.month, dd: +p.day, hh: +p.hour % 24, mi: +p.minute }
}

// Soma dias a uma data ISO mantendo hora/min (UTC).
function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString()
}

// Próxima ocorrência (>= agora) do inicioAt considerando recorrência semanal.
function proximaOcorrencia(agora: Date, cfg: AulaConfig): { inicio: Date; fim: Date } | null {
  if (!cfg.inicioAt) return null
  const dur = cfg.duracaoMin * 60_000
  let inicio = new Date(cfg.inicioAt)
  if (!cfg.recorrencia) {
    return { inicio, fim: new Date(inicio.getTime() + dur) }
  }
  // Recorrência: avança em passos de 7 dias até a janela cobrir/ultrapassar agora.
  let guard = 0
  while (new Date(inicio.getTime() + dur) < agora && guard < 520) {
    inicio = new Date(addDaysIso(inicio.toISOString(), 7))
    guard++
  }
  return { inicio, fim: new Date(inicio.getTime() + dur) }
}

export function computarEstadoAula(agora: Date, cfg: AulaConfig): EstadoAula {
  const occ = proximaOcorrencia(agora, cfg)
  if (!occ) return { fase: 'aguardando', proximoInicio: agora.toISOString(), isToday: false }
  const { inicio, fim } = occ
  if (agora < inicio) {
    const isToday = partsBR(agora, cfg.timezone).dd === partsBR(inicio, cfg.timezone).dd
    return { fase: 'aguardando', proximoInicio: inicio.toISOString(), isToday }
  }
  if (agora <= fim) {
    return { fase: 'ao_vivo', inicio: inicio.toISOString(), fim: fim.toISOString() }
  }
  // Passou a janela. Com recorrência, proximaOcorrencia já teria avançado; sem ela, é replay.
  const prox = cfg.recorrencia ? new Date(addDaysIso(inicio.toISOString(), 7)).toISOString() : inicio.toISOString()
  return { fase: 'replay', proximoInicio: prox }
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npx jest aula-lib
```
Expected: PASS. Ajustar implementação até verde (atenção ao limite `agora <= fim` vs `<`).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: computarEstadoAula derivado de inicioAt/duracao/recorrencia (TDD)"
```

---

## Task 7: Parser de roteiro (`lib/roteiro-parse.ts`)

**Files:**
- Create: `lib/roteiro-parse.ts`, `__tests__/roteiro-parse.test.ts`

**Interfaces:**
- Produces: `parseRoteiro(text: string): { delay: number; name: string; msg: string }[]` — lê linhas `tempo | nome | mensagem`. `tempo` aceita segundos (`90`) ou `mm:ss`/`hh:mm:ss`. Ignora linhas vazias; lança `Error` com a linha problemática se faltar campo ou tempo inválido.

- [ ] **Step 1: Escrever o teste (falha)** — `__tests__/roteiro-parse.test.ts`

```ts
import { parseRoteiro } from '@/lib/roteiro-parse'

describe('parseRoteiro', () => {
  it('lê segundos puros', () => {
    expect(parseRoteiro('10 | Ana | Oi')).toEqual([{ delay: 10, name: 'Ana', msg: 'Oi' }])
  })
  it('lê mm:ss e hh:mm:ss', () => {
    const r = parseRoteiro('01:30 | Bia | Olá\n01:00:00 | Caio | Fim')
    expect(r[0].delay).toBe(90)
    expect(r[1].delay).toBe(3600)
  })
  it('ignora linhas em branco', () => {
    expect(parseRoteiro('\n10 | Ana | Oi\n\n')).toHaveLength(1)
  })
  it('mensagem pode conter | extra', () => {
    expect(parseRoteiro('5 | Ana | a | b').at(0)?.msg).toBe('a | b')
  })
  it('lança em linha malformada', () => {
    expect(() => parseRoteiro('xx | Ana | Oi')).toThrow()
    expect(() => parseRoteiro('10 | Ana')).toThrow()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npx jest roteiro-parse
```
Expected: FAIL.

- [ ] **Step 3: Implementar `lib/roteiro-parse.ts`**

```ts
function parseTempo(raw: string): number {
  const t = raw.trim()
  if (/^\d+$/.test(t)) return parseInt(t, 10)
  const parts = t.split(':').map(p => p.trim())
  if (parts.length >= 2 && parts.length <= 3 && parts.every(p => /^\d+$/.test(p))) {
    const nums = parts.map(Number)
    return nums.reduce((acc, n) => acc * 60 + n, 0)
  }
  throw new Error(`Tempo inválido: "${raw}"`)
}

export function parseRoteiro(text: string): { delay: number; name: string; msg: string }[] {
  const out: { delay: number; name: string; msg: string }[] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const idx1 = line.indexOf('|')
    const idx2 = line.indexOf('|', idx1 + 1)
    if (idx1 < 0 || idx2 < 0) throw new Error(`Linha malformada (use "tempo | nome | mensagem"): "${line}"`)
    const delay = parseTempo(line.slice(0, idx1))
    const name = line.slice(idx1 + 1, idx2).trim()
    const msg = line.slice(idx2 + 1).trim()
    if (!name || !msg) throw new Error(`Nome ou mensagem vazios: "${line}"`)
    out.push({ delay, name, msg })
  }
  return out
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npx jest roteiro-parse
```
Expected: PASS (5 testes).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: parser de roteiro 'tempo | nome | mensagem' (TDD)"
```

---

## Task 8: Tracking (`app/aula/track.ts`) — UTM genérico

**Files:**
- Create: `app/aula/track.ts`, `__tests__/track.test.ts`
- Reference (SOURCE): `app/aula/track.ts`

**Interfaces:**
- Produces: `getAulaSessionId()`, `trackAula(aulaDate, eventType, metadata?)`, `linkComUtm(link, aulaDate, origem): string`. Igual ao SOURCE, mas `utm_campaign` = `webinar_<data>` (sem `precifica_`).

- [ ] **Step 1: Copiar do SOURCE e genericizar**

```bash
S=/Users/moisa/Downloads/claude/fortun-caroltabuas
cp "$S/app/aula/track.ts" app/aula/track.ts
```
Editar `app/aula/track.ts`: na função `linkComUtm`, trocar a linha
`u.searchParams.set('utm_campaign', \`precifica_${aulaDate}\`)` por
`u.searchParams.set('utm_campaign', \`webinar_${aulaDate}\`)`.

- [ ] **Step 2: Escrever teste do UTM** — `__tests__/track.test.ts`

```ts
import { linkComUtm } from '@/app/aula/track'

it('monta utm genérico webinar_', () => {
  const u = new URL(linkComUtm('https://exemplo.com/checkout', '2026-07-01', 'drawer'))
  expect(u.searchParams.get('utm_source')).toBe('webinar')
  expect(u.searchParams.get('utm_campaign')).toBe('webinar_2026-07-01')
  expect(u.searchParams.get('utm_content')).toBe('drawer')
})
it('retorna o link original se inválido', () => {
  expect(linkComUtm('nao-e-url', '2026-07-01', 'card')).toBe('nao-e-url')
})
```

- [ ] **Step 3: Rodar e ver passar**

```bash
npx jest track
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: tracking com UTM genérico (webinar_) + teste"
```

---

## Task 9: API do gate + HMAC (`api/aula/verificar`) + `AulaGate`

**Files:**
- Create: `app/api/aula/verificar/route.ts`, `app/aula/AulaGate.tsx`
- Reference (SOURCE): `app/api/aula/verificar/route.ts`, `app/aula/AulaGate.tsx`

**Interfaces:**
- Consumes: `supabaseAdmin` indiretamente (cria client local com service role, como no SOURCE).
- Produces:
  - `signAulaToken`, `verifyAulaToken` exportados de `verificar/route.ts` (usados por chat/evento).
  - Componente `<AulaGate>` + hook `useAulaSession()` exportado.

- [ ] **Step 1: Copiar `verificar/route.ts` do SOURCE**

```bash
S=/Users/moisa/Downloads/claude/fortun-caroltabuas
mkdir -p app/api/aula/verificar
cp "$S/app/api/aula/verificar/route.ts" app/api/aula/verificar/route.ts
```
Conferir: usa só `aula_inscritos`, envs padrão e `crypto`. Nenhuma genericização de dados necessária (não há marca). Manter como está.

- [ ] **Step 2: Copiar `AulaGate.tsx` do SOURCE e genericizar branding**

```bash
S=/Users/moisa/Downloads/claude/fortun-caroltabuas
cp "$S/app/aula/AulaGate.tsx" app/aula/AulaGate.tsx
```
Editar `AulaGate.tsx`: o componente exibe a string fixa `"Carol Tabuas · Área do Aluno"` no header do gate. Trocar por um label recebido via prop. Mudanças:
- Assinatura: `export function AulaGate({ children, areaLabel }: { children: ReactNode; areaLabel: string })`.
- Onde aparece `Carol Tabuas · Área do Aluno`, usar `{areaLabel}`.
Demais textos ("Entre na aula ao vivo", "Preencha para liberar seu acesso." etc.) são genéricos — manter.

- [ ] **Step 3: Verificar build parcial (typecheck)**

```bash
npx tsc --noEmit
```
Expected: erro só se `page.tsx` ainda não passa `areaLabel` — ok por ora (page vem na Task 14). Garantir que `AulaGate.tsx` e `route.ts` em si tipam.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: gate de acesso (HMAC cookie) + branding via prop"
```

---

## Task 10: APIs de chat e evento

**Files:**
- Create: `app/api/aula/chat/route.ts`, `app/api/aula/evento/route.ts`
- Reference (SOURCE): mesmos caminhos

**Interfaces:**
- Consumes: `verifyAulaToken` (Task 9).
- Produces: `POST /api/aula/chat` (insere em `aula_chat` validando cookie), `POST /api/aula/evento` (insere em `aula_eventos`).

- [ ] **Step 1: Copiar os dois do SOURCE**

```bash
S=/Users/moisa/Downloads/claude/fortun-caroltabuas
mkdir -p app/api/aula/chat app/api/aula/evento
cp "$S/app/api/aula/chat/route.ts" app/api/aula/chat/route.ts
cp "$S/app/api/aula/evento/route.ts" app/api/aula/evento/route.ts
```

- [ ] **Step 2: Conferir imports** — ambos importam `verifyAulaToken` de `../verificar/route`. Caminho idêntico ao SOURCE → ok. Nenhum dado real. Sem mudanças.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```
Expected: sem erros novos.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: APIs de chat e evento do webinar"
```

---

## Task 11: Contador ao vivo real (`api/aula/ao-vivo`)

**Files:**
- Create: `app/api/aula/ao-vivo/route.ts`, `lib/contador.ts`, `__tests__/contador.test.ts`

**Interfaces:**
- Consumes: `supabaseAdmin` (Task 2), `getActiveConfig` (Task 5).
- Produces:
  - `aplicarPisoBoost(real: number, piso: number, mult: number): number` (pura, em `lib/contador.ts`) = `max(piso, round(real * mult))`.
  - `GET /api/aula/ao-vivo?data=YYYY-MM-DD` → `{ real, exibido }`.

- [ ] **Step 1: Teste da fórmula (falha)** — `__tests__/contador.test.ts`

```ts
import { aplicarPisoBoost } from '@/lib/contador'

it('aplica piso quando real é baixo', () => {
  expect(aplicarPisoBoost(4, 80, 1)).toBe(80)
})
it('aplica multiplicador e arredonda', () => {
  expect(aplicarPisoBoost(100, 0, 1.5)).toBe(150)
  expect(aplicarPisoBoost(7, 0, 1.4)).toBe(10) // 9.8 -> 10
})
it('usa o maior entre piso e real*mult', () => {
  expect(aplicarPisoBoost(100, 80, 1.5)).toBe(150)
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npx jest contador
```
Expected: FAIL.

- [ ] **Step 3: Implementar `lib/contador.ts`**

```ts
export function aplicarPisoBoost(real: number, piso: number, mult: number): number {
  return Math.max(piso, Math.round(real * mult))
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npx jest contador
```
Expected: PASS.

- [ ] **Step 5: Implementar `app/api/aula/ao-vivo/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aplicarPisoBoost } from '@/lib/contador'
import { getActiveConfig } from '@/lib/aula-config'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const JANELA_MS = 45_000

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get('data')
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ real: 0, exibido: 0 }, { status: 400 })
  }
  const desde = new Date(Date.now() - JANELA_MS).toISOString()
  const { data: rows } = await supabaseAdmin
    .from('aula_eventos')
    .select('session_id, event_type, created_at')
    .eq('aula_date', data)
    .in('event_type', ['heartbeat', 'acesso'])
    .gte('created_at', desde)

  const real = new Set((rows ?? []).map(r => r.session_id as string)).size
  const cfg = await getActiveConfig()
  const exibido = aplicarPisoBoost(real, cfg.contadorPiso, cfg.contadorMultiplicador)
  return NextResponse.json({ real, exibido })
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: contador ao vivo real (heartbeats) + piso/multiplicador (TDD)"
```

---

## Task 12: Componentes da oferta, notificações e materiais

**Files:**
- Create: `app/aula/Offer.tsx`, `app/aula/Notificacoes.tsx`, `app/aula/Materiais.tsx`
- Reference (SOURCE): mesmos caminhos

**Interfaces:**
- Consumes: tipos `Oferta`, `NotificacoesCompra`, `Materiais` de `./config-types`; `trackAula`, `linkComUtm` de `./track`.
- Produces: `OfferDrawer`, `OfferCard` (Offer.tsx); `PurchaseNotifications` (Notificacoes.tsx); `MateriaisButton` (Materiais.tsx).

- [ ] **Step 1: Copiar os três do SOURCE**

```bash
S=/Users/moisa/Downloads/claude/fortun-caroltabuas
cp "$S/app/aula/Offer.tsx" app/aula/Offer.tsx
cp "$S/app/aula/Notificacoes.tsx" app/aula/Notificacoes.tsx
cp "$S/app/aula/Materiais.tsx" app/aula/Materiais.tsx
```

- [ ] **Step 2: Ajustar imports de tipos** — nos três arquivos, trocar `from './config'` por `from './config-types'` (onde importam `Oferta`/`NotificacoesCompra`/`Materiais`).

- [ ] **Step 3: Genericizar `Notificacoes.tsx`** — a lista `NOMES` é de nomes BR genéricos (sem sobrenome), já neutra. Manter. Nenhum dado real.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```
Expected: sem erros nesses arquivos (podem restar erros em arquivos ainda não criados; focar nesses três).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: componentes oferta, notificações e materiais (portados)"
```

---

## Task 13: Chat ao vivo (`LiveElements.tsx`) — roteiro por prop + contador real

**Files:**
- Create: `app/aula/LiveElements.tsx`
- Reference (SOURCE): `app/aula/LiveElements.tsx`

**Interfaces:**
- Consumes: `Oferta` de `./config-types`; `OfferDrawer`/`OfferCard` (Task 12); `trackAula` (Task 8); `useAulaSession` (Task 9); roteiro via prop.
- Produces:
  - `LiveChatFull({ startedAt, roteiro, oferta, chatOffsetSegundos })` — roteiro vem por PROP (não mais do `CHAT_SCRIPT` hardcoded).
  - `ViewerCounterInline({ startedAt, aulaDate })` — busca `/api/aula/ao-vivo` (real), não a curva falsa.

- [ ] **Step 1: Copiar do SOURCE**

```bash
S=/Users/moisa/Downloads/claude/fortun-caroltabuas
cp "$S/app/aula/LiveElements.tsx" app/aula/LiveElements.tsx
```

- [ ] **Step 2: Remover o `CHAT_SCRIPT` hardcoded** — apagar todo o array `const CHAT_SCRIPT = [...] as const` (as ~180 linhas de dados reais). O roteiro passará a vir por prop.

- [ ] **Step 3: Tipar e receber o roteiro por prop** — definir no topo:

```ts
export type RoteiroItem = { delay: number; name: string; msg: string }
```
Em `LiveChatFull`, mudar a assinatura para:
```ts
export function LiveChatFull({ startedAt, roteiro, oferta, chatOffsetSegundos }:
  { startedAt: string; roteiro: RoteiroItem[]; oferta?: Oferta; chatOffsetSegundos?: number }) {
```
Dentro do componente, substituir todas as referências a `CHAT_SCRIPT` por `roteiro`. (São 3 usos: `scriptHist`, timers futuros, e o length do id.) Atualizar as deps dos `useEffect` que dependiam de `CHAT_SCRIPT` para incluir `roteiro`.

- [ ] **Step 4: Trocar o import de tipo** — `import { type Oferta } from './config'` → `from './config-types'`.

- [ ] **Step 5: Substituir a curva falsa pelo contador real** — remover as funções `viewerCountAt` e `useViewerCount` e reimplementar `ViewerCounterInline` para buscar a API:

```tsx
export function ViewerCounterInline({ startedAt, aulaDate }: { startedAt?: string; aulaDate: string }) {
  const [count, setCount] = useState<number>(0)
  useEffect(() => {
    let alive = true
    const fetchCount = async () => {
      try {
        const r = await fetch(`/api/aula/ao-vivo?data=${aulaDate}`)
        const j = await r.json()
        if (alive && typeof j.exibido === 'number') setCount(j.exibido)
      } catch { /* silencioso */ }
    }
    fetchCount()
    const id = setInterval(fetchCount, 8000)
    return () => { alive = false; clearInterval(id) }
  }, [aulaDate])
  return (
    <span className="text-[13px] tabular-nums flex items-center gap-1.5 flex-shrink-0" style={{ color: '#F1F1F1' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#AAAAAA' }}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
      {count.toLocaleString('pt-BR')}
    </span>
  )
}
```
Remover a função `ViewerCounter` legada (não usada) e a `LiveChat` legada (usa `CHAT_SCRIPT`; não usada) para não reintroduzir dados. Onde `LiveChatFull` renderiza `<ViewerCounterInline startedAt={startedAt} />`, passar também `aulaDate={aulaDate}`.

- [ ] **Step 6: Typecheck**

```bash
npx tsc --noEmit
```
Expected: erros só nos consumidores ainda não atualizados (AulaContent na Task 14). `LiveElements.tsx` deve tipar sozinho.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: chat ao vivo com roteiro por prop + contador real (sem dados hardcoded)"
```

---

## Task 14: Página `/aula` (server) + `AulaContent`

**Files:**
- Create: `app/aula/AulaContent.tsx`, `app/aula/page.tsx`
- Reference (SOURCE): mesmos caminhos

**Interfaces:**
- Consumes: `getActiveConfig`, `getRoteiro` (Task 5); `computarEstadoAula` (Task 6); `AulaGate` (Task 9); `LiveChatFull`/`ViewerCounterInline` (Task 13); demais componentes.
- Produces: rota `/aula` funcional lendo tudo do banco.

- [ ] **Step 1: Copiar `AulaContent.tsx` do SOURCE**

```bash
S=/Users/moisa/Downloads/claude/fortun-caroltabuas
cp "$S/app/aula/AulaContent.tsx" app/aula/AulaContent.tsx
```

- [ ] **Step 2: Genericizar `AulaContent.tsx`:**
- Trocar imports `from './config'` → `from './config-types'`.
- `AulaContent` recebe `roteiro` por prop e o repassa ao `<LiveChatFull>`: mudar a assinatura de `Props` para incluir `roteiro: RoteiroItem[]` (importar `RoteiroItem` de `./LiveElements`) e no `<LiveChatFull ... />` adicionar `roteiro={roteiro}` e `aulaDate`.
- Em `FaseAoVivo`, onde renderiza `<LiveChatFull startedAt=... oferta=... chatOffsetSegundos=... />`, repassar `roteiro={roteiro}`.
- Os títulos fixos `"Montagem ao vivo + Precificação"` (aparece 2x: bloco mobile e desktop) → trocar por `config.titulo`.
- `kiwifyPlaceholder`/`kiwifyOfferId`/`kiwifyOfferUrl`: o SOURCE usa `config.kiwifyOfferId`/`Url` e um CTA Kiwify embutido (`id="kiwify-upsell-..."` + script `snippets.kiwify.com`). Remover esse CTA Kiwify-específico inteiro (o bloco `CtaButton`, `showCta`, o `<Script src="https://snippets.kiwify.com/...">` e as checagens `kiwifyPlaceholder`). A oferta do produto é só o drawer/card já cobertos por `LiveChatFull`. Apagar referências a `config.kiwifyOfferId`, `config.kiwifyOfferUrl`, `config.ctaDelaySeconds` (não existem mais no tipo).

- [ ] **Step 3: Reescrever `app/aula/page.tsx`** (server component que lê do banco)

```tsx
import type { Metadata } from 'next'
import { computarEstadoAula } from './lib'
import { getActiveConfig, getRoteiro } from '@/lib/aula-config'
import type { EstadoAula } from './config-types'
import { AulaContent } from './AulaContent'
import { AulaGate } from './AulaGate'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getActiveConfig()
  return {
    title: cfg.titulo,
    description: cfg.seoDescricao,
    openGraph: {
      title: cfg.titulo, description: cfg.seoDescricao, type: 'website', locale: 'pt_BR',
      siteName: cfg.branding.marca,
      images: [{ url: cfg.branding.ogImage, width: 1200, height: 675, alt: cfg.titulo }],
    },
    twitter: { card: 'summary_large_image', title: cfg.titulo, description: cfg.seoDescricao, images: [cfg.branding.ogImage] },
  }
}

export default async function AulaPage({ searchParams }: { searchParams: Promise<{ simular?: string }> }) {
  const params = await searchParams
  const [config, roteiro] = await Promise.all([getActiveConfig(), getRoteiro()])

  const agora = new Date()
  const fimSimulado = new Date(agora.getTime() + config.duracaoMin * 60 * 1000)
  const em5min = new Date(agora.getTime() + 5 * 60 * 1000)
  const SIMULACOES: Record<string, EstadoAula> = {
    aguardando: { fase: 'aguardando', proximoInicio: em5min.toISOString(), isToday: true },
    ao_vivo:    { fase: 'ao_vivo', inicio: agora.toISOString(), fim: fimSimulado.toISOString() },
    replay:     { fase: 'replay', proximoInicio: '2099-01-01T23:00:00.000Z' },
  }
  const simulado = process.env.NODE_ENV !== 'production' && params.simular ? SIMULACOES[params.simular] : null
  const estadoInicial = simulado ?? computarEstadoAula(agora, config)
  const simulando = !!simulado

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col" style={{ background: '#0A0A0A' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <header className="relative z-10 py-3 px-6 border-b border-white/8 flex items-center justify-center">
        <span className="font-sans text-[10px] text-white/30 uppercase tracking-[3px]">
          {config.branding.marca} · {config.branding.areaLabel}
        </span>
      </header>
      <AulaGate areaLabel={`${config.branding.marca} · ${config.branding.areaLabel}`}>
        <AulaContent estadoInicial={estadoInicial} config={config} roteiro={roteiro} simulando={simulando} />
      </AulaGate>
      <footer className="relative z-10 py-6 mt-auto text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-[3px]">{config.branding.marca} · Todos os direitos reservados</p>
      </footer>
    </main>
  )
}
```

- [ ] **Step 4: Ajustar `AulaContent` tick para usar config** — no SOURCE o `useEffect` de tick chama `computarEstadoAula(novoAgora, config)`. Confirmar que `config` é o `AulaConfig` (já é a prop). Manter.

- [ ] **Step 5: Build**

```bash
npm run build
```
Expected: PASS. Corrigir erros de tipo remanescentes (props `roteiro`/`aulaDate`, imports de `config-types`). O build pode exigir envs Supabase em build time? As páginas são `force-dynamic`; `getActiveConfig` roda em request. Se o build tentar pré-render e falhar por env ausente, garantir `export const dynamic = 'force-dynamic'` (já incluído) — não deve avaliar no build.

- [ ] **Step 6: Lint + commit**

```bash
npm run lint
git add -A
git commit -m "feat: página /aula server-driven (config+roteiro do banco) + branding"
```

---

## Task 15: Admin — auth, layout e login

**Files:**
- Create: `lib/require-admin.ts`, `app/admin/layout.tsx`, `app/admin/login/page.tsx`, `app/admin/login/LoginForm.tsx`, `middleware.ts` (se o SOURCE usar)
- Reference (SOURCE): `lib/require-admin.ts`, `app/admin/layout.tsx`, `app/admin/login/*`, `proxy.ts`/`middleware.ts`

**Interfaces:**
- Consumes: `createSupabaseServer` (Task 2).
- Produces: `requireAdmin()` que redireciona para `/admin/login` se não autenticado; layout do admin; tela de login (email+senha Supabase Auth).

- [ ] **Step 1: Inspecionar o SOURCE** — ler `SOURCE/lib/require-admin.ts`, `SOURCE/app/admin/layout.tsx`, `SOURCE/app/admin/login/` e `SOURCE/proxy.ts`. Identificar o mínimo necessário p/ proteger `/admin` com Supabase Auth.

- [ ] **Step 2: Copiar e enxugar** — copiar `require-admin.ts`, `admin/layout.tsx`, `admin/login/*`. Remover do layout qualquer link de navegação para páginas que não existem neste produto (manter só: Dashboard, Aula, Roteiro, Mensagem). Trocar branding "caroltabuas" por `Webinar` (texto genérico). Se houver lista de menu hardcoded, deixar:

```tsx
const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/aula', label: 'Configuração da aula' },
  { href: '/admin/roteiro', label: 'Roteiro do chat' },
  { href: '/admin/mensagem', label: 'Mensagem oficial' },
]
```

- [ ] **Step 3: Copiar middleware/proxy se necessário** — se o SOURCE usa `proxy.ts` ou `middleware.ts` para refresh de sessão Supabase, copiar e remover regras não relacionadas a `/admin`.

- [ ] **Step 4: Build**

```bash
npm run build
```
Expected: PASS (rotas de login/admin compilam; podem render dinâmico).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: admin auth (Supabase) + layout + login"
```

---

## Task 16: Admin — configuração da aula + oferta + notificações

**Files:**
- Create: `app/admin/aula/page.tsx`, `app/admin/aula/ConfigForm.tsx`, `app/api/admin/aula/config/route.ts`
- Reference (SOURCE): padrões de form do admin existente

**Interfaces:**
- Consumes: `getActiveConfig` (Task 5), `requireAdmin` (Task 15), `supabaseAdmin` (Task 2).
- Produces: `POST /api/admin/aula/config` que faz upsert da linha `ativa=true` em `aula_config` (mapeando camelCase→snake_case + jsonb).

- [ ] **Step 1: `app/api/admin/aula/config/route.ts`** — salva config (autenticado)

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-ssr'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const b = await req.json()
  const row = {
    ativa: true,
    updated_at: new Date().toISOString(),
    titulo: String(b.titulo ?? 'Aula ao vivo'),
    seo_descricao: String(b.seoDescricao ?? ''),
    youtube_video_id: String(b.youtubeVideoId ?? ''),
    inicio_at: b.inicioAt ?? null,
    duracao_min: Number(b.duracaoMin ?? 100),
    recorrencia: b.recorrencia ?? null,
    timezone: String(b.timezone ?? 'America/Sao_Paulo'),
    replay_habilitado: !!b.replayHabilitado,
    pitch_segundos: Number(b.pitchSegundos ?? 1800),
    chat_offset_segundos: Number(b.chatOffsetSegundos ?? 0),
    ao_vivo_fim_segundos: Number(b.aoVivoFimSegundos ?? 6000),
    contador_piso: Number(b.contadorPiso ?? 0),
    contador_multiplicador: Number(b.contadorMultiplicador ?? 1),
    oferta: b.oferta ?? null,
    notificacoes: b.notificacoes ?? null,
    materiais: b.materiais ?? null,
    branding: b.branding ?? { marca: 'Webinar', areaLabel: 'Área do Aluno', teamName: 'Equipe', ogImage: '/og-aula.jpg' },
  }
  // Garante 1 ativa: atualiza a existente ou insere.
  const { data: existing } = await supabaseAdmin.from('aula_config').select('id').eq('ativa', true).maybeSingle()
  const q = existing
    ? supabaseAdmin.from('aula_config').update(row).eq('id', existing.id)
    : supabaseAdmin.from('aula_config').insert(row)
  const { error } = await q
  if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: `app/admin/aula/page.tsx`** — server: protege + carrega config atual e passa ao form

```tsx
import { requireAdmin } from '@/lib/require-admin'
import { getActiveConfig } from '@/lib/aula-config'
import { ConfigForm } from './ConfigForm'

export const dynamic = 'force-dynamic'

export default async function AdminAulaPage() {
  await requireAdmin()
  const cfg = await getActiveConfig()
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-white mb-6">Configuração da aula</h1>
      <ConfigForm inicial={cfg} />
    </div>
  )
}
```

- [ ] **Step 3: `app/admin/aula/ConfigForm.tsx`** — client; campos da aula + oferta + notificações; envia POST. Implementar com inputs controlados cobrindo: `titulo`, `seoDescricao`, `youtubeVideoId`, `inicioAt` (datetime-local → ISO), `duracaoMin`, `recorrencia` (checkbox semanal + weekday + fromDate), `replayHabilitado`, `pitchSegundos`, `chatOffsetSegundos`, `aoVivoFimSegundos`, `contadorPiso`, `contadorMultiplicador`, bloco `oferta.*` (todos os campos do tipo `Oferta`), bloco `notificacoes.*`, bloco `branding.*`. Estrutura mínima:

```tsx
'use client'
import { useState } from 'react'
import type { AulaConfig } from '@/app/aula/config-types'

export function ConfigForm({ inicial }: { inicial: AulaConfig }) {
  const [cfg, setCfg] = useState<AulaConfig>(inicial)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  const salvar = async () => {
    setSalvando(true); setMsg('')
    const r = await fetch('/api/admin/aula/config', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg),
    })
    setSalvando(false)
    setMsg(r.ok ? 'Salvo!' : 'Erro ao salvar')
  }

  const set = <K extends keyof AulaConfig>(k: K, v: AulaConfig[K]) => setCfg(c => ({ ...c, [k]: v }))

  return (
    <div className="flex flex-col gap-4 text-white">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-white/60">Título da aula</span>
        <input className="bg-white/5 border border-white/10 rounded-lg px-3 py-2"
          value={cfg.titulo} onChange={e => set('titulo', e.target.value)} />
      </label>
      {/* ...repetir o padrão acima para cada campo listado no Step 3... */}
      <button onClick={salvar} disabled={salvando}
        className="bg-amber-500 text-black font-bold rounded-full py-3 mt-2 disabled:opacity-50">
        {salvando ? 'Salvando...' : 'Salvar configuração'}
      </button>
      {msg && <p className="text-sm text-white/70">{msg}</p>}
    </div>
  )
}
```
Completar TODOS os campos seguindo esse padrão (texto, número, checkbox, e os sub-objetos `oferta`/`notificacoes`/`branding` com helpers `setOferta`, `setNotif`, `setBranding` que fazem `set('oferta', { ...cfg.oferta!, campo: v })`).

- [ ] **Step 4: Build + lint**

```bash
npm run build && npm run lint
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: admin configuração da aula/oferta/notificações + API de save"
```

---

## Task 17: Admin — roteiro do chat (colar + preview)

**Files:**
- Create: `app/admin/roteiro/page.tsx`, `app/admin/roteiro/RoteiroEditor.tsx`, `app/api/admin/aula/roteiro/route.ts`

**Interfaces:**
- Consumes: `parseRoteiro` (Task 7), `getRoteiro` (Task 5), `requireAdmin` (Task 15), `supabaseAdmin`.
- Produces: `POST /api/admin/aula/roteiro` — recebe `{ texto }`, faz `parseRoteiro`, substitui `aula_roteiro` (delete-all + insert).

- [ ] **Step 1: `app/api/admin/aula/roteiro/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { parseRoteiro } from '@/lib/roteiro-parse'

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { texto } = await req.json()
  let linhas
  try { linhas = parseRoteiro(String(texto ?? '')) }
  catch (e) { return NextResponse.json({ ok: false, erro: (e as Error).message }, { status: 400 }) }

  await supabaseAdmin.from('aula_roteiro').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (linhas.length > 0) {
    const rows = linhas.map((l, i) => ({ delay_segundos: l.delay, nome: l.name, mensagem: l.msg, ordem: i }))
    const { error } = await supabaseAdmin.from('aula_roteiro').insert(rows)
    if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, total: linhas.length })
}
```

- [ ] **Step 2: `app/admin/roteiro/page.tsx`** — server: protege + carrega roteiro atual como texto

```tsx
import { requireAdmin } from '@/lib/require-admin'
import { getRoteiro } from '@/lib/aula-config'
import { RoteiroEditor } from './RoteiroEditor'

export const dynamic = 'force-dynamic'

export default async function AdminRoteiroPage() {
  await requireAdmin()
  const roteiro = await getRoteiro()
  const texto = roteiro.map(r => `${r.delay} | ${r.name} | ${r.msg}`).join('\n')
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-white mb-2">Roteiro do chat</h1>
      <p className="text-sm text-white/50 mb-6">Uma linha por mensagem no formato <code>tempo | nome | mensagem</code>. Tempo em segundos ou mm:ss.</p>
      <RoteiroEditor inicial={texto} />
    </div>
  )
}
```

- [ ] **Step 3: `app/admin/roteiro/RoteiroEditor.tsx`** — client: textarea + preview parseado + salvar

```tsx
'use client'
import { useMemo, useState } from 'react'
import { parseRoteiro } from '@/lib/roteiro-parse'

export function RoteiroEditor({ inicial }: { inicial: string }) {
  const [texto, setTexto] = useState(inicial)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  const preview = useMemo(() => {
    try { return { rows: parseRoteiro(texto), erro: '' } }
    catch (e) { return { rows: [], erro: (e as Error).message } }
  }, [texto])

  const salvar = async () => {
    setSalvando(true); setMsg('')
    const r = await fetch('/api/admin/aula/roteiro', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto }),
    })
    const j = await r.json()
    setSalvando(false)
    setMsg(r.ok ? `Salvo! ${j.total} mensagens.` : `Erro: ${j.erro}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={16}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm"
        placeholder={'10 | Ana | Boa noite!\n01:30 | Bia | Olá'} />
      {preview.erro
        ? <p className="text-rose-400 text-sm">{preview.erro}</p>
        : <p className="text-white/50 text-sm">{preview.rows.length} mensagens válidas.</p>}
      <button onClick={salvar} disabled={salvando || !!preview.erro}
        className="bg-amber-500 text-black font-bold rounded-full py-3 disabled:opacity-50">
        {salvando ? 'Salvando...' : 'Salvar roteiro'}
      </button>
      {msg && <p className="text-sm text-white/70">{msg}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Build + lint + commit**

```bash
npm run build && npm run lint
git add -A
git commit -m "feat: admin editor de roteiro (colar+preview) + API de save"
```

---

## Task 18: Admin — mensagem oficial

**Files:**
- Create: `app/admin/mensagem/page.tsx`, `app/admin/mensagem/MensagemForm.tsx`, `app/api/admin/aula/mensagem/route.ts`

**Interfaces:**
- Consumes: `requireAdmin`, `supabaseAdmin`, `getActiveConfig` (p/ `branding.teamName`).
- Produces: `POST /api/admin/aula/mensagem` — insere em `aula_chat` com `is_official=true`, `user_name = branding.teamName`, `aula_date` de hoje (BRT).

- [ ] **Step 1: `app/api/admin/aula/mensagem/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { getActiveConfig } from '@/lib/aula-config'

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { message } = await req.json()
  const texto = String(message ?? '').trim()
  if (texto.length < 1 || texto.length > 300) return NextResponse.json({ ok: false, erro: 'Mensagem inválida' }, { status: 400 })

  const cfg = await getActiveConfig()
  const aulaDate = new Date().toLocaleDateString('sv-SE', { timeZone: cfg.timezone })
  const { error } = await supabaseAdmin.from('aula_chat').insert({
    aula_date: aulaDate, user_name: cfg.branding.teamName, message: texto, is_official: true,
  })
  if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: `app/admin/mensagem/page.tsx`** (server, protege) + `MensagemForm.tsx` (client: textarea + enviar). Form:

```tsx
'use client'
import { useState } from 'react'
export function MensagemForm() {
  const [message, setMessage] = useState('')
  const [msg, setMsg] = useState('')
  const enviar = async () => {
    const r = await fetch('/api/admin/aula/mensagem', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }),
    })
    setMsg(r.ok ? 'Enviada!' : 'Erro ao enviar'); if (r.ok) setMessage('')
  }
  return (
    <div className="flex flex-col gap-3 max-w-xl">
      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} maxLength={300}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
        placeholder="Mensagem que aparece destacada no chat ao vivo" />
      <button onClick={enviar} disabled={!message.trim()}
        className="bg-amber-500 text-black font-bold rounded-full py-3 disabled:opacity-50">Enviar como equipe</button>
      {msg && <p className="text-sm text-white/70">{msg}</p>}
    </div>
  )
}
```
A `page.tsx`:
```tsx
import { requireAdmin } from '@/lib/require-admin'
import { MensagemForm } from './MensagemForm'
export const dynamic = 'force-dynamic'
export default async function Page() {
  await requireAdmin()
  return (<div className="p-8"><h1 className="text-xl font-bold text-white mb-6">Mensagem oficial</h1><MensagemForm /></div>)
}
```

- [ ] **Step 3: Build + lint + commit**

```bash
npm run build && npm run lint
git add -A
git commit -m "feat: admin envio de mensagem oficial ao chat"
```

---

## Task 19: Admin — dashboard de KPIs (só `aula_eventos`)

**Files:**
- Create: `app/admin/page.tsx`, `app/admin/AoVivoAgora.tsx`
- Reference (SOURCE): `app/admin/webinar/page.tsx` (reaproveitar a lógica de KPIs, REMOVENDO `oferta_compras` e `webhook_logs`)

**Interfaces:**
- Consumes: `requireAdmin`, `supabaseAdmin`, `getActiveConfig`.
- Produces: dashboard com Acessos, Pico simultâneo, Viram o pitch, Retenção até o pitch, Cliques CTA (drawer/card), CTR + componente "Ao vivo agora" (poll na API).

- [ ] **Step 1: Criar `app/admin/page.tsx`** baseado na lógica do SOURCE `app/admin/webinar/page.tsx`, mas **sem** a seção "Conversão (UTM webinar)" nem as queries a `oferta_compras`/`webhook_logs`. Manter `getStats` reduzido:

```tsx
import { requireAdmin } from '@/lib/require-admin'
import { supabaseAdmin } from '@/lib/supabase'
import { AoVivoAgora } from './AoVivoAgora'

export const dynamic = 'force-dynamic'

type Evento = { session_id: string; event_type: string; created_at: string; metadata: Record<string, unknown> | null }

async function fetchAll(aulaDate: string): Promise<Evento[]> {
  const PAGE = 1000; const all: Evento[] = []; let off = 0
  while (true) {
    const { data } = await supabaseAdmin.from('aula_eventos')
      .select('session_id, event_type, created_at, metadata').eq('aula_date', aulaDate)
      .range(off, off + PAGE - 1)
    if (!data?.length) break
    all.push(...(data as Evento[])); if (data.length < PAGE) break; off += PAGE
  }
  return all
}

async function getDatas(): Promise<string[]> {
  const { data } = await supabaseAdmin.from('aula_eventos').select('aula_date').order('aula_date', { ascending: false }).limit(1000)
  return Array.from(new Set((data ?? []).map(r => r.aula_date as string)))
}

function getStats(ev: Evento[]) {
  const sess = (t: string) => new Set(ev.filter(e => e.event_type === t).map(e => e.session_id))
  const acessos = sess('acesso').size
  const ofertaViews = sess('oferta_view').size
  const ctaClicks = sess('cta_click').size
  const ctaDrawer = new Set(ev.filter(e => e.event_type === 'cta_click' && e.metadata?.origem === 'drawer').map(e => e.session_id)).size
  const ctaCard = new Set(ev.filter(e => e.event_type === 'cta_click' && e.metadata?.origem === 'card').map(e => e.session_id)).size
  const buckets = new Map<number, Set<string>>()
  for (const e of ev) {
    if (e.event_type !== 'heartbeat' && e.event_type !== 'acesso') continue
    const b = Math.floor(new Date(e.created_at).getTime() / 30_000)
    if (!buckets.has(b)) buckets.set(b, new Set())
    buckets.get(b)!.add(e.session_id)
  }
  const pico = buckets.size ? Math.max(...[...buckets.values()].map(s => s.size)) : 0
  return {
    acessos, ofertaViews, ctaClicks, ctaDrawer, ctaCard, pico,
    retencaoPitch: acessos ? ofertaViews / acessos : 0,
    ctr: ofertaViews ? ctaClicks / ofertaViews : 0,
  }
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`
function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (<div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
    <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
    <p className="text-2xl font-bold text-white mt-1 tabular-nums">{value}</p>
    {hint && <p className="text-[11px] text-white/30 mt-1">{hint}</p>}</div>)
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const datas = await getDatas()
  const aulaDate = params.data || datas[0] || new Date().toISOString().split('T')[0]
  const s = getStats(await fetchAll(aulaDate))
  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-sm text-white/40 mb-6">Aula {aulaDate}</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <AoVivoAgora aulaDate={aulaDate} />
        <Kpi label="Pico simultâneo" value={s.pico.toLocaleString('pt-BR')} hint="máx. ao mesmo tempo" />
        <Kpi label="Acessos" value={s.acessos.toLocaleString('pt-BR')} hint="entraram na aula" />
        <Kpi label="Viram o pitch" value={s.ofertaViews.toLocaleString('pt-BR')} hint="drawer da oferta" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Retenção até pitch" value={pct(s.retencaoPitch)} hint="viram pitch ÷ acessos" />
        <Kpi label="Cliques no CTA" value={s.ctaClicks.toLocaleString('pt-BR')} hint={`drawer ${s.ctaDrawer} · card ${s.ctaCard}`} />
        <Kpi label="CTR da oferta" value={pct(s.ctr)} hint="cliques ÷ viram pitch" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `app/admin/AoVivoAgora.tsx`** (client — poll na API real)

```tsx
'use client'
import { useEffect, useState } from 'react'
export function AoVivoAgora({ aulaDate }: { aulaDate: string }) {
  const [n, setN] = useState<{ real: number; exibido: number }>({ real: 0, exibido: 0 })
  useEffect(() => {
    let alive = true
    const f = async () => { try { const r = await fetch(`/api/aula/ao-vivo?data=${aulaDate}`); const j = await r.json(); if (alive) setN(j) } catch {} }
    f(); const id = setInterval(f, 8000); return () => { alive = false; clearInterval(id) }
  }, [aulaDate])
  return (
    <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-wider text-rose-300/70">● Ao vivo agora</p>
      <p className="text-2xl font-bold text-white mt-1 tabular-nums">{n.exibido.toLocaleString('pt-BR')}</p>
      <p className="text-[11px] text-white/30 mt-1">real {n.real}</p>
    </div>
  )
}
```

- [ ] **Step 3: Build + lint + commit**

```bash
npm run build && npm run lint
git add -A
git commit -m "feat: admin dashboard KPIs (aula_eventos) + ao vivo agora real"
```

---

## Task 20: Placeholders de imagem em `public/`

**Files:**
- Create: `public/og-aula.jpg`, `public/oferta-banner.png`, `public/marca-logo.png`, `public/README.md`

**Interfaces:**
- Produces: imagens placeholder neutras referenciadas pelo seed (`ogImage`, `bannerImagem`, `marcaLogo`).

- [ ] **Step 1: Gerar placeholders simples** (não copiar imagens reais do SOURCE)

```bash
mkdir -p public
# PNGs/JPG placeholder mínimos (1x1 transparente) — o cliente troca pelas reais no admin/arquivos.
printf '\x89PNG\r\n\x1a\n' > /tmp/_p.png  # (se preferir, criar via ferramenta; aqui só garantir existência)
```
Como gerar 1x1 PNG/JPG válido pode ser chato no shell, criar via Node:

```bash
node -e '
const fs=require("fs");
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==","base64");
fs.writeFileSync("public/og-aula.jpg",png);
fs.writeFileSync("public/oferta-banner.png",png);
fs.writeFileSync("public/marca-logo.png",png);
'
```

- [ ] **Step 2: `public/README.md`** explicando que são placeholders a substituir.

```md
# Imagens

Placeholders neutros. Substitua por suas imagens reais (mesmos nomes) ou troque os caminhos no admin:
- og-aula.jpg — imagem de compartilhamento (1200×675)
- oferta-banner.png — banner do drawer da oferta
- marca-logo.png — logo da marca/oferta
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: placeholders neutros de imagem em public/"
```

---

## Task 21: Maquinaria de onboarding (assets da skill)

**Files:**
- Create: `iniciar.sh`, `iniciar.ps1`, `setup/check.mjs`, `bootstrap/install.sh`, `bootstrap/install.ps1`, `bootstrap/LINKS.md`, `.claude/settings.json`, `.claude/hooks/block-env-commit.sh`, `.claude/commands/{setup,doctor,deploy,validar}.md`, `CLAUDE.md`, `.gitignore`
- Copy-ref: `~/.claude/skills/criar-produto-instalavel/assets/*`

**Interfaces:**
- Produces: fluxo de instalação Fase 0/1/2 funcional; hook anti-`.env`; CLAUDE.md com travas.

- [ ] **Step 1: Copiar todos os assets**

```bash
A=~/.claude/skills/criar-produto-instalavel/assets
cp "$A/iniciar.sh" iniciar.sh
cp "$A/iniciar.ps1" iniciar.ps1
mkdir -p setup bootstrap .claude/hooks .claude/commands .claude/setup
cp "$A/setup/check.mjs" setup/check.mjs
cp "$A/bootstrap/install.sh" "$A/bootstrap/install.ps1" "$A/bootstrap/LINKS.md" bootstrap/
cp "$A/hooks/block-env-commit.sh" .claude/hooks/block-env-commit.sh
cp "$A/commands/setup.md" "$A/commands/doctor.md" "$A/commands/deploy.md" "$A/commands/validar.md" .claude/commands/
chmod +x .claude/hooks/block-env-commit.sh iniciar.sh
```

- [ ] **Step 2: Substituir placeholders em todos os arquivos copiados**

```bash
grep -rl '{{' iniciar.sh iniciar.ps1 setup bootstrap .claude 2>/dev/null
```
Para cada ocorrência, trocar: `{{NOME_PRODUTO}}`→`Webinar ao Vivo`, `{{FRASE_OBJETIVO}}`→`colocar seu webinar no ar`, `{{MARCADOR}}`→`.webinar`. Reexecutar o `grep` até retornar vazio.

- [ ] **Step 3: Criar `.claude/settings.json`** registrando o hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/block-env-commit.sh" }
        ]
      }
    ]
  }
}
```
(Se o asset trouxer um `settings.json` de referência, usar o dele e só ajustar o caminho do hook.)

- [ ] **Step 4: Criar `CLAUDE.md`** — prepend do header auto-start (`assets/claude-md-header.md`) + corpo de convenções/travas (template da referência da skill, seção 5). Substituir placeholders. O corpo deve conter: "O que é este projeto" (webinar instalável, cliente não-técnico), Convenções (PT-BR; conteúdo do webinar fica no admin/banco), e as TRAVAS (prompt-injection, ações destrutivas, credenciais, deploy, escopo).

- [ ] **Step 5: Criar `.gitignore`**

```
node_modules/
.next/
.env*
.config/
.DS_Store
.vercel/
*.tsbuildinfo
*.log
.webinar/
```

- [ ] **Step 6: Validar scripts**

```bash
bash -n iniciar.sh
bash -n bootstrap/install.sh
bash -n .claude/hooks/block-env-commit.sh
node setup/check.mjs || true   # deve rodar e reportar pré-requisitos de forma legível
```
Expected: `bash -n` sem erros de sintaxe; `check.mjs` roda sem stacktrace.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: maquinaria de onboarding (iniciar, check, bootstrap, hooks, comandos, CLAUDE.md)"
```

---

## Task 22: `/setup`, `dependencias.md` e README

**Files:**
- Modify: `.claude/commands/setup.md`
- Create: `.claude/setup/dependencias.md`, `README.md`

**Interfaces:**
- Produces: roteiro de `/setup` específico do webinar; lista de dependências; Quick Start por SO.

- [ ] **Step 1: Adaptar `.claude/commands/setup.md`** ao esqueleto: pré-requisitos → conta Supabase (criar projeto, pegar URL/anon/service role) → aplicar migrations (`supabase/migrations/00*.sql`) → semear `aula_config`/`aula_roteiro` a partir de `content/config.ts` (SEED) → criar usuário admin (Supabase Auth) → conta/deploy Vercel (envs) → `/validar`. Cada etapa em PT-BR, confirmando antes de ações destrutivas conforme as travas.

- [ ] **Step 2: Criar `.claude/setup/dependencias.md`** — listar o que o produto usa: plugin Supabase (MCP) e Vercel (se aplicável). Pegar os comandos exatos de instalação do `~/.claude/settings.json` (`enabledPlugins`) e do `known_marketplaces.json` do usuário. Se não houver dependências de marketplace obrigatórias, declarar "nenhuma skill de marketplace obrigatória; usa Supabase + Vercel via contas do cliente".

- [ ] **Step 3: Criar `README.md`** com Quick Start

```md
# Webinar ao Vivo

Página de aula ao vivo (vídeo + chat + oferta) instalável, configurável por um admin.

## Quick Start

**Mac/Linux:**
```
git clone <URL> webinar-ao-vivo && cd webinar-ao-vivo && bash iniciar.sh
```

**Windows (PowerShell):**
```
git clone <URL> webinar-ao-vivo; cd webinar-ao-vivo; .\iniciar.ps1
```

O assistente conduz a configuração (Supabase, admin, deploy). Depois, configure a aula em `/admin`.
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: /setup do webinar, dependencias.md e README com Quick Start"
```

---

## Task 23: Gate de genericização + build limpo + revisão

**Files:**
- Verify: repo inteiro

**Interfaces:**
- Produces: garantia de que nenhum dado real vazou e que o build/lint/test passam num estado limpo.

- [ ] **Step 1: Grep por dados reais** (deve retornar vazio em `app/`, `lib/`, `content/`, `public/`, `supabase/`)

```bash
grep -rinE 'carol|scoralick|caroltabuas|precificaf|kiwify|UDBp7Wvurts|x4ssrRQ' \
  app lib content public supabase README.md CLAUDE.md 2>/dev/null
```
Expected: **vazio**. Se aparecer algo, genericizar antes de prosseguir.

- [ ] **Step 2: Suite completa**

```bash
npm run lint
npx jest
npm run build
```
Expected: lint limpo; todos os testes PASS; build PASS.

- [ ] **Step 3: Teste de clone limpo** (o marcador não pode vir "configurado")

```bash
test ! -e .webinar/setup-ok && echo "OK: sem marcador de setup"
git status --porcelain   # deve estar limpo após commits
```

- [ ] **Step 4: Subagente revisor independente** — dispatch de um subagente (general-purpose) com a tarefa: "Revisar o repo `/Users/moisa/Downloads/claude/webinar-ao-vivo` contra o spec em `docs/superpowers/specs/2026-06-30-webinar-instalavel-design.md`. Focar em: (a) compliance de genericização (zero dado real), (b) segurança (service role só no server, hook anti-.env, cookie HMAC, admin protegido), (c) o pivô runtime-config (admin edita banco) está completo. Reportar achados Críticos/Importantes/Menores." Aplicar Críticos/Importantes.

- [ ] **Step 5: Commit final da branch**

```bash
git add -A
git commit -m "chore: gate de genericização + revisão final" --allow-empty
```

---

## Self-Review (preenchido)

**Cobertura do spec:**
- §2 camadas → Tasks 1–20 (base) + 21–22 (onboarding). ✓
- §4.1 `aula_config` → Task 3 (migration) + 4 (tipos/seed) + 5 (loader) + 16 (admin/API). ✓
- §4.2 `aula_roteiro` (server-side read) → Task 3 + 5 (`getRoteiro`) + 7 (parser) + 17 (admin). ✓
- §4.3 tabelas mantidas → Task 3. ✓
- §5 página /aula idêntica → Tasks 9,12,13,14. ✓
- §6 admin (config, oferta, notif, roteiro, msg oficial, dashboard) → Tasks 15–19. ✓
- §7 contador ao vivo real → Task 11 + 13 (UI) + 19 (admin). ✓
- §8 genericização → Tasks 8,9,13,14,20 + gate Task 23. ✓
- §9 maquinaria → Task 21. ✓
- §10 segurança → Task 21 (hook/CLAUDE.md/.gitignore) + APIs autenticadas. ✓
- §11 fora de escopo → não implementado (correto). ✓

**Placeholders:** O único padrão tipo-placeholder é o `{{...}}` dos assets, resolvido explicitamente na Task 21 Step 2 com `grep` até vazio. Nenhum "TODO/TBD" em código.

**Consistência de tipos:** `RoteiroItem`/`{delay,name,msg}` consistente entre Tasks 5,7,13,14. `AulaConfig` (camelCase) consistente entre 4,5,6,14,16. Mapeamento snake_case isolado em `rowToConfig` (Task 5) e nas rotas de save (Tasks 16–18). `aplicarPisoBoost` mesma assinatura em 11. `getActiveConfig`/`getRoteiro` mesmos nomes onde consumidos.
