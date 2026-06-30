import { linkComUtm } from '@/app/aula/track'

describe('linkComUtm', () => {
  it('monta utm genérico webinar_', () => {
    const u = new URL(linkComUtm('https://exemplo.com/checkout', '2026-07-01', 'drawer'))
    expect(u.searchParams.get('utm_source')).toBe('webinar')
    expect(u.searchParams.get('utm_campaign')).toBe('webinar_2026-07-01')
    expect(u.searchParams.get('utm_content')).toBe('drawer')
  })
  it('retorna o link original se inválido', () => {
    expect(linkComUtm('nao-e-url', '2026-07-01', 'card')).toBe('nao-e-url')
  })
})
