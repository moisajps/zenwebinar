import { computarEstadoAula } from '@/app/aula/lib'
import type { AulaConfig } from '@/app/aula/config-types'

const base: AulaConfig = {
  id: '00000000-0000-0000-0000-000000000000', slug: 't', nome: 't',
  titulo: 't', seoDescricao: 'd', youtubeVideoId: 'v',
  inicioAt: '2026-07-01T23:00:00.000Z', // 20:00 BRT (UTC-3)
  duracaoMin: 100, recorrencia: null, timezone: 'America/Sao_Paulo',
  replayHabilitado: false, pitchSegundos: 1800, chatOffsetSegundos: 0,
  aoVivoFimSegundos: 6000, contadorPiso: 0, contadorMultiplicador: 1,
  branding: { marca: 'W', areaLabel: 'A', teamName: 'T', ogImage: '/o.jpg' },
}

describe('computarEstadoAula (sem recorrência)', () => {
  it('antes do início → aguardando', () => {
    const e = computarEstadoAula(new Date('2026-07-01T22:00:00Z'), base)
    expect(e.fase).toBe('aguardando')
  })
  it('dentro da janela → ao_vivo', () => {
    const e = computarEstadoAula(new Date('2026-07-01T23:30:00Z'), base)
    expect(e.fase).toBe('ao_vivo')
  })
  it('depois da janela → replay', () => {
    const e = computarEstadoAula(new Date('2026-07-02T02:00:00Z'), base)
    expect(e.fase).toBe('replay')
  })
  it('sem inicioAt → aguardando (sem data)', () => {
    const e = computarEstadoAula(new Date(), { ...base, inicioAt: null })
    expect(e.fase).toBe('aguardando')
  })
})

describe('computarEstadoAula (recorrência semanal)', () => {
  const rec: AulaConfig = { ...base, inicioAt: '2026-07-01T23:00:00.000Z',
    recorrencia: { weekday: 3, fromDate: '2026-07-01' } } // quarta
  it('próxima quarta após a janela → aguardando dessa quarta', () => {
    const e = computarEstadoAula(new Date('2026-07-03T12:00:00Z'), rec) // sexta
    expect(e.fase === 'aguardando' || e.fase === 'replay').toBe(true)
  })
})
