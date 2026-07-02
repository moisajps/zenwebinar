import { redirect, notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getConfigById } from '@/lib/aula-config'
import { supabaseAdmin } from '@/lib/supabase'
import { curvaRetencao, marcos, splitDevice, type HeartbeatEvento, type AcessoEvento } from '@/lib/analitica'
import { RetentionChart } from '@/components/admin/RetentionChart'
import { DeviceSplit } from '@/components/admin/DeviceSplit'
import { Kpi } from '@/components/admin/Kpi'
import { Section } from '@/components/admin/Section'
import { Card } from '@/components/admin/Card'
import { TrendingUp, LineChart } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Row = { session_id: string; event_type: string; created_at: string; metadata: Record<string, unknown> | null }

async function fetchEventos(aulaId: string): Promise<Row[]> {
  const PAGE = 1000
  const all: Row[] = []
  let off = 0
  while (true) {
    const { data } = await supabaseAdmin
      .from('aula_eventos')
      .select('session_id, event_type, created_at, metadata')
      .eq('aula_id', aulaId)
      .in('event_type', ['heartbeat', 'acesso'])
      .range(off, off + PAGE - 1)
    if (!data?.length) break
    all.push(...(data as Row[]))
    if (data.length < PAGE) break
    off += PAGE
  }
  return all
}

export default async function AnalisePage({ params }: { params: Promise<{ id: string }> }) {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')

  const { id } = await params
  const cfg = await getConfigById(id)
  if (!cfg) notFound()

  const rows = await fetchEventos(id)
  const heartbeats: HeartbeatEvento[] = rows
    .filter(r => r.event_type === 'heartbeat' && typeof r.metadata?.video_seg === 'number')
    .map(r => ({ session_id: r.session_id, video_seg: r.metadata!.video_seg as number, created_at: r.created_at }))
  const acessos: AcessoEvento[] = rows
    .filter(r => r.event_type === 'acesso')
    .map(r => ({ session_id: r.session_id, device: (r.metadata?.device as 'mobile' | 'desktop' | undefined) ?? null }))

  const curva = curvaRetencao(heartbeats)
  const marcosList = marcos(curva)
  const device = splitDevice(acessos)
  const pitchMinuto = cfg.pitchSegundos ? Math.round(cfg.pitchSegundos / 60) : null

  return (
    <div className="admin-text flex flex-col gap-6">
      {curva.temDados ? (
        <RetentionChart pontos={curva.pontos} pico={curva.pico} pitchMinuto={pitchMinuto} />
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center text-center py-12 gap-2">
            <LineChart className="w-8 h-8 admin-faint" />
            <p className="admin-text font-medium">Curva de retenção em breve</p>
            <p className="text-sm admin-muted max-w-sm">
              A curva aparece após a primeira aula ao vivo com o código novo, que registra a posição no vídeo a cada minuto.
            </p>
          </div>
        </Card>
      )}

      {curva.temDados && (
        <Section title="Retenção nos marcos">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {marcosList.map(m => (
              <Kpi
                key={m.minuto}
                label={`${m.minuto} min`}
                value={m.retencaoPct != null ? `${m.retencaoPct}%` : '—'}
                hint={m.simultaneos != null ? `~${m.simultaneos} pessoas` : 'após o fim'}
                icon={TrendingUp}
              />
            ))}
          </div>
        </Section>
      )}

      {device.total > 0 && (
        <Section title="Dispositivos">
          <DeviceSplit split={device} />
        </Section>
      )}
    </div>
  )
}
