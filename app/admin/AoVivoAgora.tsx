'use client'
import { useEffect, useState } from 'react'

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
    <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
      <p className="text-[11px] uppercase tracking-wider text-rose-300/70">● Ao vivo agora</p>
      <p className="text-2xl font-bold text-white mt-1 tabular-nums">
        {n.exibido.toLocaleString('pt-BR')}
      </p>
      <p className="text-[11px] text-white/30 mt-1">real {n.real}</p>
    </div>
  )
}
