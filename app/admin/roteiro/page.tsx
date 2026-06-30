import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { getRoteiro } from '@/lib/aula-config'
import { RoteiroEditor } from './RoteiroEditor'

export const dynamic = 'force-dynamic'

export default async function AdminRoteiroPage() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')
  const roteiro = await getRoteiro()
  const texto = roteiro.map(r => `${r.delay} | ${r.name} | ${r.msg}`).join('\n')
  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-white mb-2">Roteiro do chat</h1>
      <p className="text-sm text-white/50 mb-6">Uma linha por mensagem no formato <code>tempo | nome | mensagem</code>. Tempo em segundos ou mm:ss.</p>
      <RoteiroEditor inicial={texto} />
    </div>
  )
}
