import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getActiveConfig } from '@/lib/aula-config'
import { ConfigForm } from './ConfigForm'
import { PageShell } from '@/components/admin/PageShell'

export const dynamic = 'force-dynamic'

export default async function AdminAulaPage() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')
  const cfg = await getActiveConfig()
  return (
    <PageShell>
      <ConfigForm inicial={cfg} />
    </PageShell>
  )
}
