import type { ReactNode } from 'react'
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <p className="text-[11px] uppercase tracking-wider admin-muted mb-2">{title}</p>
      {children}
    </section>
  )
}
