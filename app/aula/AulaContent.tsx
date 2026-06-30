// app/aula/AulaContent.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { computarEstadoAula } from './lib'
import { type AulaConfig, type EstadoAula } from './config-types'
import { LiveChatFull, type RoteiroItem } from './LiveElements'
import { OfferCard } from './Offer'
import { MateriaisButton } from './Materiais'
import { PurchaseNotifications } from './Notificacoes'
import { trackAula } from './track'
import { useAulaSession } from './AulaGate'

// ── YouTube IFrame API: player travado ──────────────────────────────────────
// Usa a API oficial pra controlar o vídeo por código e cobrir o player inteiro
// com um "escudo" transparente. Assim NINGUÉM clica na logo / título / "assistir
// no YouTube" e sai da página. Os controles (tocar / som / tela cheia) são nossos.
type YTPlayer = {
  playVideo: () => void
  pauseVideo: () => void
  mute: () => void
  unMute: () => void
  setVolume: (v: number) => void
  isMuted: () => boolean
  getPlayerState: () => number
  destroy: () => void
}
declare global {
  interface Window {
    YT?: {
      Player: new (el: Element | string, opts: Record<string, unknown>) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let ytApiPromise: Promise<void> | null = null
function loadYTApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise<void>((resolve) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve() }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(s)
  })
  return ytApiPromise
}

function YouTubePlayer({ videoId, autoplay = false }: { videoId: string; autoplay?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [ready, setReady] = useState(false)
  const [isFs, setIsFs] = useState(false)

  useEffect(() => {
    let cancelled = false
    let mountEl: HTMLDivElement | null = null
    loadYTApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return
      // YT substitui o nó passado por um <iframe>. Usamos um nó descartável
      // dentro do host pra o React nunca brigar com a manipulação do YT.
      mountEl = document.createElement('div')
      mountEl.style.width = '100%'
      mountEl.style.height = '100%'
      hostRef.current.appendChild(mountEl)
      playerRef.current = new window.YT.Player(mountEl, {
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 0,          // sem barra de controles do YouTube
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          disablekb: 1,         // sem atalhos de teclado
          fs: 0,                // sem botão de fullscreen do YouTube (usamos o nosso)
          mute: 1,              // começa mudo p/ o autoplay funcionar no mobile
          origin: window.location.origin,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (cancelled) return
            setReady(true)
            if (autoplay) e.target.playVideo()
          },
          onStateChange: (e: { data: number; target: YTPlayer }) => {
            const YTS = window.YT?.PlayerState
            if (!YTS) return
            setPlaying(e.data === YTS.PLAYING)
            try { setMuted(e.target.isMuted()) } catch { /* ignore */ }
          },
        },
      })
    })
    return () => {
      cancelled = true
      try { playerRef.current?.destroy() } catch { /* ignore */ }
      playerRef.current = null
      if (mountEl?.parentNode) mountEl.parentNode.removeChild(mountEl)
    }
  }, [videoId, autoplay])

  // Sincroniza o estado do botão de tela cheia
  useEffect(() => {
    const onFs = () => setIsFs(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  // Toque no vídeo: 1º toque tira do mudo (ou dá play); depois alterna play/pause
  const onTap = () => {
    const p = playerRef.current
    if (!p) return
    const YTS = window.YT?.PlayerState
    let state = -1
    try { state = p.getPlayerState() } catch { /* ignore */ }
    if (YTS && state !== YTS.PLAYING) { p.playVideo(); return }
    if (muted) { p.unMute(); p.setVolume(100); setMuted(false); return }
    p.pauseVideo()
  }

  const toggleFs = (e: React.MouseEvent) => {
    e.stopPropagation()
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else el.requestFullscreen?.()
  }

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ background: '#000' }}>
      {/* Host onde o iframe do YouTube é injetado */}
      <div ref={hostRef} className="absolute inset-0 w-full h-full" />

      {/* Escudo: cobre o player inteiro e captura TODOS os cliques (impede sair pro YouTube) */}
      <button
        type="button"
        onClick={onTap}
        aria-label="Vídeo da aula"
        className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer"
        style={{ background: 'transparent', border: 'none', padding: 0 }}
      >
        {ready && !playing && (
          <span className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.65)' }}>
            ▶ Assistir aula
          </span>
        )}
        {ready && playing && muted && (
          <span className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold text-white animate-pulse" style={{ background: 'rgba(0,0,0,0.65)' }}>
            🔊 Toque para ativar o som
          </span>
        )}
      </button>

      {/* Botão de tela cheia (nosso) */}
      <button
        type="button"
        onClick={toggleFs}
        aria-label={isFs ? 'Sair da tela cheia' : 'Tela cheia'}
        className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-md flex items-center justify-center text-white active:scale-90 transition-transform"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      >
        {isFs ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
        )}
      </button>
    </div>
  )
}

