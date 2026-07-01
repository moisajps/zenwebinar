import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getRoteiro } from '@/lib/aula-config'
import { RoteiroEditor } from './RoteiroEditor'

export const dynamic = 'force-dynamic'

export default async function AdminRoteiroPage() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')
  const roteiro = await getRoteiro()
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-white mb-2">Roteiro do chat</h1>
      <p className="text-sm text-white/50 mb-6">Adicione mensagens com tempo (segundos ou mm:ss), nome e texto.</p>
      <RoteiroEditor inicial={roteiro} />
    </div>
  )
}
