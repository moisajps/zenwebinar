import { notFound, redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getConfigById } from '@/lib/aula-config'
import { statusDaAula } from '@/lib/aula-status'
import { PageShell } from '@/components/admin/PageShell'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusChip } from '@/components/admin/StatusChip'
import { AulaTabs } from './AulaTabs'
import { AulaSubtitle } from './AulaSubtitle'
import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

export default async function AulaPanelLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ id: string }>
}) {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')

  const { id } = await params
  const aula = await getConfigById(id)
  if (!aula) notFound()

  const status = statusDaAula(aula)

  return (
    <PageShell>
      <PageHeader
        title={aula.nome}
        subtitle={<AulaSubtitle slug={aula.slug} />}
        actions={<StatusChip status={status} />}
      />
      <AulaTabs id={id} />
      <div>{children}</div>
    </PageShell>
  )
}
