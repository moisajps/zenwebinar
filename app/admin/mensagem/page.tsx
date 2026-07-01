import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getActiveConfig } from '@/lib/aula-config'
import { PageShell } from '@/components/admin/PageShell'
import { PageHeader } from '@/components/admin/PageHeader'
import { MensagemForm } from './MensagemForm'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')
  const cfg = await getActiveConfig()
  return (
    <PageShell>
      <PageHeader title="Mensagem oficial" subtitle="Aparece destacada no chat ao vivo" />
      <MensagemForm teamName={cfg.branding.teamName} />
    </PageShell>
  )
}
