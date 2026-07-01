import { redirect } from 'next/navigation'
import { getAulaAtivaMaisRecente } from '@/lib/aula-config'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const aula = await getAulaAtivaMaisRecente()
  if (aula) redirect('/aula/' + aula.slug)
  redirect('/aula')
}
