import type { StatusAula } from '@/lib/aula-status'

const CONFIG: Record<StatusAula, { label: string; dot: string; bg: string; text: string; border?: string }> = {
  ao_vivo: {
    label: 'Ao vivo',
    dot: '#EF4444',
    bg: '#FEF2F2',
    text: '#B91C1C',
  },
  agendada: {
    label: 'Agendada',
    dot: '#F59E0B',
    bg: '#FFFBEB',
    text: '#B45309',
  },
  encerrada: {
    label: 'Encerrada',
    dot: '#9B9DA3',
    bg: '#F6F6F8',
    text: '#6E7076',
  },
  rascunho: {
    label: 'Rascunho',
    dot: '#9B9DA3',
    bg: 'transparent',
    text: '#6E7076',
    border: '#E7E7EA',
  },
}

export function StatusChip({ status }: { status: StatusAula }) {
  const c = CONFIG[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2 py-0.5 leading-none"
      style={{
        background: c.bg,
        color: c.text,
        border: c.border ? `1px solid ${c.border}` : undefined,
      }}
    >
      <span
        className={status === 'ao_vivo' ? 'animate-pulse' : ''}
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.dot,
          flexShrink: 0,
        }}
      />
      {c.label}
    </span>
  )
}
