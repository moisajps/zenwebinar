// app/aula/lib.ts — lógica pura de schedule, sem imports de Supabase
import type { AulaConfig, EstadoAula } from './config-types'

// Extrai partes de data/hora no timezone informado (ex.: America/Sao_Paulo)
function partsBR(d: Date, tz: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
  const p = Object.fromEntries(fmt.formatToParts(d).map(x => [x.type, x.value]))
  return { yyyy: +p.year, mm: +p.month, dd: +p.day, hh: +p.hour % 24, mi: +p.minute }
}

// Soma n dias a um instante ISO mantendo a hora UTC exata (desloca apenas a data UTC)
function addDaysIso(iso: string, n: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString()
}

// Retorna o par {inicio, fim} da próxima ocorrência (ou única, se sem recorrência).
// Com recorrência semanal avança de 7 em 7 dias até a janela [inicio, fim] não ter
// terminado antes de "agora".
function proximaOcorrencia(agora: Date, cfg: AulaConfig): { inicio: Date; fim: Date } | null {
  if (!cfg.inicioAt) return null
  const dur = cfg.duracaoMin * 60_000
  let inicio = new Date(cfg.inicioAt)
  if (!cfg.recorrencia) {
    return { inicio, fim: new Date(inicio.getTime() + dur) }
  }
  // Recorrência semanal: avança até a janela cobrir ou ultrapassar "agora"
  let guard = 0
  while (new Date(inicio.getTime() + dur) < agora && guard < 520) {
    inicio = new Date(addDaysIso(inicio.toISOString(), 7))
    guard++
  }
  return { inicio, fim: new Date(inicio.getTime() + dur) }
}

export function computarEstadoAula(agora: Date, cfg: AulaConfig): EstadoAula {
  const occ = proximaOcorrencia(agora, cfg)

  // Sem inicioAt → aguardando sem data definida
  if (!occ) {
    return { fase: 'aguardando', proximoInicio: agora.toISOString(), isToday: false }
  }

  const { inicio, fim } = occ

  // Antes da janela → aguardando
  if (agora < inicio) {
    const isToday = partsBR(agora, cfg.timezone).dd === partsBR(inicio, cfg.timezone).dd
    return { fase: 'aguardando', proximoInicio: inicio.toISOString(), isToday }
  }

  // Dentro da janela (inclusive limite do fim) → ao_vivo
  if (agora <= fim) {
    return { fase: 'ao_vivo', inicio: inicio.toISOString(), fim: fim.toISOString() }
  }

  // Passou a janela → replay.
  // Com recorrência, proximaOcorrencia já avançou; aqui seria borda pós-guard
  const prox = cfg.recorrencia
    ? new Date(addDaysIso(inicio.toISOString(), 7)).toISOString()
    : inicio.toISOString()
  return { fase: 'replay', proximoInicio: prox }
}
