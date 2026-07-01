import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getActiveConfig, getRoteiro } from '@/lib/aula-config'
import { RoteiroEditor } from './RoteiroEditor'
import { PageShell } from '@/components/admin/PageShell'

export const dynamic = 'force-dynamic'

export default async function AdminRoteiroPage() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')
  const cfg = await getActiveConfig()
  const roteiro = await getRoteiro(cfg.id)
  return (
    <PageShell>
      <RoteiroEditor inicial={roteiro} />
    </PageShell>
  )
}
