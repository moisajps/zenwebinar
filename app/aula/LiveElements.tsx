'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@supabase/supabase-js'
import { OfferDrawer, OfferCard } from './Offer'
import { type Oferta } from './config-types'
import { trackAula } from './track'

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// ─── Tipo do roteiro de chat (vem por prop, não hardcoded) ────────────────────
export type RoteiroItem = { delay: number; name: string; msg: string }

// ─── Avatar colorido por usuário (estilo YouTube) ─────────────────────────────

const AVATAR_PALETTE = [
  '#FF6B35', '#4CC9F0', '#7B2FBE', '#F72585',
  '#4361EE', '#06D6A0', '#FFB703', '#E63946',
  '#48CAE4', '#F4A261', '#2A9D8F', '#E9C46A',
]

function avatarColor(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]
}

// ─── Contador de espectadores (busca API real) ────────────────────────────────
export function ViewerCounterInline({ startedAt, aulaDate }: { startedAt?: string; aulaDate: string }) {
  const [count, setCount] = useState<number>(0)
  useEffect(() => {
    let alive = true
    const fetchCount = async () => {
      try {
        const r = await fetch(`/api/aula/ao-vivo?data=${aulaDate}`)
        const j = await r.json()
        if (alive && typeof j.exibido === 'number') setCount(j.exibido)
      } catch { /* silencioso */ }
    }
    fetchCount()
    const id = setInterval(fetchCount, 8000)
    return () => { alive = false; clearInterval(id) }
  }, [aulaDate])
  return (
    <span className="text-[13px] tabular-nums flex items-center gap-1.5 flex-shrink-0" style={{ color: '#F1F1F1' }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#AAAAAA' }}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
      {count.toLocaleString('pt-BR')}
    </span>
  )
}

// ─── Chat ao vivo sincronizado por tempo ──────────────────────────────────────

type Msg = { id: string | number; name: string; msg: string; isHistory: boolean; isOfficial?: boolean }

type FloatEmoji = { id: number; emoji: string; x: number; y: number }

// Hosts confiáveis pro botão de CTA (defesa extra contra link malicioso)
// Apenas hosts genéricos/WhatsApp; host da oferta é derivado do link da oferta em tempo de execução.
const HOSTS_CONFIAVEIS_BASE = ['wa.me', 'api.whatsapp.com']

// Texto do botão conforme o destino do link
function labelBotao(url: string): string {
  if (/wa\.me|whatsapp/i.test(url)) return '💬 Falar no WhatsApp'
  return 'Garantir minha vaga →'
}

function hostConfiavel(url: string, ofertaUrl?: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase()
    const baseOk = HOSTS_CONFIAVEIS_BASE.some(d => h === d || h.endsWith('.' + d))
    if (baseOk) return true
    // Deriva confiança do host da própria oferta (genérico — funciona para qualquer cliente)
    if (ofertaUrl) {
      try {
        const ofertaHost = new URL(ofertaUrl).hostname.toLowerCase()
        if (h === ofertaHost || h.endsWith('.' + ofertaHost)) return true
      } catch { /* ignore */ }
    }
    return false
  } catch { return false }
}

// Separa o texto da 1ª URL. Só vira botão se for de host confiável.
function extrairLink(msg: string, ofertaUrl?: string): { texto: string; url: string | null } {
  const m = msg.match(/https?:\/\/[^\s]+/)
  if (!m || !hostConfiavel(m[0], ofertaUrl)) return { texto: msg, url: null }
  return { texto: msg.replace(m[0], '').trim(), url: m[0] }
}

