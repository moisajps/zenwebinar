import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'
import { MensagemForm } from './MensagemForm'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold text-white mb-6">Mensagem oficial</h1>
      <MensagemForm />
    </div>
  )
}
