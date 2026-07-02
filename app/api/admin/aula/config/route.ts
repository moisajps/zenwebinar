import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: auth.status })

  const b = await req.json()

  // aulaId é obrigatório — toda tela admin envia o id da aula-alvo.
  const aulaId: string = String(b.aulaId ?? '').trim()
  if (!aulaId) {
    return NextResponse.json({ ok: false, erro: 'aulaId obrigatório' }, { status: 400 })
  }

  // Monta apenas os campos presentes no body. slug/nome não são tocados aqui.
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (b.titulo !== undefined)              row.titulo                 = String(b.titulo)
  if (b.seoDescricao !== undefined)        row.seo_descricao          = String(b.seoDescricao)
  if (b.youtubeVideoId !== undefined)      row.youtube_video_id       = String(b.youtubeVideoId)
  if (b.inicioAt !== undefined)            row.inicio_at              = b.inicioAt ?? null
  if (b.duracaoMin !== undefined)          row.duracao_min            = Number(b.duracaoMin)
  if (b.recorrencia !== undefined)         row.recorrencia            = b.recorrencia ?? null
  if (b.timezone !== undefined)            row.timezone               = String(b.timezone)
  if (b.replayHabilitado !== undefined)    row.replay_habilitado      = !!b.replayHabilitado
  if (b.pitchSegundos !== undefined)       row.pitch_segundos         = Number(b.pitchSegundos)
  if (b.chatOffsetSegundos !== undefined)  row.chat_offset_segundos   = Number(b.chatOffsetSegundos)
  if (b.aoVivoFimSegundos !== undefined)   row.ao_vivo_fim_segundos   = Number(b.aoVivoFimSegundos)
  if (b.contadorPiso !== undefined)        row.contador_piso          = Number(b.contadorPiso)
  if (b.contadorMultiplicador !== undefined) row.contador_multiplicador = Number(b.contadorMultiplicador)
  if (b.oferta !== undefined)              row.oferta                 = b.oferta ?? null
  if (b.notificacoes !== undefined)        row.notificacoes           = b.notificacoes ?? null
  if (b.materiais !== undefined)           row.materiais              = b.materiais ?? null
  if (b.branding !== undefined)            row.branding               = b.branding

  const { error } = await supabaseAdmin.from('aula_config').update(row).eq('id', aulaId)
  if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
