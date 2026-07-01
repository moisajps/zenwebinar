import type { AulaConfig } from '@/app/aula/config-types'
import { computarEstadoAula } from '@/app/aula/lib'

export type StatusAula = 'rascunho' | 'agendada' | 'ao_vivo' | 'encerrada'

export function statusDaAula(
  cfg: Pick<AulaConfig, 'inicioAt' | 'recorrencia' | 'duracaoMin' | 'timezone' | 'replayHabilitado'>,
  agora = new Date(),
): StatusAula {
  if (!cfg.inicioAt && !cfg.recorrencia) return 'rascunho'
  const est = computarEstadoAula(agora, cfg as AulaConfig)
  if (est.fase === 'ao_vivo') return 'ao_vivo'
  if (est.fase === 'aguardando') return 'agendada'
  return 'encerrada'
}