function ChatRow({ name, msg, isHistory, isOfficial, ofertaUrl }: { name: string; msg: string; isHistory: boolean; isOfficial?: boolean; ofertaUrl?: string }) {
  const [visible, setVisible] = useState(isHistory)
  const color = avatarColor(name)
  // Destaque oficial vem de uma flag do servidor (não do nome) — evita impersonação
  const isAdmin = isOfficial === true

  useEffect(() => {
    if (isHistory) return
    const t = setTimeout(() => setVisible(true), 16)
    return () => clearTimeout(t)
  }, [isHistory])

  // ── Mensagem oficial da equipe: caixa destacada + selo + botão de link ──
  if (isAdmin) {
    const { texto, url } = extrairLink(msg, ofertaUrl)
    return (
      <div
        className="px-2 py-1.5 transition-all duration-200 ease-out"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(5px)' }}
      >
        <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.45)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F59E0B' }}>
              <span className="text-[10px] font-bold leading-none text-black">{name[0].toUpperCase()}</span>
            </div>
            <span className="font-bold text-[12px]" style={{ color: '#F59E0B' }}>{name}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B" className="flex-shrink-0">
              <path d="M12 2l2.4 2.4 3.4-.6.6 3.4L22 12l-3.6 2.4.6 3.4-3.4-.6L12 22l-2.4-3.4-3.4.6.6-3.4L2 12l3.4-2.4-.6-3.4 3.4.6z" opacity="0.25"/>
              <path d="M10.5 13.4l-2-2-1.3 1.3 3.3 3.3 6-6-1.3-1.3z" fill="#fff"/>
            </svg>
          </div>
          <p className="text-[13px] leading-snug break-words" style={{ color: '#F1F1F1' }}>{texto}</p>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block w-full text-center rounded-full py-2 font-bold text-[13px] active:scale-[0.98] transition-transform"
              style={{ background: '#F59E0B', color: '#0F0F0F' }}
            >
              {labelBotao(url)}
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex gap-2 items-start px-3 py-[3px] transition-all duration-200 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(5px)' }}
    >
      {/* Avatar YouTube-style */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-[1px]"
        style={{ background: color }}
      >
        <span className="text-[10px] font-bold leading-none text-white">
          {name[0].toUpperCase()}
        </span>
      </div>
      {/* Nome + msg inline, igual YouTube */}
      <p className="text-[13px] leading-[1.4] min-w-0 text-left break-words">
        <span className="font-medium mr-1.5" style={{ color: '#AAAAAA' }}>{name}</span>
        <span style={{ color: '#E8E8E8' }}>{msg}</span>
      </p>
    </div>
  )
}

// Botão flutuante de reações (estilo YouTube): coração no canto inferior direito
// que, ao ser clicado, expande as opções de emoji. Cada emoji escolhido sobe
// flutuando via portal no body (acima do vídeo).
const REACTION_EMOJIS = ['❤️', '👏', '😍', '🔥', '👍', '🎉'] as const

function ReactionFab() {
  const [open, setOpen] = useState(false)
  const [floats, setFloats] = useState<FloatEmoji[]>([])
  const nextId = useRef(0)

  const fire = (emoji: string, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const id = nextId.current++
    // eslint-disable-next-line react-hooks/purity -- jitter aleatório em event handler (não em render), comportamento intencional
    const x = rect.left + rect.width / 2 + (Math.random() * 14 - 7)
    const y = rect.top
    setFloats(f => [...f, { id, emoji, x, y }])
    setTimeout(() => setFloats(f => f.filter(e => e.id !== id)), 1400)
  }

  return (
    <div className="absolute right-3 bottom-[68px] z-30 flex flex-col items-center gap-2">
      {/* Opções (aparecem acima do botão principal) */}
      {open && REACTION_EMOJIS.map((emoji, i) => (
        <button
          key={emoji}
          onClick={(e) => fire(emoji, e.currentTarget)}
          className="w-11 h-11 rounded-full flex items-center justify-center text-[22px] shadow-lg"
          style={{
            background: 'rgba(40,40,40,0.95)',
            backdropFilter: 'blur(8px)',
            animation: `popIn 0.18s ease-out ${i * 0.03}s both`,
          }}
        >
          {emoji}
        </button>
      ))}

      {/* Botão principal — coração */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-12 h-12 rounded-full flex items-center justify-center text-[24px] shadow-xl transition-transform active:scale-90"
        style={{ background: open ? 'rgba(40,40,40,0.95)' : 'rgba(40,40,40,0.85)', backdropFilter: 'blur(8px)' }}
        aria-label="Reagir"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#AAAAAA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        ) : '❤️'}
      </button>

      {/* Emojis flutuantes (portal no body, acima do vídeo) */}
      {floats.length > 0 && typeof document !== 'undefined' && createPortal(
        floats.map(f => (
          <span
            key={f.id}
            className="fixed pointer-events-none select-none text-3xl z-[9999]"
            style={{
              left: f.x,
              top: f.y,
              transform: 'translate(-50%, -50%)',
              animation: 'floatUp 1.4s ease-out forwards',
            }}
          >
            {f.emoji}
          </span>
        )),
        document.body,
      )}
    </div>
  )
}

// Chat sincronizado — recebe o instante em que a aula começou e o roteiro por prop.
// Mensagens do roteiro aparecem por tempo. Mensagens reais
// são inseridas no Supabase e distribuídas via polling.
export function LiveChatFull({ startedAt, roteiro, oferta, chatOffsetSegundos }: { startedAt: string; roteiro: RoteiroItem[]; oferta?: Oferta; chatOffsetSegundos?: number }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Estado da oferta: 'hidden' (antes do pitch) | 'drawer' (sobe cobrindo) | 'card' (fixo no rodapé)
  const [offerState, setOfferState] = useState<'hidden' | 'drawer' | 'card'>('hidden')

  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const scrolledToBottomRef = useRef(false)

  // Aula date para filtrar no Supabase (yyyy-mm-dd BRT)
  const aulaDate = new Date(startedAt).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

  // ── Timing da oferta ──
  // O drawer sobe quando elapsed >= pitchSegundos. Se o usuário já fechou
  // (localStorage), reabre direto como card. Reload depois do pitch:
  //  - se já fechou → card; se não → drawer.
  // Override de teste: ?pitch=SEGUNDOS na URL.
  useEffect(() => {
    if (!oferta) return
    const dismissKey = `aula_offer_dismissed:${aulaDate}`
    const dismissed = (() => { try { return localStorage.getItem(dismissKey) === '1' } catch { return false } })()

    let pitch = oferta.pitchSegundos
    try {
      const p = new URLSearchParams(window.location.search).get('pitch')
      if (p && !isNaN(Number(p))) pitch = Number(p)
    } catch { /* ignore */ }

    const start = new Date(startedAt).getTime()
    const elapsed = Math.max(0, (Date.now() - start) / 1000)

    if (elapsed >= pitch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza estado da oferta com o tempo decorrido do vídeo no mount, intencional
      setOfferState(dismissed ? 'card' : 'drawer')
      return
    }
    // Ainda não chegou: agenda o drawer
    const t = setTimeout(() => setOfferState('drawer'), (pitch - elapsed) * 1000)
    return () => clearTimeout(t)
  }, [oferta, startedAt, aulaDate])

  const fecharOferta = () => {
    setOfferState('card')
    try { localStorage.setItem(`aula_offer_dismissed:${aulaDate}`, '1') } catch { /* ignore */ }
  }

  // Tracking: registra oferta_view quando o drawer sobe (1x por sessão)
  const offerViewedRef = useRef(false)
  useEffect(() => {
    if (offerState === 'drawer' && !offerViewedRef.current) {
      offerViewedRef.current = true
      trackAula(aulaDate, 'oferta_view')
    }
  }, [offerState, aulaDate])

  // Inicialização: busca msgs reais do banco + merge cronológico com o roteiro
  useEffect(() => {
    const start = new Date(startedAt).getTime()
    const elapsed = Math.max(0, (Date.now() - start) / 1000)

    // Offset de calibração: adianta (+) ou atrasa (−) TODO o chat scriptado.
    // Vem do config (chatOffsetSegundos) e pode ser sobrescrito por ?chatoffset=N.
    let chatOffset = chatOffsetSegundos ?? 0
    try {
      const o = new URLSearchParams(window.location.search).get('chatoffset')
      if (o !== null && !isNaN(Number(o))) chatOffset = Number(o)
    } catch { /* ignore */ }
    const dly = (d: number) => d - chatOffset  // delay efetivo

    // Scripted: histórico do roteiro com timestamp virtual (start + delay efetivo)
    const scriptHist = roteiro
      .filter(m => dly(m.delay) <= elapsed)
      .map((m, i) => ({
        id: `s${i}`,
        name: m.name,
        msg: m.msg,
        isHistory: true,
        sortTs: start + dly(m.delay) * 1000,
      }))

    // Busca msgs reais do banco (enviadas desde o início da aula)
    supabaseAnon
      .from('aula_chat')
      .select('id, user_name, message, created_at, is_official')
      .eq('aula_date', aulaDate)
      .eq('hidden', false)
      .gte('created_at', new Date(start).toISOString())
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const realHist = (data ?? []).map(r => ({
          id: `r${r.id}`,
          name: r.user_name as string,
          msg: r.message as string,
          isHistory: true,
          isOfficial: r.is_official === true,
          sortTs: new Date(r.created_at as string).getTime(),
        }))

        // Merge cronológico: roteiro + reais, ordenados por timestamp
        const merged = [...scriptHist, ...realHist]
          .sort((a, b) => a.sortTs - b.sortTs)
          .map(({ sortTs: _ts, ...m }) => m) // remove sortTs do estado final

        setMessages(merged)

        // Polling: só busca msgs NOVAS a partir da última real
        const lastTs = realHist.length > 0
          ? (data![data!.length - 1].created_at as string)
          : new Date(start).toISOString()
        lastCreatedAtRef.current = lastTs
      })

    // Scripted futuras
    const timers = roteiro
      .filter(m => dly(m.delay) > elapsed)
      .map(({ delay, name, msg }, i) =>
        setTimeout(() => {
          setMessages(prev => [...prev, { id: `s${scriptHist.length + i}`, name, msg, isHistory: false }])
        }, (dly(delay) - elapsed) * 1000),
      )
    return () => timers.forEach(clearTimeout)
  }, [startedAt, aulaDate, chatOffsetSegundos, roteiro])

  // Polling a cada 3s: só mensagens NOVAS (após o último fetch)
  const lastCreatedAtRef = useRef<string>(new Date(startedAt).toISOString())
  useEffect(() => {
    const poll = async () => {
      const { data } = await supabaseAnon
        .from('aula_chat')
        .select('id, user_name, message, created_at, is_official')
        .eq('aula_date', aulaDate)
        .eq('hidden', false)
        .gt('created_at', lastCreatedAtRef.current)
        .order('created_at', { ascending: true })

      if (data && data.length > 0) {
        lastCreatedAtRef.current = data[data.length - 1].created_at as string
        setMessages(prev => [
          ...prev,
          ...data.map(r => ({
            id: `r${r.id}`, name: r.user_name as string, msg: r.message as string, isHistory: false, isOfficial: r.is_official === true,
          })),
        ])
      }
    }

    const interval = setInterval(poll, 5000)  // 5s reduz carga no banco (live com muitos usuários)
    return () => clearInterval(interval)
  }, [aulaDate, startedAt])

  // Scroll inicial após histórico
  useEffect(() => {
    if (messages.length > 0 && !scrolledToBottomRef.current) {
      scrolledToBottomRef.current = true
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    }
  }, [messages])

  // Scroll em nova mensagem se estiver no fundo
  useEffect(() => {
    if (atBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  const enviar = async () => {
    const texto = input.trim()
    if (!texto || enviando) return
    setInput('')
    setEnviando(true)
    try {
      await fetch('/api/aula/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: texto, aula_date: aulaDate }),
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex flex-col h-full relative" style={{ background: '#0F0F0F', fontFamily: 'Roboto, system-ui, sans-serif' }}>

      {/* Keyframes para emojis flutuantes (inclui o -50% de centramento) */}
      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
          15%  { opacity: 1; transform: translate(-50%, -50%) scale(1.25); }
          80%  { opacity: 0.7; transform: translate(-50%, calc(-50% - 70px)) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, calc(-50% - 100px)) scale(0.85); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0.4) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      {/* Header — estilo YouTube */}
      <div className="flex-shrink-0 px-3 py-2.5 flex items-center justify-between">
        {/* Esquerda: título + subtítulo empilhados */}
        <div className="flex flex-col gap-1">
          <p className="text-[16px] font-bold leading-none" style={{ color: '#F1F1F1' }}>Chat ao vivo</p>
          <span className="text-[12px] leading-none" style={{ color: '#AAAAAA' }}>Mensagens principais</span>
        </div>
        {/* Direita: contador centralizado verticalmente */}
        <ViewerCounterInline startedAt={startedAt} aulaDate={aulaDate} />
      </div>

      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />

      {/* Mensagens */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto py-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {messages.length === 0 ? (
          <p className="text-center py-8 text-[13px]" style={{ color: '#717171' }}>
            As mensagens vão aparecer aqui...
          </p>
        ) : (
          messages.map(m => (
            <ChatRow key={m.id} name={m.name} msg={m.msg} isHistory={m.isHistory} isOfficial={m.isOfficial} ofertaUrl={oferta?.link} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Botão flutuante de reações (canto inferior direito) */}
      <ReactionFab />

      {/* Card fixo da oferta (após fechar o drawer) */}
      {offerState === 'card' && oferta && <OfferCard oferta={oferta} aulaDate={aulaDate} />}

      {/* Input — estilo YouTube */}
      <div className="flex items-center gap-2 px-3 pb-3 flex-shrink-0">
        <div className="flex-1 flex items-center rounded-full px-3 py-2" style={{ background: '#282828' }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') enviar() }}
            placeholder="Chat..."
            maxLength={300}
            className="flex-1 bg-transparent text-[13px] outline-none"
            style={{ color: '#E8E8E8' }}
          />
        </div>
        {/* Botão enviar */}
        <button
          onClick={enviar}
          disabled={!input.trim() || enviando}
          aria-label="Enviar"
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-60"
          style={{ background: '#3EA6FF' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0F0F0F' }}>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Drawer da oferta — cobre todo o chat */}
      {offerState === 'drawer' && oferta && (
        <OfferDrawer oferta={oferta} aulaDate={aulaDate} onClose={fecharOferta} />
      )}
    </div>
  )
}