interface Props {
  estadoInicial: EstadoAula
  config: AulaConfig
  roteiro: RoteiroItem[]
  simulando?: boolean
}

export function AulaContent({ estadoInicial, config, roteiro, simulando = false }: Props) {
  const [estado, setEstado] = useState<EstadoAula>(estadoInicial)
  const [agora, setAgora] = useState<Date>(() => new Date())

  // Tick de 1s: atualiza "agora" pra countdown e detecta transição de fase.
  // Em modo simulação, não sobrescreve o estado para manter a fase forçada.
  useEffect(() => {
    const tick = setInterval(() => {
      const novoAgora = new Date()
      setAgora(novoAgora)
      if (!simulando) {
        const novoEstado = computarEstadoAula(novoAgora, config)
        if (novoEstado.fase !== estado.fase) setEstado(novoEstado)
      }
    }, 1000)
    return () => clearInterval(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- config is stable from server; adding it would cause needless re-subscriptions
  }, [estado.fase, simulando])

  if (estado.fase === 'aguardando') return <FaseAguardando estado={estado} agora={agora} config={config} />
  if (estado.fase === 'ao_vivo')    return <FaseAoVivo config={config} startedAt={estado.inicio} roteiro={roteiro} />
  if (!config.replayHabilitado)     return <FaseEncerrada estado={estado} agora={agora} />
  return <FaseReplay config={config} />
}

// ─────────────────────────────────────────────────────────────
// Fase: AGUARDANDO — mobile-first, vídeo full-width no topo
// ─────────────────────────────────────────────────────────────

function FaseAguardando({ estado, agora, config }: { estado: Extract<EstadoAula, { fase: 'aguardando' }>; agora: Date; config: AulaConfig }) {
  const session = useAulaSession()
  const primeiroNome = session?.nome?.trim() || null
  const diffMs = new Date(estado.proximoInicio).getTime() - agora.getTime()
  const { h, m, s } = msToHMS(diffMs)

  // Faltando ≤ 6min: modo "já vamos começar". Caso contrário, espera normal.
  const totalMin = Math.floor(diffMs / 60000)
  const quaseLa = totalMin < 6

  const horaFmt = new Intl.DateTimeFormat('pt-BR', {
    timeZone: config.timezone, hour: '2-digit', minute: '2-digit',
  }).format(new Date(estado.proximoInicio))

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 gap-7 py-10">
      <h1 className="font-display text-3xl md:text-4xl text-white leading-tight max-w-md">
        {primeiroNome
          ? (quaseLa ? `${primeiroNome}, já vamos começar!` : `${primeiroNome}, sua aula é às ${horaFmt}`)
          : (quaseLa ? 'Já vamos começar!' : 'Sua aula está chegando')}
      </h1>

      <div className="flex flex-col items-center gap-1.5">
        <span className="font-sans text-[11px] text-white/30 uppercase tracking-[3px]">
          {quaseLa ? 'Começa em' : 'Faltam'}
        </span>
        <div className="font-sans text-6xl font-bold text-white tabular-nums tracking-tight">
          {h > 0 ? `${pad(h)}:` : ''}{pad(m)}:{pad(s)}
        </div>
      </div>

      <p className="font-sans text-sm text-white/40 max-w-xs leading-relaxed">
        Fique nesta tela — a aula começa automaticamente. Já deixe seu caderno e caneta à mão. 📝
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Fase: ENCERRADA — aula acabou, replay não liberado ainda
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function FaseEncerrada(_props: { estado: Extract<EstadoAula, { fase: 'replay' }>; agora: Date }) {
  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 gap-6">
      <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/40 text-[10px] font-sans font-semibold uppercase tracking-[3px] px-4 py-1.5 rounded-full">
        Aula encerrada
      </span>

      <div className="flex flex-col items-center gap-3 max-w-xs">
        <h1 className="font-display text-2xl text-white leading-snug">
          A aula de hoje foi encerrada.
        </h1>
        <p className="font-sans text-sm text-white/50 leading-relaxed">
          Assim que disponibilizarmos o replay, você será avisada.
        </p>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Fase: AO VIVO — layout YouTube (fixed full-screen)
// ─────────────────────────────────────────────────────────────

function FaseAoVivo({ config, startedAt, roteiro }: { config: AulaConfig; startedAt: string; roteiro: RoteiroItem[] }) {
  const aulaDate = new Date(startedAt).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

  // Tracking: acesso (1x) + heartbeat (a cada 30s) — base de retenção e simultâneos
  useEffect(() => {
    trackAula(aulaDate, 'acesso')
    const hb = setInterval(() => trackAula(aulaDate, 'heartbeat'), 60_000)  // 60s reduz inserts na live
    return () => clearInterval(hb)
  }, [aulaDate])

  // Quando o vídeo termina, troca o badge p/ "Encerrado" (mantém tudo ativo)
  const fimSeg = config.aoVivoFimSegundos ?? Infinity
  const [encerrado, setEncerrado] = useState(false)
  useEffect(() => {
    const start = new Date(startedAt).getTime()
    const check = () => setEncerrado((Date.now() - start) / 1000 >= fimSeg)
    check()
    const id = setInterval(check, 10_000)
    return () => clearInterval(id)
  }, [startedAt, fimSeg])

  // Badge: AO VIVO (vermelho pulsando) → ENCERRADO (cinza) quando o vídeo acaba
  const liveBadge = encerrado ? (
    <span className="flex items-center gap-1.5 flex-shrink-0 px-2 py-[3px] rounded-md text-[10px] font-bold uppercase tracking-wide text-white/70" style={{ background: 'rgba(255,255,255,0.12)' }}>
      <span className="w-1 h-1 rounded-full bg-white/50" /> Encerrado
    </span>
  ) : (
    <span className="flex items-center gap-1.5 flex-shrink-0 px-2 py-[3px] rounded-md text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: '#CC0000' }}>
      <span className="w-1 h-1 rounded-full bg-white animate-pulse" /> Ao vivo
    </span>
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:p-4" style={{ background: '#0F0F0F' }}>

      {/* ── ROW: vídeo + chat (mesma altura, gap uniforme no desktop) ── */}
      <div className="flex flex-col flex-1 min-h-0 md:flex-none md:flex-row md:gap-4 md:items-stretch">

        {/* Vídeo — define a altura da row no desktop */}
        <div className="relative w-full bg-black md:flex-1 md:rounded-xl md:overflow-hidden md:self-start" style={{ aspectRatio: '16/9' }}>
          <YouTubePlayer videoId={config.youtubeVideoId} autoplay />
          {config.notificacoes?.ativo && config.oferta && (
            <PurchaseNotifications
              startedAt={startedAt}
              pitchSegundos={config.oferta.pitchSegundos}
              cfg={config.notificacoes}
            />
          )}
        </div>

        {/* Título — MOBILE only (entre vídeo e chat) */}
        <div
          className="md:hidden px-3 py-3 flex-shrink-0 flex items-center justify-between gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
        >
          <h1 className="text-white font-sans font-bold text-[18px] leading-tight truncate">
            {config.titulo}
          </h1>
          {liveBadge}
        </div>

        {/* Chat — mesma altura do vídeo (self-stretch), com borda.
            No desktop o conteúdo é absolute pra não empurrar a altura da coluna
            (senão cresce com as mensagens e não rola). */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col md:flex-none md:w-[400px] md:self-stretch md:relative md:rounded-xl md:border md:border-white/10">
          <div className="flex flex-col flex-1 min-h-0 md:absolute md:inset-0">
            <LiveChatFull startedAt={startedAt} roteiro={roteiro} oferta={config.oferta} chatOffsetSegundos={config.chatOffsetSegundos} />
          </div>
        </div>
      </div>

      {/* Título — DESKTOP only (abaixo do vídeo) */}
      <div className="hidden md:flex items-center gap-3 mt-3 px-1">
        <h1 className="text-white font-sans font-bold text-[18px] leading-tight truncate">
          {config.titulo}
        </h1>
        {liveBadge}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Fase: REPLAY — mobile-first, vídeo full-width
// FaseAoVivo e FaseReplay são componentes distintos propositalmente:
// React desmonta/remonta ao trocar entre eles — vídeo Vturb reinicia.
// NÃO unificar sem adicionar key= no callsite.
// ─────────────────────────────────────────────────────────────

function FaseReplay({ config }: { config: AulaConfig }) {
  // Data BRT de hoje — usada só pra tracking (cta_click) da oferta no replay
  const aulaDate = new Date().toLocaleDateString('sv-SE', { timeZone: config.timezone })

  return (
    <div className="relative z-10 flex-1 flex flex-col">
      {/* Vídeo YouTube: full-width no topo */}
      <div className="w-full bg-black flex-shrink-0" style={{ aspectRatio: '16/9' }}>
        <YouTubePlayer videoId={config.youtubeVideoId} />
      </div>

      {/* Badge REPLAY + lista de materiais */}
      <div className="flex flex-col items-center gap-4 px-6 pt-5 pb-4">
        <span className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-sans font-semibold uppercase tracking-[3px] px-4 py-1.5 rounded-full">
          Você está assistindo ao REPLAY
        </span>
        {config.materiais && <MateriaisButton materiais={config.materiais} />}
      </div>

      {/* Oferta — mesmo card da aula ao vivo (link/preço/CTA reais + UTM) */}
      {config.oferta && (
        <div className="pb-10">
          <OfferCard oferta={config.oferta} aulaDate={aulaDate} />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function msToHMS(ms: number): { h: number; m: number; s: number } {
  const safe = Math.max(0, ms)
  const totalSec = Math.floor(safe / 1000)
  return {
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}
