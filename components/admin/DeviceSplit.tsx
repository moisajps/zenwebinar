import { Smartphone, Monitor } from 'lucide-react'
import type { DeviceSplit as DeviceSplitData } from '@/lib/analitica'

export function DeviceSplit({ split }: { split: DeviceSplitData }) {
  const desktopPct = split.total > 0 ? 100 - split.mobilePct : 0
  return (
    <div className="admin-card rounded-xl p-4 flex flex-col gap-3">
      <div className="flex h-8 rounded-md overflow-hidden" style={{ background: 'var(--admin-border)' }}>
        {split.mobilePct > 0 && (
          <div
            className="h-full flex items-center justify-center text-[11px] font-bold"
            style={{ width: `${split.mobilePct}%`, background: 'var(--admin-accent)', color: 'var(--admin-accent-contrast)' }}
          >
            {split.mobilePct >= 12 ? `${split.mobilePct}%` : ''}
          </div>
        )}
        {desktopPct > 0 && (
          <div
            className="h-full flex items-center justify-center text-[11px] font-bold admin-text"
            style={{ width: `${desktopPct}%`, background: 'var(--admin-faint)' }}
          >
            {desktopPct >= 12 ? `${desktopPct}%` : ''}
          </div>
        )}
      </div>
      <div className="flex items-center gap-6 text-xs">
        <span className="flex items-center gap-1.5 admin-muted">
          <Smartphone className="w-3.5 h-3.5" style={{ color: 'var(--admin-accent)' }} />
          Mobile <span className="admin-text font-semibold tabular-nums">{split.mobile}</span> ({split.mobilePct}%)
        </span>
        <span className="flex items-center gap-1.5 admin-muted">
          <Monitor className="w-3.5 h-3.5 admin-faint" />
          Desktop <span className="admin-text font-semibold tabular-nums">{split.desktop}</span> ({desktopPct}%)
        </span>
      </div>
    </div>
  )
}
