'use client'
import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'

export function AoVivoAgora({ aulaDate }: { aulaDate: string }) {
  const [n, setN] = useState<{ real: number; exibido: number }>({ real: 0, exibido: 0 })

  useEffect(() => {
    let alive = true
    const f = async () => {
      try {
        const r = await fetch(`/api/aula/ao-vivo?data=${aulaDate}`)
        const j = await r.json()
        if (alive) setN(j)
      } catch {
        // best-effort
      }
    }
    f()
    const id = setInterval(f, 8000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [aulaDate])

  return (
    <div className="admin-card rounded-xl p-6 flex items-center gap-5">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 shrink-0">
        <Radio className="w-6 h-6 text-rose-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"
          />
          <p className="text-[11px] uppercase tracking-wider admin-muted">Ao vivo agora</p>
        </div>
        <p className="text-4xl font-bold admin-text tabular-nums leading-none">
          {n.exibido.toLocaleString('pt-BR')}
        </p>
        <p className="text-[11px] admin-muted mt-1">real {n.real}</p>
      </div>
    </div>
  )
}
