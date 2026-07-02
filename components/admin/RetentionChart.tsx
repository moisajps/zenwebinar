'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, ResponsiveContainer,
} from 'recharts'
import type { PontoCurva } from '@/lib/analitica'

type Props = {
  pontos: PontoCurva[]
  pico: { simultaneos: number; minuto: number }
  pitchMinuto: number | null
}

function TooltipConteudo({ active, payload }: { active?: boolean; payload?: { payload: PontoCurva }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="admin-card rounded-lg px-3 py-2 text-xs" style={{ borderColor: 'var(--admin-border)' }}>
      <p className="admin-text font-semibold">aos {p.minuto}min</p>
      <p className="admin-muted">{p.retencaoPct}% · ~{p.simultaneos} pessoa{p.simultaneos === 1 ? '' : 's'}</p>
    </div>
  )
}

export function RetentionChart({ pontos, pico, pitchMinuto }: Props) {
  return (
    <div className="admin-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-wider admin-muted">Curva de retenção</p>
        <p className="text-[11px] admin-muted">pico: {pico.simultaneos} aos {pico.minuto}min</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={pontos} margin={{ top: 12, right: 12, bottom: 4, left: -12 }}>
          <defs>
            <linearGradient id="retencaoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--admin-accent)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--admin-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
          <XAxis dataKey="minuto" tickFormatter={(m) => `${m}m`} stroke="var(--admin-muted)" fontSize={11} tickLine={false} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="var(--admin-muted)" fontSize={11} tickLine={false} width={40} />
          <Tooltip content={<TooltipConteudo />} />
          {pitchMinuto != null && (
            <ReferenceLine
              x={pitchMinuto}
              stroke="var(--admin-accent)"
              strokeDasharray="4 4"
              label={{ value: 'pitch', position: 'top', fontSize: 10, fill: 'var(--admin-muted)' }}
            />
          )}
          <Area type="monotone" dataKey="retencaoPct" stroke="var(--admin-accent)" strokeWidth={2} fill="url(#retencaoFill)" />
          <ReferenceDot
            x={pico.minuto}
            y={100}
            r={4}
            fill="var(--admin-accent)"
            stroke="var(--admin-accent-contrast)"
            strokeWidth={1.5}
            label={{ value: 'pico', position: 'top', fontSize: 10, fill: 'var(--admin-text)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
