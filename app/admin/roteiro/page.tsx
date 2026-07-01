import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getRoteiro } from '@/lib/aula-config'
import { RoteiroEditor } from './RoteiroEditor'
import { PageShell } from '@/components/admin/PageShell'

export const dynamic = 'force-dynamic'

export default async function AdminRoteiroPage() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')
  const roteiro = await getRoteiro()
  return (
    <PageShell>
      <RoteiroEditor inicial={roteiro} />
    </PageShell>
  )
}
