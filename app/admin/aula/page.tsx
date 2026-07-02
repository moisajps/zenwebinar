import { redirect } from 'next/navigation'

// Rota antiga (aula única) — substituída por /admin/aulas/[id]/config.
// Redireciona para a lista de aulas.
export default function LegacyAulaConfigRedirect() {
  redirect('/admin')
}
