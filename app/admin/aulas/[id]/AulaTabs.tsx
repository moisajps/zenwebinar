'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Visão geral', href: '' },
  { label: 'Análise', href: '/analise' },
  { label: 'Configuração', href: '/config' },
  { label: 'Roteiro', href: '/roteiro' },
  { label: 'Mensagens', href: '/mensagens' },
  { label: 'Contatos', href: '/contatos' },
]

export function AulaTabs({ id }: { id: string }) {
  const pathname = usePathname()
  const base = `/admin/aulas/${id}`

  return (
    <nav
      role="tablist"
      aria-label="Seções da aula"
      className="flex gap-1 border-b mb-6 -mx-0 overflow-x-auto"
      style={{ borderColor: 'var(--admin-border)' }}
    >
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`
        const isActive = tab.href === ''
          ? pathname === base || pathname === `${base}/`
          : pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={tab.href}
            href={href}
            role="tab"
            aria-selected={isActive}
            className="px-4 py-2.5 text-[13px] font-medium -mb-px border-b-2 whitespace-nowrap transition-colors cursor-pointer"
            style={{
              borderColor: isActive ? 'var(--admin-accent)' : 'transparent',
              color: isActive ? 'var(--admin-text)' : 'var(--admin-muted)',
              textDecoration: 'none',
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
