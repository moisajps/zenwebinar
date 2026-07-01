import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { supabaseAdmin } from '@/lib/supabase'
import { getConfigById } from '@/lib/aula-config'
import { SEED_CONFIG, SEED_ROTEIRO } from '@/content/config'

/** Gera slug a partir do nome: lowercase, remove acentos, substitui não-alfanuméricos por hífen. */
function slugify(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Verifica se slug já existe em aula_config. */
async function slugExists(slug: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('aula_config')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return !!data
}

/** Gera slug único: tenta o slug limpo, depois adiciona sufixo numérico curto. */
async function gerarSlugUnico(nome: string): Promise<string> {
  const base = slugify(nome) || 'aula'
  if (!(await slugExists(base))) return base
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`
    if (!(await slugExists(candidate))) return candidate
  }
  // Fallback: timestamp curto
  return `${base}-${Date.now().toString(36)}`
}

/**
 * POST /api/admin/aulas
 * Body: { nome: string; duplicarDe?: string }
 * Cria uma nova aula. Se duplicarDe, copia config + roteiro da aula-fonte.
 * Retorna { id, slug }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: auth.status })

  const body = await req.json()
  const nome: string = String(body.nome ?? '').trim()
  if (!nome) return NextResponse.json({ ok: false, erro: 'nome é obrigatório' }, { status: 400 })

  const duplicarDe: string | undefined = body.duplicarDe ? String(body.duplicarDe) : undefined

  const slug = await gerarSlugUnico(nome)

  let configRow: Record<string, unknown>

  if (duplicarDe) {
    const fonte = await getConfigById(duplicarDe)
    if (!fonte) {
      return NextResponse.json({ ok: false, erro: 'aula-fonte não encontrada' }, { status: 404 })
    }
    // Copia campos da config, exceto id / slug / nome
    configRow = {
      nome,
      slug,
      arquivada: false,
      titulo: fonte.titulo,
      seo_descricao: fonte.seoDescricao,
      youtube_video_id: fonte.youtubeVideoId,
      inicio_at: fonte.inicioAt,
      duracao_min: fonte.duracaoMin,
      recorrencia: fonte.recorrencia ?? null,
      timezone: fonte.timezone,
      replay_habilitado: fonte.replayHabilitado,
      pitch_segundos: fonte.pitchSegundos,
      chat_offset_segundos: fonte.chatOffsetSegundos,
      ao_vivo_fim_segundos: fonte.aoVivoFimSegundos,
      contador_piso: fonte.contadorPiso,
      contador_multiplicador: fonte.contadorMultiplicador,
      oferta: fonte.oferta ?? null,
      notificacoes: fonte.notificacoes ?? null,
      materiais: fonte.materiais ?? null,
      branding: fonte.branding,
    }
  } else {
    const s = SEED_CONFIG
    configRow = {
      nome,
      slug,
      arquivada: false,
      titulo: s.titulo,
      seo_descricao: s.seoDescricao,
      youtube_video_id: s.youtubeVideoId,
      inicio_at: s.inicioAt,
      duracao_min: s.duracaoMin,
      recorrencia: s.recorrencia ?? null,
      timezone: s.timezone,
      replay_habilitado: s.replayHabilitado,
      pitch_segundos: s.pitchSegundos,
      chat_offset_segundos: s.chatOffsetSegundos,
      ao_vivo_fim_segundos: s.aoVivoFimSegundos,
      contador_piso: s.contadorPiso,
      contador_multiplicador: s.contadorMultiplicador,
      oferta: s.oferta ?? null,
      notificacoes: s.notificacoes ?? null,
      materiais: s.materiais ?? null,
      branding: s.branding,
    }
  }

  const { data: novaAula, error: errConfig } = await supabaseAdmin
    .from('aula_config')
    .insert(configRow)
    .select('id')
    .single()

  if (errConfig || !novaAula) {
    return NextResponse.json({ ok: false, erro: errConfig?.message ?? 'Erro ao criar aula' }, { status: 500 })
  }

  const novoId: string = novaAula.id

  // Se duplicarDe, copia o roteiro da aula-fonte
  if (duplicarDe) {
    const { data: roteiroFonte } = await supabaseAdmin
      .from('aula_roteiro')
      .select('delay_segundos, nome, mensagem, ordem')
      .eq('aula_id', duplicarDe)
      .order('ordem', { ascending: true })

    if (roteiroFonte && roteiroFonte.length > 0) {
      const roteiroNovo = roteiroFonte.map((r) => ({
        aula_id: novoId,
        delay_segundos: r.delay_segundos,
        nome: r.nome,
        mensagem: r.mensagem,
        ordem: r.ordem,
      }))
      const { error: errRoteiro } = await supabaseAdmin.from('aula_roteiro').insert(roteiroNovo)
      if (errRoteiro) {
        return NextResponse.json({ ok: false, erro: errRoteiro.message }, { status: 500 })
      }
    }
  } else {
    // Insere roteiro seed
    const roteiroSeed = SEED_ROTEIRO.map((l, i) => ({
      aula_id: novoId,
      delay_segundos: l.delay,
      nome: l.name,
      mensagem: l.msg,
      ordem: i,
    }))
    const { error: errRoteiro } = await supabaseAdmin.from('aula_roteiro').insert(roteiroSeed)
    if (errRoteiro) {
      return NextResponse.json({ ok: false, erro: errRoteiro.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, id: novoId, slug })
}
