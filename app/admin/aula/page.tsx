import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getActiveConfig } from '@/lib/aula-config'
import { ConfigForm } from './ConfigForm'

export const dynamic = 'force-dynamic'

export default async function AdminAulaPage() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')
  const cfg = await getActiveConfig()
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-white mb-6">Configuração da aula</h1>
      <ConfigForm inicial={cfg} />
    </div>
  )
}
