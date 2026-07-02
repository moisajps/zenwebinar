import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { supabaseAdmin } from '@/lib/supabase'
import { AoVivoAgora } from '@/app/admin/AoVivoAgora'
import { Funnel } from '@/components/admin/Funnel'
import { Section } from '@/components/admin/Section'
import { Kpi } from '@/components/admin/Kpi'
import { Users, Eye, MousePointerClick, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Evento = {
  session_id: string
  event_type: string
  created_at: string
  metadata: Record<string, unknown> | null
}

async function fetchAll(aulaId: string): Promise<Evento[]> {
  const PAGE = 1000
  const all: Evento[] = []
  let off = 0
  while (true) {
    const { data } = await supabaseAdmin
      .from('aula_eventos')
      .select('session_id, event_type, created_at, metadata')
      .eq('aula_id', aulaId)
      .range(off, off + PAGE - 1)
    if (!data?.length) break
    all.push(...(data as Evento[]))
    if (data.length < PAGE) break
    off += PAGE
  }
  return all
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

export default async function VisaoGeral({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')

  const { id } = await params
  const s = getStats(await fetchAll(id))

  return (
    <div data-tour="dashboard">
      {/* Wide layout: KPIs left + Funnel right */}
      <div className="xl:grid xl:grid-cols-[2fr_1fr] xl:gap-6">
        {/* Left column: hero + KPI groups */}
        <div>
          {/* Hero — Ao vivo agora */}
          <div className="mb-6">
            <AoVivoAgora aulaId={id} />
          </div>

          {/* Aquisição KPIs */}
          <Section title="Aquisição">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3">
              <Kpi label="Acessos" value={s.acessos.toLocaleString('pt-BR')} hint="entraram na aula" icon={Users} />
              <Kpi label="Pico simultâneo" value={s.pico.toLocaleString('pt-BR')} hint="máx. ao mesmo tempo" icon={TrendingUp} />
              <Kpi label="Viram o pitch" value={s.ofertaViews.toLocaleString('pt-BR')} hint="drawer da oferta" icon={Eye} />
            </div>
          </Section>

          {/* Oferta KPIs */}
          <Section title="Oferta">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3">
              <Kpi label="Retenção até pitch" value={pct(s.retencaoPitch)} hint="viram pitch ÷ acessos" icon={TrendingUp} />
              <Kpi label="Cliques no CTA" value={s.ctaClicks.toLocaleString('pt-BR')} hint={`drawer ${s.ctaDrawer} · card ${s.ctaCard}`} icon={MousePointerClick} />
              <Kpi label="CTR da oferta" value={pct(s.ctr)} hint="cliques ÷ viram pitch" icon={TrendingUp} />
            </div>
          </Section>
        </div>

        {/* Right column: Funnel sticky */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <Funnel
            steps={[
              { label: 'Acessos', value: s.acessos },
              { label: 'Viram o pitch', value: s.ofertaViews },
              { label: 'Cliques no CTA', value: s.ctaClicks },
            ]}
          />
        </div>
      </div>
    </div>
  )
}
