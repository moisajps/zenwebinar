'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase-browser'

export function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createSupabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    window.location.href = '/admin'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080809] px-4 relative overflow-hidden">

      {/* Orbs de fundo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-white opacity-[0.03] blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-white opacity-[0.02] blur-[120px]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[380px]">

        {/* Borda exterior sutil */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/8 to-white/0 pointer-events-none" />

        <div
          className="relative rounded-2xl px-8 py-9 flex flex-col gap-6"
          style={{
            background: 'rgba(14, 14, 16, 0.8)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
          }}
        >

          {/* Logo */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-1"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <span className="font-sans font-bold text-white/70 text-lg tracking-tight">W</span>
            </div>
            <div>
              <p className="font-sans text-[11px] tracking-[3px] uppercase text-white/20">Webinar</p>
              <h1 className="font-sans text-base font-semibold text-white/90 mt-0.5">Painel Admin</h1>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/6 to-transparent" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-sans text-[10px] uppercase tracking-[2px] text-white/30">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full rounded-xl px-4 py-3 font-sans text-sm text-white/90 placeholder-white/15 focus:outline-none transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onBlur={e =>  { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-sans text-[10px] uppercase tracking-[2px] text-white/30">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 font-sans text-sm text-white/90 placeholder-white/15 focus:outline-none transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onBlur={e =>  { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="font-sans text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-sans font-semibold text-sm py-3 rounded-xl transition-all duration-200 cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}
