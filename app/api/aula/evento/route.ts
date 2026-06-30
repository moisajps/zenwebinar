import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAulaToken } from '../verificar/route'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const EVENTOS_VALIDOS = ['acesso', 'heartbeat', 'oferta_view', 'cta_click']

export async function POST(req: NextRequest) {
  let body: { aula_date?: string; session_id?: string; event_type?: string; metadata?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }

  const { aula_date, session_id, event_type } = body
  if (!aula_date || !/^\d{4}-\d{2}-\d{2}$/.test(aula_date)) return NextResponse.json({ ok: false }, { status: 400 })
  if (!session_id || typeof session_id !== 'string') return NextResponse.json({ ok: false }, { status: 400 })
  if (!event_type || !EVENTOS_VALIDOS.includes(event_type)) return NextResponse.json({ ok: false }, { status: 400 })

  // Email vem do cookie assinado (se houver) — não confia no cliente
  const token = req.cookies.get('aula_token')?.value
  const session = token ? verifyAulaToken(token) : null

  await supabaseAdmin.from('aula_eventos').insert({
    aula_date,
    session_id,
    email: session?.email ?? null,
    event_type,
    metadata: (body.metadata as Record<string, unknown>) ?? null,
  })

  return NextResponse.json({ ok: true })
}
