import { linkComUtm } from '@/app/aula/track'

describe('linkComUtm', () => {
  it('monta utm genérico webinar_ com aulaId', () => {
    const aulaId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    const u = new URL(linkComUtm('https://exemplo.com/checkout', aulaId, '2026-07-01', 'drawer'))
    expect(u.searchParams.get('utm_source')).toBe('webinar')
    expect(u.searchParams.get('utm_campaign')).toBe(`webinar_${aulaId}`)
    expect(u.searchParams.get('utm_content')).toBe('drawer')
    expect(u.searchParams.get('utm_term')).toBe('2026-07-01')
  })
  it('retorna o link original se inválido', () => {
    expect(linkComUtm('nao-e-url', 'some-id', '2026-07-01', 'card')).toBe('nao-e-url')
  })
})
