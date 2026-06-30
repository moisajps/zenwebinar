import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-ssr'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const metadata: Metadata = {
  title: 'Webinar Admin',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <AdminContent>{children}</AdminContent>
    </div>
  )
}

async function AdminContent({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  // Página de login — sem sidebar, ocupa tela inteira
  if (!user) return <div className="flex-1">{children}</div>

  return (
    <>
      <AdminSidebar email={user.email ?? ''} />
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </>
  )
}
