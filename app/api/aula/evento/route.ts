import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAulaToken } from '../verificar/route'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const EVENTOS_VALIDOS = ['acesso', 'heartbeat', 'oferta_view', 'cta_click']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function inferDevice(ua: string | null): 'mobile' | 'desktop' {
  if (!ua) return 'desktop'
  return /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop'
}

export async function POST(req: NextRequest) {
  let body: { aula_id?: string; aula_date?: string; session_id?: string; event_type?: string; metadata?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }

  const { aula_id, aula_date, session_id, event_type } = body
  if (!aula_id || !UUID_RE.test(aula_id)) return NextResponse.json({ ok: false }, { status: 400 })
  if (!aula_date || !/^\d{4}-\d{2}-\d{2}$/.test(aula_date)) return NextResponse.json({ ok: false }, { status: 400 })
  if (!session_id || typeof session_id !== 'string') return NextResponse.json({ ok: false }, { status: 400 })
  if (!event_type || !EVENTOS_VALIDOS.includes(event_type)) return NextResponse.json({ ok: false }, { status: 400 })

  // Email vem do cookie assinado (se houver) — não confia no cliente
  const token = req.cookies.get('aula_token')?.value
  const session = token ? verifyAulaToken(token) : null

  const device = inferDevice(req.headers.get('user-agent'))
  const metaBase = (body.metadata as Record<string, unknown>) ?? {}
  const metadata = { ...metaBase, device }

  await supabaseAdmin.from('aula_eventos').insert({
    aula_id,
    aula_date,
    session_id,
    email: session?.email ?? null,
    event_type,
    metadata,
  })

  return NextResponse.json({ ok: true })
}
