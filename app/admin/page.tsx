import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { listAulas } from '@/lib/aula-config'
import { supabaseAdmin } from '@/lib/supabase'
import { statusDaAula } from '@/lib/aula-status'
import { PageShell } from '@/components/admin/PageShell'
import { PageHeader } from '@/components/admin/PageHeader'
import { AulasList, NovaAulaButton, type AulaComResumo } from './AulasList'

export const dynamic = 'force-dynamic'

/** Busca resumo (acessos + cliques) de todas as aulas em uma única query. */
async function getResumos(): Promise<Map<string, { acessos: number; cliques: number }>> {
  const { data } = await supabaseAdmin
    .from('aula_eventos')
    .select('aula_id, session_id, event_type')

  const map = new Map<string, { sessions: Set<string>; cliques: number }>()

  for (const row of data ?? []) {
    const id = row.aula_id as string
    if (!id) continue
    if (!map.has(id)) map.set(id, { sessions: new Set(), cliques: 0 })
    const entry = map.get(id)!
    if (row.event_type === 'acesso') {
      entry.sessions.add(row.session_id as string)
    } else if (row.event_type === 'cta_click') {
      entry.cliques++
    }
  }

  const result = new Map<string, { acessos: number; cliques: number }>()
  for (const [id, entry] of map.entries()) {
    result.set(id, { acessos: entry.sessions.size, cliques: entry.cliques })
  }
  return result
}

export default async function AdminPage() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')

  const [aulas, resumos] = await Promise.all([listAulas(), getResumos()])

  const agora = new Date()
  const aulasComResumo: AulaComResumo[] = aulas.map((a) => {
    const r = resumos.get(a.id) ?? { acessos: 0, cliques: 0 }
    return {
      id: a.id,
      slug: a.slug,
      nome: a.nome,
      inicioAt: a.inicioAt,
      timezone: a.timezone,
      status: statusDaAula(a, agora),
      acessos: r.acessos,
      cliques: r.cliques,
    }
  })

  return (
    <PageShell>
      <PageHeader
        title="Aulas"
        subtitle="Seus webinars"
        actions={<NovaAulaButton />}
      />
      <AulasList aulas={aulasComResumo} />
    </PageShell>
  )
}
