import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/require-admin'

export default async function AdminDashboard() {
  const result = await requireAdmin()
  if (!result.ok) redirect('/admin/login')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <p className="text-white/50 mt-2">Bem-vindo ao painel Webinar.</p>
    </div>
  )
}
