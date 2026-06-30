import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { getActiveConfig } from '@/lib/aula-config'

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const { message } = await req.json()
  const texto = String(message ?? '').trim()
  if (texto.length < 1 || texto.length > 300) return NextResponse.json({ ok: false, erro: 'Mensagem inválida' }, { status: 400 })

  const cfg = await getActiveConfig()
  const aulaDate = new Date().toLocaleDateString('sv-SE', { timeZone: cfg.timezone })
  const { error } = await supabaseAdmin.from('aula_chat').insert({
    aula_date: aulaDate, user_name: cfg.branding.teamName, message: texto, is_official: true,
  })
  if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
