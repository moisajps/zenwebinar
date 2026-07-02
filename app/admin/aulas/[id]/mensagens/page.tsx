import { redirect, notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getConfigById } from '@/lib/aula-config'
import { MensagemForm } from '@/app/admin/mensagem/MensagemForm'

export const dynamic = 'force-dynamic'

export default async function MensagensPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')

  const { id } = await params
  const cfg = await getConfigById(id)
  if (!cfg) notFound()

  return (
    <div className="admin-text">
      <div className="mb-6">
        <h2 className="text-lg font-bold admin-text">Mensagem oficial</h2>
        <p className="text-sm admin-muted">Aparece destacada no chat ao vivo desta aula</p>
      </div>
      <MensagemForm teamName={cfg.branding.teamName} aulaId={id} />
    </div>
  )
}
