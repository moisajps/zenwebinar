'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Copy, MoreHorizontal, Plus, Loader2 } from 'lucide-react'
import { StatusChip } from '@/components/admin/StatusChip'
import type { StatusAula } from '@/lib/aula-status'

export type AulaComResumo = {
  id: string
  slug: string
  nome: string
  inicioAt: string | null
  timezone: string
  status: StatusAula
  acessos: number
  cliques: number
}

// ---- Card de aula ----

function AulaCard({ aula }: { aula: AulaComResumo }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [copying, setCopying] = useState(false)
  const [isPending, startTransition] = useTransition()
  const publicUrl = `/aula/${aula.slug}`

  // Fecha menu ao clicar fora
  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  function openMenu(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.left })
    setMenuOpen((v) => !v)
  }

  function formatDate(inicioAt: string | null, timezone: string): string {
    if (!inicioAt) return '—'
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: timezone || 'America/Sao_Paulo',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(inicioAt))
    } catch {
      return inicioAt
    }
  }

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(window.location.origin + publicUrl)
      setCopying(true)
      setTimeout(() => setCopying(false), 1500)
    } catch {}
  }

  async function handleDuplicate() {
    setMenuOpen(false)
    startTransition(async () => {
      const res = await fetch('/api/admin/aulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: aula.nome + ' (cópia)', duplicarDe: aula.id }),
      })
      if (res.ok) {
        const json = await res.json()
        router.push('/admin/aulas/' + json.id)
      }
    })
  }

  async function handleArquivar() {
    setMenuOpen(false)
    startTransition(async () => {
      await fetch(`/api/admin/aulas/${aula.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arquivada: true }),
      })
      router.refresh()
    })
  }

  return (
    <div
      className="admin-card rounded-xl p-5 cursor-pointer transition-shadow duration-150 hover:shadow-md relative group"
      style={{ borderColor: 'var(--admin-border)' }}
      onClick={() => router.push('/admin/aulas/' + aula.id)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold admin-text text-sm leading-snug truncate" title={aula.nome}>
            {aula.nome}
          </h3>
          <p className="text-[12px] admin-muted mt-0.5">{formatDate(aula.inicioAt, aula.timezone)}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <StatusChip status={aula.status} />
          {isPending && <Loader2 size={14} className="admin-muted animate-spin" />}
          <button
            ref={btnRef}
            onClick={openMenu}
            className="w-7 h-7 flex items-center justify-center rounded-lg admin-muted hover:admin-text transition-colors duration-150 cursor-pointer"
            title="Opções"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-3">
        <div className="text-center">
          <p className="text-lg font-bold admin-text tabular-nums leading-tight">{aula.acessos}</p>
          <p className="text-[10px] admin-muted uppercase tracking-wide">Acessos</p>
        </div>
        <div className="w-px h-8" style={{ background: 'var(--admin-border)' }} />
        <div className="text-center">
          <p className="text-lg font-bold admin-text tabular-nums leading-tight">{aula.cliques}</p>
          <p className="text-[10px] admin-muted uppercase tracking-wide">Cliques CTA</p>
        </div>
        {aula.acessos > 0 && (
          <>
            <div className="w-px h-8" style={{ background: 'var(--admin-border)' }} />
            <div className="text-center">
              <p className="text-lg font-bold admin-text tabular-nums leading-tight">
                {((aula.cliques / aula.acessos) * 100).toFixed(0)}%
              </p>
              <p className="text-[10px] admin-muted uppercase tracking-wide">CTR</p>
            </div>
          </>
        )}
      </div>

      {/* Link row */}
      <div
        className="flex items-center gap-2 pt-3"
        style={{ borderTop: '1px solid var(--admin-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex-1 text-[11px] admin-muted font-mono truncate">/aula/{aula.slug}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] admin-muted hover:admin-text transition-colors duration-150 cursor-pointer"
          title="Copiar link"
        >
          <Copy size={12} />
          {copying ? 'Copiado!' : 'Copiar'}
        </button>
        <Link
          href={publicUrl}
          target="_blank"
          className="flex items-center gap-1 text-[11px] admin-muted hover:admin-text transition-colors duration-150"
          title="Abrir link"
        >
          <ExternalLink size={12} />
        </Link>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] rounded-xl shadow-lg py-1.5"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            background: 'var(--admin-panel)',
            border: '1px solid var(--admin-border)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDuplicate}
            className="w-full text-left px-4 py-2 text-sm admin-text hover:admin-bg transition-colors duration-150 cursor-pointer"
          >
            Duplicar
          </button>
          <Link
            href={publicUrl}
            target="_blank"
            className="block px-4 py-2 text-sm admin-text hover:admin-bg transition-colors duration-150"
            onClick={() => setMenuOpen(false)}
          >
            Abrir link
          </Link>
          <div style={{ borderTop: '1px solid var(--admin-border)', margin: '4px 0' }} />
          <button
            onClick={handleArquivar}
            className="w-full text-left px-4 py-2 text-sm transition-colors duration-150 cursor-pointer"
            style={{ color: '#B91C1C' }}
          >
            Arquivar
          </button>
        </div>
      )}
    </div>
  )
}

// ---- Nova Aula inline form ----

export function NovaAulaButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/aulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome.trim() }),
      })
      if (res.ok) {
        const json = await res.json()
        router.push('/admin/aulas/' + json.id)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium admin-accent cursor-pointer"
      >
        <Plus size={15} />
        Nova aula
      </button>
    )
  }

  return (
    <form onSubmit={handleCreate} className="flex items-center gap-2">
      <input
        ref={inputRef}
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Nome da aula"
        className="admin-input rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus-visible:outline-[2px] focus-visible:outline-[var(--admin-accent)]"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !nome.trim()}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium admin-accent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        Criar
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setNome('') }}
        className="px-3 py-2 rounded-lg text-sm admin-muted hover:admin-text transition-colors cursor-pointer"
      >
        Cancelar
      </button>
    </form>
  )
}

// ---- Lista principal ----

export function AulasList({ aulas }: { aulas: AulaComResumo[] }) {
  if (aulas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'var(--admin-border)' }}
        >
          <Plus size={24} className="admin-muted" />
        </div>
        <h2 className="text-lg font-semibold admin-text mb-2">Nenhuma aula ainda</h2>
        <p className="text-sm admin-muted max-w-xs mb-6">
          Crie sua primeira aula para começar a configurar e acompanhar seus webinars.
        </p>
        <NovaAulaButton />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {aulas.map((aula) => (
        <AulaCard key={aula.id} aula={aula} />
      ))}
    </div>
  )
}
