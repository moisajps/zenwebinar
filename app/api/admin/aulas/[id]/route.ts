import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * PATCH /api/admin/aulas/[id]
 * Body: { arquivada: boolean }
 * Arquiva ou desarquiva uma aula pelo id.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ ok: false }, { status: auth.status })

  const { id } = await params
  if (!id) return NextResponse.json({ ok: false, erro: 'id é obrigatório' }, { status: 400 })

  const body = await req.json()
  if (typeof body.arquivada !== 'boolean') {
    return NextResponse.json({ ok: false, erro: 'arquivada (boolean) é obrigatório' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('aula_config')
    .update({ arquivada: body.arquivada })
    .eq('id', id)

  if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
