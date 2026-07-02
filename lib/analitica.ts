// Funções puras de análise de uma aula. Sem I/O — dados vêm de aula_eventos já buscados.

export type HeartbeatEvento = { session_id: string; video_seg: number; created_at: string }
export type AcessoEvento = { session_id: string; device: 'mobile' | 'desktop' | null }

export type PontoCurva = { minuto: number; simultaneos: number; retencaoPct: number }
export type CurvaRetencao = {
  pontos: PontoCurva[]
  pico: { simultaneos: number; minuto: number }
  temDados: boolean
}

/**
 * Curva de retenção por posição no vídeo. Agrupa heartbeats em baldes de `bucketSeg`
 * (default 60s); simultaneos[b] = sessões DISTINTAS com heartbeat no balde;
 * pico = max; retencaoPct = round(simultaneos / pico * 100). Sem dados válidos →
 * { pontos: [], pico: {0,0}, temDados: false }.
 */
export function curvaRetencao(heartbeats: HeartbeatEvento[], bucketSeg = 60): CurvaRetencao {
  const baldes = new Map<number, Set<string>>()
  for (const h of heartbeats) {
    if (typeof h.video_seg !== 'number' || !Number.isFinite(h.video_seg) || h.video_seg < 0) continue
    const b = Math.floor(h.video_seg / bucketSeg)
    if (!baldes.has(b)) baldes.set(b, new Set())
    baldes.get(b)!.add(h.session_id)
  }
  if (baldes.size === 0) {
    return { pontos: [], pico: { simultaneos: 0, minuto: 0 }, temDados: false }
  }
  const buckets = [...baldes.keys()].sort((a, b) => a - b)
  let pico = 0
  let picoBucket = buckets[0]
  for (const b of buckets) {
    const n = baldes.get(b)!.size
    if (n > pico) { pico = n; picoBucket = b }
  }
  const pontos: PontoCurva[] = buckets.map(b => {
    const simultaneos = baldes.get(b)!.size
    return {
      minuto: Math.round((b * bucketSeg) / 60),
      simultaneos,
      retencaoPct: pico > 0 ? Math.round((simultaneos / pico) * 100) : 0,
    }
  })
  return { pontos, pico: { simultaneos: pico, minuto: Math.round((picoBucket * bucketSeg) / 60) }, temDados: true }
}

export type Marco = { minuto: number; retencaoPct: number | null; simultaneos: number | null }

/** Retenção nos minutos pedidos, lida dos pontos da curva. Minuto sem balde → nulls. */
export function marcos(curva: CurvaRetencao, minutos: number[] = [15, 30, 45, 60]): Marco[] {
  return minutos.map(minuto => {
    const p = curva.pontos.find(pt => pt.minuto === minuto)
    return p
      ? { minuto, retencaoPct: p.retencaoPct, simultaneos: p.simultaneos }
      : { minuto, retencaoPct: null, simultaneos: null }
  })
}

export type DeviceSplit = { mobile: number; desktop: number; total: number; mobilePct: number }

/** Conta sessões DISTINTAS por device (ignora null). total = mobile + desktop. */
export function splitDevice(acessos: AcessoEvento[]): DeviceSplit {
  const mob = new Set<string>()
  const desk = new Set<string>()
  for (const a of acessos) {
    if (a.device === 'mobile') mob.add(a.session_id)
    else if (a.device === 'desktop') desk.add(a.session_id)
  }
  const mobile = mob.size
  const desktop = desk.size
  const total = mobile + desktop
  return { mobile, desktop, total, mobilePct: total > 0 ? Math.round((mobile / total) * 100) : 0 }
}
