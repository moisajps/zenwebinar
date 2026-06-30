// Tracking de eventos do webinar (client-side).
// Dispara para /api/aula/evento. Falha sempre silenciosa — nunca bloqueia o usuário.

export function getAulaSessionId(): string {
  try {
    let id = localStorage.getItem('aula_session_id')
    if (!id) {
      id = (crypto?.randomUUID?.() ?? `s${Date.now()}${Math.floor(Math.random() * 1e6)}`)
      localStorage.setItem('aula_session_id', id)
    }
    return id
  } catch {
    return 'anon'
  }
}

export type AulaEvento = 'acesso' | 'heartbeat' | 'oferta_view' | 'cta_click'

export function trackAula(aulaDate: string, eventType: AulaEvento, metadata?: Record<string, unknown>) {
  try {
    fetch('/api/aula/evento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aula_date: aulaDate,
        session_id: getAulaSessionId(),
        event_type: eventType,
        metadata,
      }),
      keepalive: true,
    }).catch(() => {})
  } catch { /* noop */ }
}

// Monta o link da oferta com UTMs de atribuição.
// origem distingue de onde veio o clique: 'drawer' (pitch) ou 'card' (rodapé do chat)
export function linkComUtm(link: string, aulaDate: string, origem: 'drawer' | 'card'): string {
  try {
    const u = new URL(link)
    u.searchParams.set('utm_source', 'webinar')
    u.searchParams.set('utm_medium', 'aula_ao_vivo')
    u.searchParams.set('utm_campaign', `webinar_${aulaDate}`)
    u.searchParams.set('utm_content', origem)
    return u.toString()
  } catch {
    return link
  }
}
