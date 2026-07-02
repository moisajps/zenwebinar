import { redirect, notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getConfigById } from '@/lib/aula-config'
import { supabaseAdmin } from '@/lib/supabase'
import { Card } from '@/components/admin/Card'
import { Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Contato = { email: string; nome: string | null; primeiroAcesso: string }

/** Deriva os contatos que acessaram esta aula a partir dos eventos `acesso`. */
async function getContatos(aulaId: string): Promise<Contato[]> {
  const PAGE = 1000
  const primeiro = new Map<string, string>() // email → menor created_at
  let off = 0
  while (true) {
    const { data } = await supabaseAdmin
      .from('aula_eventos')
      .select('email, created_at')
      .eq('aula_id', aulaId)
      .eq('event_type', 'acesso')
      .not('email', 'is', null)
      .range(off, off + PAGE - 1)
    if (!data?.length) break
    for (const row of data) {
      const email = row.email as string
      const at = row.created_at as string
      const atual = primeiro.get(email)
      if (!atual || at < atual) primeiro.set(email, at)
    }
    if (data.length < PAGE) break
    off += PAGE
  }

  if (primeiro.size === 0) return []

  // Enriquecer com o nome capturado na inscrição (tabela existente, não é PII nova).
  const emails = [...primeiro.keys()]
  const nomes = new Map<string, string | null>()
  const { data: inscritos } = await supabaseAdmin
    .from('aula_inscritos')
    .select('email, first_name')
    .in('email', emails)
  for (const r of inscritos ?? []) nomes.set(r.email as string, (r.first_name as string | null) ?? null)

  return [...primeiro.entries()]
    .map(([email, at]) => ({ email, nome: nomes.get(email) ?? null, primeiroAcesso: at }))
    .sort((a, b) => (a.primeiroAcesso < b.primeiroAcesso ? 1 : -1))
}

export default async function ContatosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')

  const { id } = await params
  const cfg = await getConfigById(id)
  if (!cfg) notFound()

  const contatos = await getContatos(id)
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      timeZone: cfg.timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="admin-text">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold admin-text">Contatos</h2>
          <p className="text-sm admin-muted">
            Quem acessou esta aula (por e-mail). Exportar para CSV chega em breve.
          </p>
        </div>
        {contatos.length > 0 && (
          <span className="text-sm admin-muted tabular-nums">
            {contatos.length.toLocaleString('pt-BR')} contato{contatos.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {contatos.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center text-center py-12 gap-2">
            <Users className="w-8 h-8 admin-faint" />
            <p className="admin-text font-medium">Ninguém acessou ainda</p>
            <p className="text-sm admin-muted max-w-sm">
              Assim que as pessoas entrarem na aula com o e-mail, elas aparecem aqui.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left admin-muted border-b admin-border">
                <th className="font-medium px-4 py-3">Nome</th>
                <th className="font-medium px-4 py-3">E-mail</th>
                <th className="font-medium px-4 py-3">Acessou em</th>
              </tr>
            </thead>
            <tbody>
              {contatos.map((c) => (
                <tr key={c.email} className="border-b admin-border last:border-0">
                  <td className="px-4 py-3 admin-text">{c.nome ?? '—'}</td>
                  <td className="px-4 py-3 admin-text">{c.email}</td>
                  <td className="px-4 py-3 admin-muted tabular-nums whitespace-nowrap">{fmt(c.primeiroAcesso)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
