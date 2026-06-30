import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-ssr'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const sb = await createSupabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const b = await req.json()
  const row = {
    ativa: true,
    updated_at: new Date().toISOString(),
    titulo: String(b.titulo ?? 'Aula ao vivo'),
    seo_descricao: String(b.seoDescricao ?? ''),
    youtube_video_id: String(b.youtubeVideoId ?? ''),
    inicio_at: b.inicioAt ?? null,
    duracao_min: Number(b.duracaoMin ?? 100),
    recorrencia: b.recorrencia ?? null,
    timezone: String(b.timezone ?? 'America/Sao_Paulo'),
    replay_habilitado: !!b.replayHabilitado,
    pitch_segundos: Number(b.pitchSegundos ?? 1800),
    chat_offset_segundos: Number(b.chatOffsetSegundos ?? 0),
    ao_vivo_fim_segundos: Number(b.aoVivoFimSegundos ?? 6000),
    contador_piso: Number(b.contadorPiso ?? 0),
    contador_multiplicador: Number(b.contadorMultiplicador ?? 1),
    oferta: b.oferta ?? null,
    notificacoes: b.notificacoes ?? null,
    materiais: b.materiais ?? null,
    branding: b.branding ?? { marca: 'Webinar', areaLabel: 'Área do Aluno', teamName: 'Equipe', ogImage: '/og-aula.jpg' },
  }
  // Garante 1 ativa: atualiza a existente ou insere.
  const { data: existing } = await supabaseAdmin.from('aula_config').select('id').eq('ativa', true).maybeSingle()
  const q = existing
    ? supabaseAdmin.from('aula_config').update(row).eq('id', existing.id)
    : supabaseAdmin.from('aula_config').insert(row)
  const { error } = await q
  if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
