import { redirect } from 'next/navigation'

// Rota antiga (aula única) — substituída por /admin/aulas/[id]/roteiro.
// Redireciona para a lista de aulas.
export default function LegacyRoteiroRedirect() {
  redirect('/admin')
}
