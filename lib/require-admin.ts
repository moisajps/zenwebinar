import { createSupabaseServer } from '@/lib/supabase-ssr'

// Allowlist de e-mails admin. Configurável via ADMIN_EMAILS (separados por vírgula).
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

// Valida que o request vem de um admin autenticado.
// Retorna { ok: true, email } ou { ok: false, status } (401 sem login, 403 sem permissão).
export async function requireAdmin(): Promise<
  { ok: true; email: string } | { ok: false; status: 401 | 403 }
> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401 }
  const email = (user.email || '').toLowerCase()
  // Se ADMIN_EMAILS não estiver configurado, qualquer usuário autenticado é admin
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) {
    return { ok: false, status: 403 }
  }
  return { ok: true, email }
}
