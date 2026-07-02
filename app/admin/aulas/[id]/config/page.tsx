import { redirect, notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getConfigById } from '@/lib/aula-config'
import { ConfigForm } from '@/app/admin/aula/ConfigForm'

export const dynamic = 'force-dynamic'

export default async function ConfigPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')

  const { id } = await params
  const cfg = await getConfigById(id)
  if (!cfg) notFound()

  return <ConfigForm inicial={cfg} aulaId={id} />
}
