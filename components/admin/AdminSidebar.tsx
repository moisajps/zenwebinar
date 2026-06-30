'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/aula', label: 'Configuração da aula' },
  { href: '/admin/roteiro', label: 'Roteiro do chat' },
  { href: '/admin/mensagem', label: 'Mensagem oficial' },
]

interface Props { email: string }

export function AdminSidebar({ email }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    const supabase = createSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <aside
      className="flex-shrink-0 bg-[#111111] border-r border-white/6 flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-200"
      style={{ width: collapsed ? 56 : 224 }}
    >
      {/* Brand + toggle */}
      <div className={[
        'border-b border-white/6 flex items-center',
        collapsed ? 'px-0 justify-center py-5' : 'px-5 pt-7 pb-6 justify-between',
      ].join(' ')}>
        {!collapsed && (
          <p className="font-sans font-semibold text-white text-sm">Webinar Admin</p>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-colors shrink-0"
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <polyline points="9 18 15 12 9 6" />
              : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto flex flex-col gap-0.5">
        {NAV.map(({ href, label }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              prefetch
              title={collapsed ? label : undefined}
              className={[
                'flex items-center rounded-lg transition-colors duration-150',
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                active
                  ? 'bg-white/8 text-white font-medium'
                  : 'text-white/45 hover:text-white/80 hover:bg-white/5',
              ].join(' ')}
            >
              {!collapsed && (
                <span className="font-sans text-sm">{label}</span>
              )}
              {collapsed && (
                <span className="font-sans text-xs font-bold text-white/40">{label[0]}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className={['border-t border-white/6', collapsed ? 'px-2 py-4' : 'px-4 py-5'].join(' ')}>
        {!collapsed && (
          <p className="font-sans text-[11px] text-white/25 truncate mb-3">{email}</p>
        )}
        <button
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
          className={[
            'w-full flex items-center rounded-lg font-sans text-xs text-white/35 hover:text-white/60 hover:bg-white/5 transition-colors duration-150 cursor-pointer',
            collapsed ? 'justify-center px-0 py-2' : 'gap-2 px-3 py-2',
          ].join(' ')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          {!collapsed && 'Sair'}
        </button>
      </div>
    </aside>
  )
}

// Match exato para /admin, prefix para sub-rotas
function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}
