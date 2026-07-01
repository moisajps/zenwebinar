import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAulaToken } from '../verificar/route'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const token = req.cookies.get('aula_token')?.value
  let session = token ? verifyAulaToken(token) : null

  // Bypass APENAS em dev local (next dev). Em produção e preview da Vercel
  // NODE_ENV é 'production', então este branch nunca roda lá.
  if (!session && process.env.NODE_ENV === 'development') {
    session = { email: 'teste@local.dev', nome: 'Teste' }
  }

  if (!session) {
    return NextResponse.json({ ok: false, erro: 'Sessão inválida. Recarregue a página.' }, { status: 401 })
  }

  let body: { message?: string; aula_date?: string; aula_id?: string }
  try { body = await req.json() } catch { body = {} }

  const message = body.message?.trim()
  const aulaDate = body.aula_date
  const aulaId = body.aula_id

  if (!message || message.length < 1 || message.length > 300) {
    return NextResponse.json({ ok: false, erro: 'Mensagem inválida.' }, { status: 400 })
  }
  if (!aulaDate || !/^\d{4}-\d{2}-\d{2}$/.test(aulaDate)) {
    return NextResponse.json({ ok: false, erro: 'Data inválida.' }, { status: 400 })
  }
  if (!aulaId || !UUID_RE.test(aulaId)) {
    return NextResponse.json({ ok: false, erro: 'aula_id inválido.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('aula_chat').insert({
    aula_id: aulaId,
    aula_date: aulaDate,
    user_name: session.nome ?? 'Participante', // nome vem do token assinado
    message,
  })

  if (error) {
    console.error('aula_chat insert error:', error)
    return NextResponse.json({ ok: false, erro: 'Erro ao enviar.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
