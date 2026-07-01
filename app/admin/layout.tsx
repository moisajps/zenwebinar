import type { Metadata } from 'next'
import { createSupabaseServer } from '@/lib/supabase-ssr'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ThemeProviderClient } from '@/components/admin/ThemeProviderClient'

export const metadata: Metadata = {
  title: 'Webinar Admin',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderClient>
      <div className="min-h-screen admin-bg flex">
        <AdminContent>{children}</AdminContent>
      </div>
    </ThemeProviderClient>
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
