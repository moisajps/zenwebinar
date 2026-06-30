import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Cookie assinado com HMAC-SHA256 usando a service role key como secret.
// Payload: { email, nome, iat } — expira em 8h (duração generosa pra uma aula).
export function signAulaToken(email: string, nome: string | null): string {
  const payload = Buffer.from(JSON.stringify({ email, nome, iat: Date.now() })).toString('base64url')
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyAulaToken(token: string): { email: string; nome: string | null } | null {
  const dot = token.lastIndexOf('.')
  if (dot < 0) return null
  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const expected = createHmac('sha256', secret).update(payload).digest('base64url')
  if (sig !== expected) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { email: string; nome: string | null; iat: number }
    if (Date.now() - data.iat > 8 * 3600_000) return null // expirado
    return { email: data.email, nome: data.nome }
  } catch { return null }
}

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try { body = await req.json() } catch { body = {} }

  // Acesso é LIVRE — não validamos contra lista. O form só captura
  // nome + email para personalização/chat. Evita suporte por erro de digitação.
  const emailNorm = (body.email || '').trim().toLowerCase()
  const nome = ((body as { nome?: string }).nome || '').trim().split(/\s+/)[0] || null

  // Captura o lead (não sobrescreve nome existente da lista importada)
  if (emailNorm && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailNorm)) {
    try {
      await supabaseAdmin
        .from('aula_inscritos')
        .upsert({ email: emailNorm, first_name: nome }, { onConflict: 'email', ignoreDuplicates: true })
    } catch { /* captura best-effort */ }
  }

  const token = signAulaToken(emailNorm, nome)

  const res = NextResponse.json({ ok: true, nome })
  res.cookies.set('aula_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 3600, // 8h
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
