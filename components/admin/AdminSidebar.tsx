'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'
import { Video, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

interface Props { email: string }

export function AdminSidebar({ email }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  const aulasActive = pathname === '/admin' || pathname.startsWith('/admin/aulas')

  return (
    <aside
      data-tour="sidebar"
      className="flex-shrink-0 admin-panel border-r flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-200"
      style={{ width: collapsed ? 56 : 224, borderColor: 'var(--admin-border)' }}
    >
      {/* Brand + toggle */}
      <div
        className={[
          'flex items-center',
          collapsed ? 'px-0 justify-center py-5' : 'px-5 pt-7 pb-6 justify-between',
        ].join(' ')}
        style={{ borderBottom: '1px solid var(--admin-border)' }}
      >
        {!collapsed && (
          <p className="font-sans font-semibold admin-text text-sm">zenwebinar</p>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-7 h-7 rounded-lg admin-muted hover:admin-text hover:admin-panel transition-colors shrink-0 cursor-pointer"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed
            ? <ChevronRight size={14} />
            : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto flex flex-col gap-0.5">
        <Link
          href="/admin"
          prefetch
          title={collapsed ? 'Aulas' : undefined}
          data-tour="nav-aulas"
          className={[
            'flex items-center rounded-lg transition-colors duration-150',
            collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
            aulasActive
              ? 'admin-text font-medium'
              : 'admin-muted hover:admin-text',
          ].join(' ')}
          style={aulasActive ? { background: 'var(--admin-border)' } : undefined}
        >
          <Video size={16} />
          {!collapsed && (
            <span className="font-sans text-sm">Aulas</span>
          )}
        </Link>
      </nav>

      {/* User + logout */}
      <div
        className={['', collapsed ? 'px-2 py-4' : 'px-4 py-5'].join(' ')}
        style={{ borderTop: '1px solid var(--admin-border)' }}
      >
        {!collapsed && (
          <p className="font-sans text-[11px] admin-muted truncate mb-3">{email}</p>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
          className={[
            'w-full flex items-center rounded-lg font-sans text-xs admin-muted hover:admin-text hover:admin-panel transition-colors duration-150 cursor-pointer',
            collapsed ? 'justify-center px-0 py-2' : 'gap-2 px-3 py-2',
          ].join(' ')}
        >
          <LogOut size={14} />
          {!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  )
}
