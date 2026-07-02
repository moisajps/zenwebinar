import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aplicarPisoBoost } from '@/lib/contador'
import { getConfigById } from '@/lib/aula-config'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const JANELA_MS = 45_000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: NextRequest) {
  // A contagem ao vivo é por aula (aula_id). O antigo `data` continua aceito por
  // compatibilidade com a página pública, mas não é mais exigido nem usado na query.
  const aulaId = req.nextUrl.searchParams.get('aula_id')

  if (!aulaId || !UUID_RE.test(aulaId)) {
    return NextResponse.json({ real: 0, exibido: 0 }, { status: 400 })
  }

  const desde = new Date(Date.now() - JANELA_MS).toISOString()
  const { data: rows } = await supabaseAdmin
    .from('aula_eventos')
    .select('session_id, event_type, created_at')
    .eq('aula_id', aulaId)
    .in('event_type', ['heartbeat', 'acesso'])
    .gte('created_at', desde)

  const real = new Set((rows ?? []).map(r => r.session_id as string)).size
  const cfg = await getConfigById(aulaId)
  const piso = cfg?.contadorPiso ?? 0
  const multiplicador = cfg?.contadorMultiplicador ?? 1
  const exibido = aplicarPisoBoost(real, piso, multiplicador)
  return NextResponse.json({ real, exibido })
}
