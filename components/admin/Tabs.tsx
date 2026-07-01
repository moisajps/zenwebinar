'use client'
import { useState, type ReactNode } from 'react'

export function Tabs({ tabs, children }: { tabs: { id: string; label: string }[]; children: (active: string) => ReactNode }) {
  const [active, setActive] = useState(tabs[0]?.id)
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight') setActive(tabs[(i + 1) % tabs.length].id)
    if (e.key === 'ArrowLeft') setActive(tabs[(i - 1 + tabs.length) % tabs.length].id)
  }
  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b mb-5" style={{ borderColor: 'var(--admin-border)' }}>
        {tabs.map((t, i) => {
          const on = t.id === active
          return (
            <button key={t.id} role="tab" aria-selected={on} tabIndex={on ? 0 : -1}
              onKeyDown={(e) => onKey(e, i)} onClick={() => setActive(t.id)}
              className="px-4 py-2.5 text-[13px] font-medium -mb-px border-b-2 transition-colors"
              style={{ borderColor: on ? 'var(--admin-accent)' : 'transparent', color: on ? 'var(--admin-text)' : 'var(--admin-muted)' }}>
              {t.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel">{children(active)}</div>
    </div>
  )
}
