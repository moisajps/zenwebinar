import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { parseRoteiro, normalizarLinhas } from '@/lib/roteiro-parse'

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const body = await req.json()
  let linhas
  try {
    linhas = Array.isArray(body?.linhas)
      ? normalizarLinhas(body.linhas)
      : parseRoteiro(String(body?.texto ?? ''))
  } catch (e) {
    return NextResponse.json({ ok: false, erro: (e as Error).message }, { status: 400 })
  }

  await supabaseAdmin.from('aula_roteiro').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (linhas.length > 0) {
    const rows = linhas.map((l, i) => ({ delay_segundos: l.delay, nome: l.name, mensagem: l.msg, ordem: i }))
    const { error } = await supabaseAdmin.from('aula_roteiro').insert(rows)
    if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, total: linhas.length })
}
