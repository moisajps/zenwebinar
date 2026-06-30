'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'aula_acesso'

type Acesso = { email: string; nome: string | null }

const AulaSessionCtx = createContext<Acesso | null>(null)

export function useAulaSession(): Acesso | null {
  return useContext(AulaSessionCtx)
}

function salvarAcesso(a: Acesso) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(a)) } catch {}
}

function lerAcesso(): Acesso | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Acesso
    if (!parsed.email) return null
    return parsed
  } catch { return null }
}

export function AulaGate({ children, areaLabel }: { children: ReactNode; areaLabel: string }) {
  const [acesso, setAcesso] = useState<Acesso | null>(null)
  const [pronto, setPronto] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    const salvo = lerAcesso()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza acesso salvo no localStorage no mount, intencional
    if (salvo) setAcesso(salvo)
    setPronto(true)
  }, [])

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    const nomeLimpo = nome.trim()
    const emailLimpo = email.trim().toLowerCase()
    if (!nomeLimpo || !emailLimpo) return
    setErro('')
    setCarregando(true)

    // Só o primeiro nome para personalização/chat
    const primeiroNome = nomeLimpo.split(/\s+/)[0]
    const novoAcesso: Acesso = { email: emailLimpo, nome: primeiroNome }

    // Registra (captura nome+email + seta cookie assinado). Nunca bloqueia —
    // se falhar, libera o acesso mesmo assim pra não gerar suporte.
    try {
      await fetch('/api/aula/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: primeiroNome, email: emailLimpo }),
      })
    } catch { /* segue mesmo assim */ }

    salvarAcesso(novoAcesso)
    setAcesso(novoAcesso)
    setCarregando(false)
  }

  if (!pronto) return null

  if (acesso) {
    return (
      <AulaSessionCtx.Provider value={acesso}>
        {children}
      </AulaSessionCtx.Provider>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: '#0A0A0A' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-[10px] font-sans text-white/30 uppercase tracking-[3px]">
            {areaLabel}
          </span>
          <h1 className="font-display text-2xl text-white leading-snug">
            Entre na aula ao vivo
          </h1>
          <p className="text-sm text-white/40 font-sans">
            Preencha para liberar seu acesso.
          </p>
        </div>

        <form onSubmit={entrar} className="w-full flex flex-col gap-3">
          <input
            type="text"
            placeholder="Seu primeiro nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
            autoComplete="given-name"
            autoFocus
            className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-sans placeholder:text-white/25 outline-none focus:border-white/30 transition-colors"
          />
          <input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3.5 text-white text-sm font-sans placeholder:text-white/25 outline-none focus:border-white/30 transition-colors"
          />
          {erro && (
            <p className="text-rose-400 text-[12px] font-sans text-center px-2">{erro}</p>
          )}
          <button
            type="submit"
            disabled={carregando || !nome.trim() || !email.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold font-sans text-base rounded-full py-4 transition-all duration-150 active:scale-[0.98]"
          >
            {carregando ? 'Entrando...' : 'Entrar na aula'}
          </button>
        </form>

        <p className="text-[11px] text-white/20 font-sans text-center">
          Ao entrar, você concorda em participar da aula ao vivo.
        </p>
      </div>
    </div>
  )
}
