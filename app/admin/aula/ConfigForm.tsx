'use client'
import { useState } from 'react'
import type { AulaConfig, Oferta, NotificacoesCompra, Branding } from '@/app/aula/config-types'

// ---------------------------------------------------------------------------
// Helpers para converter inicioAt entre ISO UTC e datetime-local (YYYY-MM-DDTHH:MM)
// ---------------------------------------------------------------------------
function isoToLocal(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localToIso(local: string): string | null {
  if (!local) return null
  return new Date(local).toISOString()
}

// ---------------------------------------------------------------------------
// Defaults para sub-objetos que podem ser undefined
// ---------------------------------------------------------------------------
const defaultOferta: Oferta = {
  ativo: false,
  pitchSegundos: 1800,
  patrocinado: '',
  bannerImagem: '',
  marcaLogo: '',
  marcaTitulo: '',
  marca: '',
  descricao: '',
  cta: '',
  link: '',
  cardChamada: '',
  cardPreco: '',
}

const defaultNotificacoes: NotificacoesCompra = {
  ativo: false,
  inicioAposPitchSegundos: 60,
  intervaloMinSegundos: 30,
  intervaloMaxSegundos: 120,
  total: 10,
  produtoLabel: '',
}

const defaultBranding: Branding = {
  marca: 'Webinar',
  areaLabel: 'Área do Aluno',
  teamName: 'Equipe',
  ogImage: '/og-aula.jpg',
}

// ---------------------------------------------------------------------------
// Styled primitives
// ---------------------------------------------------------------------------
const inputCls = 'bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white w-full focus:outline-none focus:border-amber-500/60'
const labelCls = 'flex flex-col gap-1'
const spanCls = 'text-sm text-white/60'
const sectionCls = 'flex flex-col gap-4 border border-white/10 rounded-xl p-4'
const sectionTitleCls = 'text-sm font-semibold text-amber-400 uppercase tracking-wider'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ConfigForm({ inicial }: { inicial: AulaConfig }) {
  const [cfg, setCfg] = useState<AulaConfig>({
    ...inicial,
    oferta: inicial.oferta ?? defaultOferta,
    notificacoes: inicial.notificacoes ?? defaultNotificacoes,
    branding: inicial.branding ?? defaultBranding,
  })
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  const salvar = async () => {
    setSalvando(true)
    setMsg('')
    const r = await fetch('/api/admin/aula/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    })
    setSalvando(false)
    setMsg(r.ok ? 'Salvo!' : 'Erro ao salvar')
  }

  const set = <K extends keyof AulaConfig>(k: K, v: AulaConfig[K]) =>
    setCfg(c => ({ ...c, [k]: v }))

  const setOferta = (k: keyof Oferta, v: Oferta[keyof Oferta]) =>
    setCfg(c => ({ ...c, oferta: { ...(c.oferta ?? defaultOferta), [k]: v } }))

  const setNotif = (k: keyof NotificacoesCompra, v: NotificacoesCompra[keyof NotificacoesCompra]) =>
    setCfg(c => ({ ...c, notificacoes: { ...(c.notificacoes ?? defaultNotificacoes), [k]: v } }))

  const setBranding = (k: keyof Branding, v: Branding[keyof Branding]) =>
    setCfg(c => ({ ...c, branding: { ...(c.branding ?? defaultBranding), [k]: v } }))

  const oferta = cfg.oferta ?? defaultOferta
  const notif = cfg.notificacoes ?? defaultNotificacoes
  const branding = cfg.branding ?? defaultBranding

  return (
    <div className="flex flex-col gap-6 text-white">

      {/* ------------------------------------------------------------------ */}
      {/* Bloco: Aula */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Aula</p>

        <label className={labelCls}>
          <span className={spanCls}>Título da aula</span>
          <input className={inputCls} value={cfg.titulo}
            onChange={e => set('titulo', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Descrição SEO</span>
          <input className={inputCls} value={cfg.seoDescricao}
            onChange={e => set('seoDescricao', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>YouTube Video ID</span>
          <input className={inputCls} value={cfg.youtubeVideoId}
            onChange={e => set('youtubeVideoId', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Início da aula (horário local)</span>
          <input className={inputCls} type="datetime-local"
            value={isoToLocal(cfg.inicioAt)}
            onChange={e => set('inicioAt', localToIso(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Duração (minutos)</span>
          <input className={inputCls} type="number" min={1}
            value={cfg.duracaoMin}
            onChange={e => set('duracaoMin', Number(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Timezone</span>
          <input className={inputCls} value={cfg.timezone}
            onChange={e => set('timezone', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Pitch (segundos)</span>
          <input className={inputCls} type="number" min={0}
            value={cfg.pitchSegundos}
            onChange={e => set('pitchSegundos', Number(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Chat offset (segundos)</span>
          <input className={inputCls} type="number" min={0}
            value={cfg.chatOffsetSegundos}
            onChange={e => set('chatOffsetSegundos', Number(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Fim ao vivo (segundos)</span>
          <input className={inputCls} type="number" min={0}
            value={cfg.aoVivoFimSegundos}
            onChange={e => set('aoVivoFimSegundos', Number(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Contador piso</span>
          <input className={inputCls} type="number" min={0}
            value={cfg.contadorPiso}
            onChange={e => set('contadorPiso', Number(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Contador multiplicador</span>
          <input className={inputCls} type="number" min={0} step={0.01}
            value={cfg.contadorMultiplicador}
            onChange={e => set('contadorMultiplicador', Number(e.target.value))} />
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox"
            className="w-4 h-4 accent-amber-500"
            checked={cfg.replayHabilitado}
            onChange={e => set('replayHabilitado', e.target.checked)} />
          <span className="text-sm text-white/80">Replay habilitado</span>
        </label>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bloco: Recorrência */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Recorrência semanal</p>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox"
            className="w-4 h-4 accent-amber-500"
            checked={cfg.recorrencia !== null}
            onChange={e => set('recorrencia', e.target.checked
              ? { weekday: cfg.recorrencia?.weekday ?? 1, fromDate: cfg.recorrencia?.fromDate ?? '' }
              : null
            )} />
          <span className="text-sm text-white/80">Habilitar recorrência semanal</span>
        </label>

        {cfg.recorrencia !== null && (
          <>
            <label className={labelCls}>
              <span className={spanCls}>Dia da semana (0 = dom, 1 = seg, … 6 = sáb)</span>
              <input className={inputCls} type="number" min={0} max={6}
                value={cfg.recorrencia?.weekday ?? 1}
                onChange={e => set('recorrencia', {
                  weekday: Number(e.target.value),
                  fromDate: cfg.recorrencia?.fromDate ?? '',
                })} />
            </label>

            <label className={labelCls}>
              <span className={spanCls}>A partir de (data, YYYY-MM-DD)</span>
              <input className={inputCls} type="date"
                value={cfg.recorrencia?.fromDate ?? ''}
                onChange={e => set('recorrencia', {
                  weekday: cfg.recorrencia?.weekday ?? 1,
                  fromDate: e.target.value,
                })} />
            </label>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bloco: Oferta */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Oferta</p>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox"
            className="w-4 h-4 accent-amber-500"
            checked={oferta.ativo}
            onChange={e => setOferta('ativo', e.target.checked)} />
          <span className="text-sm text-white/80">Oferta ativa</span>
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Pitch da oferta (segundos)</span>
          <input className={inputCls} type="number" min={0}
            value={oferta.pitchSegundos}
            onChange={e => setOferta('pitchSegundos', Number(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Patrocinado (texto)</span>
          <input className={inputCls} value={oferta.patrocinado}
            onChange={e => setOferta('patrocinado', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Banner imagem (URL)</span>
          <input className={inputCls} value={oferta.bannerImagem}
            onChange={e => setOferta('bannerImagem', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Marca logo (URL)</span>
          <input className={inputCls} value={oferta.marcaLogo}
            onChange={e => setOferta('marcaLogo', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Marca título</span>
          <input className={inputCls} value={oferta.marcaTitulo}
            onChange={e => setOferta('marcaTitulo', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Marca</span>
          <input className={inputCls} value={oferta.marca}
            onChange={e => setOferta('marca', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Descrição</span>
          <textarea className={inputCls + ' resize-none'} rows={3} value={oferta.descricao}
            onChange={e => setOferta('descricao', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>CTA (texto do botão)</span>
          <input className={inputCls} value={oferta.cta}
            onChange={e => setOferta('cta', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Link da oferta</span>
          <input className={inputCls} value={oferta.link}
            onChange={e => setOferta('link', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Card chamada</span>
          <input className={inputCls} value={oferta.cardChamada}
            onChange={e => setOferta('cardChamada', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Card preço</span>
          <input className={inputCls} value={oferta.cardPreco}
            onChange={e => setOferta('cardPreco', e.target.value)} />
        </label>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bloco: Notificações de compra */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Notificações de compra</p>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox"
            className="w-4 h-4 accent-amber-500"
            checked={notif.ativo}
            onChange={e => setNotif('ativo', e.target.checked)} />
          <span className="text-sm text-white/80">Notificações ativas</span>
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Início após pitch (segundos)</span>
          <input className={inputCls} type="number" min={0}
            value={notif.inicioAposPitchSegundos}
            onChange={e => setNotif('inicioAposPitchSegundos', Number(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Intervalo mínimo (segundos)</span>
          <input className={inputCls} type="number" min={0}
            value={notif.intervaloMinSegundos}
            onChange={e => setNotif('intervaloMinSegundos', Number(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Intervalo máximo (segundos)</span>
          <input className={inputCls} type="number" min={0}
            value={notif.intervaloMaxSegundos}
            onChange={e => setNotif('intervaloMaxSegundos', Number(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Total de notificações</span>
          <input className={inputCls} type="number" min={0}
            value={notif.total}
            onChange={e => setNotif('total', Number(e.target.value))} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Label do produto</span>
          <input className={inputCls} value={notif.produtoLabel}
            onChange={e => setNotif('produtoLabel', e.target.value)} />
        </label>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bloco: Branding */}
      {/* ------------------------------------------------------------------ */}
      <div className={sectionCls}>
        <p className={sectionTitleCls}>Branding</p>

        <label className={labelCls}>
          <span className={spanCls}>Marca (nome exibido)</span>
          <input className={inputCls} value={branding.marca}
            onChange={e => setBranding('marca', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Label da área do aluno</span>
          <input className={inputCls} value={branding.areaLabel}
            onChange={e => setBranding('areaLabel', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Nome da equipe</span>
          <input className={inputCls} value={branding.teamName}
            onChange={e => setBranding('teamName', e.target.value)} />
        </label>

        <label className={labelCls}>
          <span className={spanCls}>Imagem OG (caminho)</span>
          <input className={inputCls} value={branding.ogImage}
            onChange={e => setBranding('ogImage', e.target.value)} />
        </label>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Save */}
      {/* ------------------------------------------------------------------ */}
      <button
        onClick={salvar}
        disabled={salvando}
        className="bg-amber-500 text-black font-bold rounded-full py-3 mt-2 disabled:opacity-50 hover:bg-amber-400 transition-colors"
      >
        {salvando ? 'Salvando...' : 'Salvar configuração'}
      </button>

      {msg && (
        <p className={`text-sm ${msg === 'Salvo!' ? 'text-green-400' : 'text-red-400'}`}>
          {msg}
        </p>
      )}
    </div>
  )
}
