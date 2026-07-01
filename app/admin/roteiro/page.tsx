import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getRoteiro } from '@/lib/aula-config'
import { RoteiroEditor } from './RoteiroEditor'
import { PageShell } from '@/components/admin/PageShell'
import { PageHeader } from '@/components/admin/PageHeader'

export const dynamic = 'force-dynamic'

export default async function AdminRoteiroPage() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')
  const roteiro = await getRoteiro()
  return (
    <PageShell>
      <PageHeader title="Roteiro do chat" subtitle="Mensagens simuladas por tempo" />
      <RoteiroEditor inicial={roteiro} />
    </PageShell>
  )
}
