import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { supabaseAdmin } from '@/lib/supabase'
import { parseRoteiro, normalizarLinhas } from '@/lib/roteiro-parse'
import { getAulaAtivaMaisRecente } from '@/lib/aula-config'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: auth.status })

  const body = await req.json()

  // aulaId fallback: se não vier no body, usa a aula mais recente (compatibilidade com telas ainda não migradas)
  let aulaId: string = String(body.aulaId ?? '').trim()
  if (!aulaId) {
    const recente = await getAulaAtivaMaisRecente()
    if (!recente) return NextResponse.json({ ok: false, erro: 'Nenhuma aula encontrada' }, { status: 404 })
    aulaId = recente.id
  }

  let linhas
  try {
    linhas = Array.isArray(body?.linhas)
      ? normalizarLinhas(body.linhas)
      : parseRoteiro(String(body?.texto ?? ''))
  } catch (e) {
    return NextResponse.json({ ok: false, erro: (e as Error).message }, { status: 400 })
  }

  // Delete scoped por aula_id — nunca deleta roteiros de outras aulas
  await supabaseAdmin.from('aula_roteiro').delete().eq('aula_id', aulaId)

  if (linhas.length > 0) {
    const rows = linhas.map((l, i) => ({
      aula_id: aulaId,
      delay_segundos: l.delay,
      nome: l.name,
      mensagem: l.msg,
      ordem: i,
    }))
    const { error } = await supabaseAdmin.from('aula_roteiro').insert(rows)
    if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true, total: linhas.length })
}
