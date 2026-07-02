import { redirect, notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getConfigById, getRoteiro } from '@/lib/aula-config'
import { RoteiroEditor } from '@/app/admin/roteiro/RoteiroEditor'

export const dynamic = 'force-dynamic'

export default async function RoteiroPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')

  const { id } = await params
  const cfg = await getConfigById(id)
  if (!cfg) notFound()

  const roteiro = await getRoteiro(id)
  return <RoteiroEditor inicial={roteiro} aulaId={id} />
}
