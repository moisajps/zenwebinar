import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { computarEstadoAula } from '../lib'
import { getConfigBySlug, getRoteiro } from '@/lib/aula-config'
import type { EstadoAula } from '../config-types'
import { AulaContent } from '../AulaContent'
import { AulaGate } from '../AulaGate'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const cfg = await getConfigBySlug(slug)
  if (!cfg) return {}
  return {
    title: cfg.titulo,
    description: cfg.seoDescricao,
    openGraph: {
      title: cfg.titulo, description: cfg.seoDescricao, type: 'website', locale: 'pt_BR',
      siteName: cfg.branding.marca,
      images: [{ url: cfg.branding.ogImage, width: 1200, height: 675, alt: cfg.titulo }],
    },
    twitter: { card: 'summary_large_image', title: cfg.titulo, description: cfg.seoDescricao, images: [cfg.branding.ogImage] },
  }
}

export default async function AulaSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ simular?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams

  const config = await getConfigBySlug(slug)
  if (!config) notFound()

  const roteiro = await getRoteiro(config.id)

  const agora = new Date()
  const fimSimulado = new Date(agora.getTime() + config.duracaoMin * 60 * 1000)
  const em5min = new Date(agora.getTime() + 5 * 60 * 1000)
  const SIMULACOES: Record<string, EstadoAula> = {
    aguardando: { fase: 'aguardando', proximoInicio: em5min.toISOString(), isToday: true },
    ao_vivo:    { fase: 'ao_vivo', inicio: agora.toISOString(), fim: fimSimulado.toISOString() },
    replay:     { fase: 'replay', proximoInicio: '2099-01-01T23:00:00.000Z' },
  }
  const simulado = process.env.NODE_ENV !== 'production' && sp.simular ? SIMULACOES[sp.simular] : null
  const estadoInicial = simulado ?? computarEstadoAula(agora, config)
  const simulando = !!simulado

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col" style={{ background: '#0A0A0A' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <header className="relative z-10 py-3 px-6 border-b border-white/8 flex items-center justify-center">
        <span className="font-sans text-[10px] text-white/30 uppercase tracking-[3px]">
          {config.branding.marca} · {config.branding.areaLabel}
        </span>
      </header>
      <AulaGate areaLabel={`${config.branding.marca} · ${config.branding.areaLabel}`}>
        <AulaContent estadoInicial={estadoInicial} config={config} roteiro={roteiro} aulaId={config.id} simulando={simulando} />
      </AulaGate>
      <footer className="relative z-10 py-6 mt-auto text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-[3px]">{config.branding.marca} · Todos os direitos reservados</p>
      </footer>
    </main>
  )
}
