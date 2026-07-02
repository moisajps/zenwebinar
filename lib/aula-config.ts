import 'server-only'
import { supabaseAdmin } from '@/lib/supabase'
import { SEED_CONFIG, SEED_ROTEIRO } from '@/content/config'
import type { AulaConfig } from '@/app/aula/config-types'

type Row = Record<string, unknown>
const pick = <T,>(v: unknown, fallback: T): T => (v === null || v === undefined ? fallback : (v as T))

export function rowToConfig(row: Row | null): AulaConfig {
  if (!row) return SEED_CONFIG
  const s = SEED_CONFIG
  return {
    id:     pick(row.id as string | null, s.id),
    slug:   pick(row.slug as string | null, s.slug),
    nome:   pick(row.nome as string | null, s.nome),
    titulo: pick(row.titulo, s.titulo),
    seoDescricao: pick(row.seo_descricao, s.seoDescricao),
    youtubeVideoId: pick(row.youtube_video_id, s.youtubeVideoId),
    inicioAt: pick(row.inicio_at as string | null, s.inicioAt),
    duracaoMin: pick(row.duracao_min, s.duracaoMin),
    recorrencia: pick(row.recorrencia as AulaConfig['recorrencia'], s.recorrencia),
    timezone: pick(row.timezone, s.timezone),
    replayHabilitado: pick(row.replay_habilitado, s.replayHabilitado),
    pitchSegundos: pick(row.pitch_segundos, s.pitchSegundos),
    chatOffsetSegundos: pick(row.chat_offset_segundos, s.chatOffsetSegundos),
    aoVivoFimSegundos: pick(row.ao_vivo_fim_segundos, s.aoVivoFimSegundos),
    contadorPiso: pick(row.contador_piso, s.contadorPiso),
    contadorMultiplicador: Number(pick(row.contador_multiplicador, s.contadorMultiplicador)),
    oferta: pick(row.oferta as AulaConfig['oferta'], s.oferta),
    notificacoes: pick(row.notificacoes as AulaConfig['notificacoes'], s.notificacoes),
    materiais: pick(row.materiais as AulaConfig['materiais'], s.materiais),
    branding: pick(row.branding as AulaConfig['branding'], s.branding),
  }
}

export async function getConfigBySlug(slug: string): Promise<AulaConfig | null> {
  const { data } = await supabaseAdmin.from('aula_config').select('*').eq('slug', slug).eq('arquivada', false).maybeSingle()
  return data ? rowToConfig(data) : null
}

export async function getConfigById(id: string): Promise<AulaConfig | null> {
  const { data } = await supabaseAdmin.from('aula_config').select('*').eq('id', id).maybeSingle()
  return data ? rowToConfig(data) : null
}

export async function getAulaAtivaMaisRecente(): Promise<AulaConfig | null> {
  const { data } = await supabaseAdmin.from('aula_config').select('*').eq('arquivada', false).order('inicio_at', { ascending: false, nullsFirst: false }).limit(1).maybeSingle()
  return data ? rowToConfig(data) : null
}

export async function listAulas(): Promise<{ id: string; slug: string; nome: string; titulo: string; inicioAt: string | null; recorrencia: AulaConfig['recorrencia']; duracaoMin: number; timezone: string; replayHabilitado: boolean }[]> {
  const { data } = await supabaseAdmin.from('aula_config').select('id,slug,nome,titulo,inicio_at,recorrencia,duracao_min,timezone,replay_habilitado').eq('arquivada', false).order('inicio_at', { ascending: false, nullsFirst: false })
  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    nome: r.nome,
    titulo: r.titulo,
    inicioAt: r.inicio_at,
    recorrencia: r.recorrencia,
    duracaoMin: r.duracao_min,
    timezone: r.timezone,
    replayHabilitado: r.replay_habilitado,
  }))
}

export async function getRoteiro(aulaId: string): Promise<{ delay: number; name: string; msg: string }[]> {
  const { data } = await supabaseAdmin
    .from('aula_roteiro')
    .select('delay_segundos, nome, mensagem, ordem')
    .eq('aula_id', aulaId)
    .order('delay_segundos', { ascending: true })
    .order('ordem', { ascending: true })
  if (!data || data.length === 0) return SEED_ROTEIRO
  return data.map(r => ({ delay: r.delay_segundos as number, name: r.nome as string, msg: r.mensagem as string }))
}
