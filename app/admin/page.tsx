import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { supabaseAdmin } from '@/lib/supabase'
import { AoVivoAgora } from './AoVivoAgora'

export const dynamic = 'force-dynamic'

type Evento = {
  session_id: string
  event_type: string
  created_at: string
  metadata: Record<string, unknown> | null
}

async function fetchAll(aulaDate: string): Promise<Evento[]> {
  const PAGE = 1000
  const all: Evento[] = []
  let off = 0
  while (true) {
    const { data } = await supabaseAdmin
      .from('aula_eventos')
      .select('session_id, event_type, created_at, metadata')
      .eq('aula_date', aulaDate)
      .range(off, off + PAGE - 1)
    if (!data?.length) break
    all.push(...(data as Evento[]))
    if (data.length < PAGE) break
    off += PAGE
  }
  return all
}

async function getDatas(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('aula_eventos')
    .select('aula_date')
    .order('aula_date', { ascending: false })
    .limit(1000)
  return Array.from(new Set((data ?? []).map(r => r.aula_date as string)))
}

function getStats(ev: Evento[]) {
  const sess = (t: string) => new Set(ev.filter(e => e.event_type === t).map(e => e.session_id))
  const acessos = sess('acesso').size
  const ofertaViews = sess('oferta_view').size
  const ctaClicks = sess('cta_click').size
  const ctaDrawer = new Set(
    ev
      .filter(e => e.event_type === 'cta_click' && e.metadata?.origem === 'drawer')
      .map(e => e.session_id),
  ).size
  const ctaCard = new Set(
    ev
      .filter(e => e.event_type === 'cta_click' && e.metadata?.origem === 'card')
      .map(e => e.session_id),
  ).size
  const buckets = new Map<number, Set<string>>()
  for (const e of ev) {
    if (e.event_type !== 'heartbeat' && e.event_type !== 'acesso') continue
    const b = Math.floor(new Date(e.created_at).getTime() / 30_000)
    if (!buckets.has(b)) buckets.set(b, new Set())
    buckets.get(b)!.add(e.session_id)
  }
  const pico = buckets.size ? Math.max(...[...buckets.values()].map(s => s.size)) : 0
  return {
    acessos,
    ofertaViews,
    ctaClicks,
    ctaDrawer,
    ctaCard,
    pico,
    retencaoPitch: acessos ? ofertaViews / acessos : 0,
    ctr: ofertaViews ? ctaClicks / ofertaViews : 0,
  }
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <p className="text-[11px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="text-2xl font-bold text-white mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-white/30 mt-1">{hint}</p>}
    </div>
  )
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>
}) {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')

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
