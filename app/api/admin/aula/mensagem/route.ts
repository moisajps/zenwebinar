import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { supabaseAdmin } from '@/lib/supabase'
import { getConfigById } from '@/lib/aula-config'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: auth.status })

  const body = await req.json()
  const { message } = body
  const texto = String(message ?? '').trim()
  if (texto.length < 1 || texto.length > 300) {
    return NextResponse.json({ ok: false, erro: 'Mensagem inválida' }, { status: 400 })
  }

  // aulaId é obrigatório — a tela de mensagens envia o id da aula-alvo.
  const aulaId: string = String(body.aulaId ?? '').trim()
  if (!aulaId) {
    return NextResponse.json({ ok: false, erro: 'aulaId obrigatório' }, { status: 400 })
  }

  const cfg = await getConfigById(aulaId)
  if (!cfg) return NextResponse.json({ ok: false, erro: 'Aula não encontrada' }, { status: 404 })

  const aulaDate = new Date().toLocaleDateString('sv-SE', { timeZone: cfg.timezone })
  const { error } = await supabaseAdmin.from('aula_chat').insert({
    aula_id: aulaId,
    aula_date: aulaDate,
    user_name: cfg.branding.teamName,
    message: texto,
    is_official: true,
  })
  if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
