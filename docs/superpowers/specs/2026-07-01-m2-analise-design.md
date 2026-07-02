# M2 — Análise por aula (curva de retenção estilo VTurb) — Design

**Data:** 2026-07-01
**Marco:** 2 de 4 (insights ricos)
**Base:** Marco 1 (multi-aula + admin light) já em produção.

## Objetivo

Dar a cada aula uma aba **"Análise"** com insights ricos, tendo como herói a
**curva de retenção** (linha de tendência estilo VTurb, versão limpa em Recharts):
"no minuto X do conteúdo, quantos % da audiência ainda estavam assistindo".
Complementada por: marcos 15/30/45/60, split de dispositivo (mobile/desktop) e o
pico de audiência (embutido na curva).

## Decisões travadas (brainstorming)

1. **Curva limpa em Recharts** — linha de retenção + tooltip + marcador de pitch +
   marcador de pico. **Sem** frames de vídeo sincronizados (descartado explicitamente).
2. **Aba "Análise" dedicada** por aula (não enriquecer a Visão geral).
3. **Base = % do pico de audiência.** `retencao[t] = simultaneos[t] / pico`. Eixo X =
   **posição no vídeo** (`video_seg` do heartbeat), não relógio de parede.

## Realidade do dado (importante)

Tudo vem de `aula_eventos` scoped por `aula_id` (nunca cruza aulas):
- `heartbeat.metadata.video_seg` (número, segundos no vídeo) — gravado a cada 60s pelo
  código do Marco 1. É a matéria-prima da curva.
- `acesso.metadata.device` (`'mobile'` | `'desktop'`) — inferido no servidor (Marco 1).

Eventos anteriores ao Marco 1 **não têm** `video_seg`/`device`. Logo, a curva e o split
**populam a partir da próxima aula ao vivo com o código novo**. Até lá, a aba mostra um
**estado vazio informativo** — nunca quebra.

## Arquitetura

Fluxo: **Server Component** busca eventos (paginado, mesmo padrão da Visão geral) →
**funções puras** em `lib/analitica.ts` transformam em dados prontos → **Client Components**
(Recharts) renderizam. Toda a matemática fica nas funções puras (testável); os componentes
de chart só desenham.

### Módulo de cálculo — `lib/analitica.ts` (funções puras, TDD)

```ts
export type HeartbeatEvento = { session_id: string; video_seg: number; created_at: string }
export type AcessoEvento = { session_id: string; device: 'mobile' | 'desktop' | null }

export type PontoCurva = { minuto: number; simultaneos: number; retencaoPct: number }
export type CurvaRetencao = {
  pontos: PontoCurva[]
  pico: { simultaneos: number; minuto: number }
  temDados: boolean
}

/**
 * Agrupa heartbeats em baldes de `bucketSeg` (default 60s) por video_seg.
 * simultaneos[b] = sessões DISTINTAS com heartbeat em [b*bucketSeg, (b+1)*bucketSeg).
 * pico = max(simultaneos); retencaoPct = round(simultaneos / pico * 100).
 * Sem heartbeats com video_seg → { pontos: [], pico: {0,0}, temDados: false }.
 */
export function curvaRetencao(heartbeats: HeartbeatEvento[], bucketSeg?: number): CurvaRetencao

export type Marco = { minuto: number; retencaoPct: number | null; simultaneos: number | null }
/**
 * Lê a retenção nos minutos pedidos (default [15,30,45,60]) direto dos pontos da curva.
 * Minuto além do fim da aula (sem balde) → { retencaoPct: null, simultaneos: null }.
 */
export function marcos(curva: CurvaRetencao, minutos?: number[]): Marco[]

export type DeviceSplit = { mobile: number; desktop: number; total: number; mobilePct: number }
/**
 * Conta sessões DISTINTAS por device (ignora null). total = mobile + desktop.
 * total 0 → { mobile:0, desktop:0, total:0, mobilePct:0 }.
 */
export function splitDevice(acessos: AcessoEvento[]): DeviceSplit
```

**Nota sobre `video_seg`:** o modelo da aula é simulive (vídeo do YouTube tocado em
posição sincronizada a partir de `startedAt`), então `video_seg` ≈ posição no conteúdo —
o eixo natural da curva de retenção. Resolução de 60s (um ponto por minuto) é suficiente
para uma aula de ~1–2h e leve no banco (não muda o intervalo do heartbeat).

### Componentes

- `app/admin/aulas/[id]/analise/page.tsx` (server) — `requireAdmin()`; `getConfigById(id)`
  (p/ `pitchSegundos` e `notFound()`); busca paginada de `aula_eventos` (heartbeat +
  acesso) por `aula_id`; extrai `video_seg`/`device` de `metadata`; roda `curvaRetencao`,
  `marcos`, `splitDevice`; passa dados prontos aos clients. Se `!curva.temDados` → estado
  vazio.
