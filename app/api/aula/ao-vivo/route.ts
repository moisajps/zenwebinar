import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { aplicarPisoBoost } from '@/lib/contador'
import { getActiveConfig } from '@/lib/aula-config'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const JANELA_MS = 45_000

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get('data')
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return NextResponse.json({ real: 0, exibido: 0 }, { status: 400 })
  }
  const desde = new Date(Date.now() - JANELA_MS).toISOString()
  const { data: rows } = await supabaseAdmin
    .from('aula_eventos')
    .select('session_id, event_type, created_at')
    .eq('aula_date', data)
    .in('event_type', ['heartbeat', 'acesso'])
    .gte('created_at', desde)

  const real = new Set((rows ?? []).map(r => r.session_id as string)).size
  const cfg = await getActiveConfig()
  const exibido = aplicarPisoBoost(real, cfg.contadorPiso, cfg.contadorMultiplicador)
  return NextResponse.json({ real, exibido })
}
