import { rowToConfig } from '@/lib/aula-config'
import { SEED_CONFIG } from '@/content/config'

describe('rowToConfig', () => {
  it('cai no seed quando row é null', () => {
    expect(rowToConfig(null)).toEqual(SEED_CONFIG)
  })

  it('mapeia snake_case e jsonb para o AulaConfig', () => {
    const cfg = rowToConfig({
      id: 'aaa-bbb-ccc',
      slug: 'minha-aula',
      nome: 'Minha Aula',
      titulo: 'Minha Aula',
      youtube_video_id: 'abc123',
      inicio_at: '2026-07-01T23:00:00.000Z',
      duracao_min: 90,
      replay_habilitado: true,
      pitch_segundos: 1200,
      contador_piso: 80,
      contador_multiplicador: 1.5,
      oferta: { ativo: true, link: 'https://x.com', cta: 'Comprar' },
      branding: { marca: 'X', areaLabel: 'Alunos', teamName: 'Time X', ogImage: '/o.jpg' },
    })
    expect(cfg.id).toBe('aaa-bbb-ccc')
    expect(cfg.slug).toBe('minha-aula')
    expect(cfg.nome).toBe('Minha Aula')
    expect(cfg.titulo).toBe('Minha Aula')
    expect(cfg.youtubeVideoId).toBe('abc123')
    expect(cfg.inicioAt).toBe('2026-07-01T23:00:00.000Z')
    expect(cfg.duracaoMin).toBe(90)
    expect(cfg.replayHabilitado).toBe(true)
    expect(cfg.contadorPiso).toBe(80)
    expect(cfg.contadorMultiplicador).toBe(1.5)
    expect(cfg.oferta?.ativo).toBe(true)
    expect(cfg.branding.marca).toBe('X')
    // campo ausente cai no seed
    expect(cfg.timezone).toBe(SEED_CONFIG.timezone)
  })
})
