import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { supabaseAdmin } from '@/lib/supabase'
import { parseRoteiro, normalizarLinhas } from '@/lib/roteiro-parse'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: auth.status })

  const body = await req.json()

  // aulaId é obrigatório — a tela de roteiro (DELETE-then-INSERT) sempre envia o id
  // da aula-alvo; sem ele, um fallback poderia apagar o roteiro da aula errada.
  const aulaId: string = String(body.aulaId ?? '').trim()
  if (!aulaId) {
    return NextResponse.json({ ok: false, erro: 'aulaId obrigatório' }, { status: 400 })
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
