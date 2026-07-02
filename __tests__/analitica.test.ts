import { curvaRetencao, marcos, splitDevice } from '@/lib/analitica'

describe('curvaRetencao', () => {
  it('sem heartbeats → temDados false', () => {
    const c = curvaRetencao([])
    expect(c.temDados).toBe(false)
    expect(c.pontos).toEqual([])
    expect(c.pico).toEqual({ simultaneos: 0, minuto: 0 })
  })

  it('conta sessões distintas por balde de 60s', () => {
    const c = curvaRetencao([
      { session_id: 'a', video_seg: 10, created_at: '' },
      { session_id: 'b', video_seg: 20, created_at: '' },
      { session_id: 'a', video_seg: 70, created_at: '' },
      { session_id: 'c', video_seg: 80, created_at: '' },
    ])
    expect(c.pontos[0]).toEqual({ minuto: 0, simultaneos: 2, retencaoPct: 100 })
    expect(c.pontos[1]).toEqual({ minuto: 1, simultaneos: 2, retencaoPct: 100 })
    expect(c.pico.simultaneos).toBe(2)
  })

  it('normaliza pelo pico (metade do pico = 50%)', () => {
    const c = curvaRetencao([
      { session_id: 'a', video_seg: 10, created_at: '' },
      { session_id: 'b', video_seg: 20, created_at: '' },
      { session_id: 'a', video_seg: 70, created_at: '' },
    ])
    expect(c.pico.simultaneos).toBe(2)
    expect(c.pontos[0].retencaoPct).toBe(100)
    expect(c.pontos[1].retencaoPct).toBe(50)
  })

  it('dedup: mesma sessão 2x no mesmo balde conta 1', () => {
    const c = curvaRetencao([
      { session_id: 'a', video_seg: 5, created_at: '' },
      { session_id: 'a', video_seg: 15, created_at: '' },
    ])
    expect(c.pontos[0].simultaneos).toBe(1)
  })

  it('ignora video_seg inválido', () => {
    const c = curvaRetencao([
      { session_id: 'a', video_seg: -1, created_at: '' },
      { session_id: 'b', video_seg: NaN, created_at: '' },
    ])
    expect(c.temDados).toBe(false)
  })
})

describe('marcos', () => {
  it('minuto presente devolve valor; ausente devolve null', () => {
    const c = curvaRetencao([{ session_id: 'a', video_seg: 15 * 60 + 5, created_at: '' }])
    const m = marcos(c, [15, 30])
    expect(m[0]).toEqual({ minuto: 15, retencaoPct: 100, simultaneos: 1 })
    expect(m[1]).toEqual({ minuto: 30, retencaoPct: null, simultaneos: null })
  })
})

describe('splitDevice', () => {
  it('conta distinto por device e ignora null', () => {
    expect(splitDevice([
      { session_id: 'a', device: 'mobile' },
      { session_id: 'b', device: 'mobile' },
      { session_id: 'c', device: 'desktop' },
      { session_id: 'd', device: null },
    ])).toEqual({ mobile: 2, desktop: 1, total: 3, mobilePct: 67 })
  })

  it('tudo null → zeros', () => {
    expect(splitDevice([{ session_id: 'a', device: null }])).toEqual({ mobile: 0, desktop: 0, total: 0, mobilePct: 0 })
  })
})
