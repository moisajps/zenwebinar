import type { ReactNode } from 'react'
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'var(--admin-border)' }}>
      <div className="min-w-0">
        <h1 className="text-xl font-bold admin-text leading-tight">{title}</h1>
        {subtitle && <p className="text-sm admin-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
