import { redirect } from 'next/navigation'

// Rota antiga (aula única) — substituída por /admin/aulas/[id]/mensagens.
// Redireciona para a lista de aulas.
export default function LegacyMensagemRedirect() {
  redirect('/admin')
}