- `components/admin/RetentionChart.tsx` (client, Recharts) — props
  `{ pontos: PontoCurva[]; pico: {simultaneos,minuto}; pitchMinuto: number | null }`.
  `AreaChart` (área preenchida sob a linha, leitura tipo VTurb): XAxis = `minuto`
  (rótulo "Xm"), YAxis = `retencaoPct` (0–100%),
  `Tooltip` custom ("aos 32min · 61% · ~24 pessoas"), `ReferenceLine` vertical no
  `pitchMinuto` (rótulo "pitch"), `ReferenceDot` no pico com **rótulo de texto**
  ("pico: N aos Xmin", não cor sozinha). Cor da linha/área = `--admin-accent` (#F59E0B)
  com **fill a 20% de opacidade** (guia ui-ux-pro-max p/ "trend over time"); texto ≥ 4.5:1
  sobre branco.
- `components/admin/DeviceSplit.tsx` (client) — props `{ split: DeviceSplit }`.
  **Barra dividida** mobile vs desktop (não pizza — a base ui-ux-pro-max marca pizza como
  ruim p/ acessibilidade e recomenda barra + legenda), no estilo do `Funnel` (barra CSS):
  dois segmentos proporcionais com **ícone SVG (lucide) + rótulo + contagem + %** em cada
  (informação nunca só por cor). Se `total===0` → oculto.
- **Marcos 15/30/45/60** → reusam o card KPI (mesmo componente visual da Visão geral):
  4 cards com "Xm" → "Y% (~N pessoas)" ou "—" quando além do fim.
- **Aba "Análise"** → adicionar ao `AulaTabs` entre "Visão geral" e "Configuração".

### Dependência nova

`recharts` (client-only). Adicionar a `package.json` via `npm install recharts`.
Componentes de chart marcados `'use client'`.

## Estados e erros

Estado vazio é **por seção** (curva e device são dados independentes):
- **Sem `video_seg` ainda** (`!curva.temDados`) → a seção da curva **e** os marcos
  15/30/45/60 mostram estado vazio: "A curva de retenção aparece após a primeira aula
  ao vivo com o código novo." (ícone + texto, em `Card`).
- **Sem `device`** (`split.total === 0`) → oculta a barra de device (renderiza só se
  houver dados; independe da curva ter dados ou não).
- **Marcos além do fim da aula** → card mostra "—".
- Busca de eventos falha/vazia → trata como sem dados (não quebra a página).

## Acessibilidade (guia ui-ux-pro-max)

- **Nunca informação só por cor:** pico e pitch levam rótulo de texto; a barra de device
  leva ícone + rótulo + número, não só a cor do segmento.
- **Contraste ≥ 4.5:1** em todo texto (eixos, tooltip, rótulos) sobre branco/`--admin-bg`.
- **Leitura numérica acessível da curva:** os cards de marcos 15/30/45/60 (valores exatos
  em texto) são a alternativa-tabela do gráfico (o "data-table alternative" que a skill
  pede para charts) — quem não lê o gráfico tem os números.
- **Tooltip por teclado/hover** com texto completo; sem elementos piscando.
- Qualquer tabela/overflow usa wrapper `overflow-x-auto` (padrão já usado em Contatos).

## Testes

Unit (jest) em `lib/analitica.ts` — o preparo do dado é 100% coberto; o chart é visual
(sem unit test):
1. `curvaRetencao([])` → `temDados=false`, `pontos=[]`, `pico={0,0}`.
2. `curvaRetencao` com 3 sessões distribuídas em baldes → `simultaneos` correto por balde,
   `pico` e `picoMinuto` corretos.
3. `curvaRetencao` normalização → balde do pico = `retencaoPct 100`; metade do pico ≈ 50.
4. `curvaRetencao` dedup → mesma sessão com 2 heartbeats no mesmo balde conta 1.
5. `marcos` → minuto presente devolve valor; minuto além do fim devolve `null`.
6. `splitDevice` → mix mobile/desktop/null conta distinto e ignora null; `mobilePct` certo;
   tudo null → zeros.

## Fora de escopo (M3/M4)

- Faturamento / rastreamento de conversão estilo VTurb → **M3**.
- Uploads (Storage), Contatos completo + export CSV, import de roteiro CSV → **M4**.
- Frames de vídeo sincronizados atrás da curva → descartado.
- Reduzir o intervalo do heartbeat (mais resolução) → não necessário agora (YAGNI).

## Compatibilidade / não-regressão

- Só **adiciona** (nova aba, novo módulo, novos componentes, nova dependência). Não altera
  `/aula` (espectador), nem o tracking, nem as telas existentes do admin.
- Leitura de `aula_eventos` sempre scoped por `aula_id` (isolamento entre aulas, igual M1).
- Produto instalável: nenhuma migração nova (usa colunas/metadata já existentes do M1).
