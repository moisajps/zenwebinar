import { redirect } from 'next/navigation'
import { getAulaAtivaMaisRecente } from '@/lib/aula-config'

export const dynamic = 'force-dynamic'

export default async function AulaIndexPage() {
  const aula = await getAulaAtivaMaisRecente()
  if (aula) redirect('/aula/' + aula.slug)

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center" style={{ background: '#0A0A0A' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <p className="relative z-10 font-sans text-sm text-white/40">Nenhuma aula publicada no momento.</p>
    </main>
  )
}
