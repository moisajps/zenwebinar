import { Card } from '@/components/admin/Card'
import type { LucideIcon } from 'lucide-react'

export function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
}) {
  return (
    <Card className="cursor-default">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 admin-muted shrink-0" />}
        <p className="text-[11px] uppercase tracking-wider admin-muted">{label}</p>
      </div>
      <p className="text-2xl font-bold admin-text tabular-nums">{value}</p>
      {hint && <p className="text-[11px] admin-muted mt-1">{hint}</p>}
    </Card>
  )
}
