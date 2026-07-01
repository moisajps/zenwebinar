'use client'
import { useState } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react'
import { ChatPreview } from '@/components/admin/ChatPreview'
import { PageHeader } from '@/components/admin/PageHeader'

type Linha = { id: number; tempo: string; nome: string; mensagem: string }

// Module-level counter — monotonically incrementing, stable across re-renders,
// safe to call during useState initializer (not a React ref).
let _idCounter = 0
const nextId = () => ++_idCounter

export function RoteiroEditor({ inicial }: { inicial: { delay: number; name: string; msg: string }[] }) {
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    inicial.length
      ? inicial.map(r => ({ id: nextId(), tempo: String(r.delay), nome: r.name, mensagem: r.msg }))
      : [],
  )
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  // Add-form state
  const [addTempo, setAddTempo] = useState('')
  const [addNome, setAddNome] = useState('')
  const [addMensagem, setAddMensagem] = useState('')

  const set = (i: number, k: keyof Omit<Linha, 'id'>, v: string) => setLinhas(ls => ls.map((l, j) => j === i ? { ...l, [k]: v } : l))
  const rm = (i: number) => setLinhas(ls => ls.filter((_, j) => j !== i))
  const move = (i: number, d: -1 | 1) => setLinhas(ls => {
    const j = i + d; if (j < 0 || j >= ls.length) return ls
    const c = [...ls]; [c[i], c[j]] = [c[j], c[i]]; return c
  })

  const adicionar = () => {
    setLinhas(ls => [...ls, { id: nextId(), tempo: addTempo, nome: addNome, mensagem: addMensagem }])
    setAddTempo('')
    setAddNome('')
    setAddMensagem('')
  }

  const salvar = async () => {
    setSalvando(true); setMsg('')
    const r = await fetch('/api/admin/aula/roteiro', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linhas: linhas.filter(l => l.nome.trim() || l.mensagem.trim() || l.tempo.trim()).map(({ tempo, nome, mensagem }) => ({ tempo, nome, mensagem })) }),
    })
    const j = await r.json()
    setSalvando(false)
    setMsg(r.ok ? `Salvo! ${j.total} mensagens.` : `Erro: ${j.erro}`)
  }

  const mensagensPreview = linhas
    .filter(l => l.nome.trim() || l.mensagem.trim())
    .map(l => ({ name: l.nome, msg: l.mensagem }))

  return (
    <>
    <PageHeader
      title="Roteiro do chat"
      subtitle="Mensagens simuladas por tempo"
      actions={
        <div className="flex items-center gap-3">
          <button onClick={salvar} disabled={salvando} className="admin-accent font-bold rounded-full py-3 px-6 disabled:opacity-50 flex items-center gap-2">
            <Save size={15} />
            {salvando ? 'Salvando...' : 'Salvar roteiro'}
          </button>
          {msg && <p className="text-sm admin-muted">{msg}</p>}
        </div>
      }
    />
    <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start" data-tour="roteiro-editor">
      {/* LEFT: Add form + list */}
      <div className="flex flex-col gap-6">
        {/* Add form */}
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: 'var(--admin-border)' }}>
          <p className="text-[12px] font-semibold admin-muted uppercase tracking-wide">Adicionar mensagem</p>
          <div className="grid grid-cols-[80px_140px_1fr] gap-2">
            <input
              value={addTempo}
              onChange={e => setAddTempo(e.target.value)}
              placeholder="90 / 1:30"
              className="admin-input rounded-lg px-2 py-2 text-sm"
            />
            <input
              value={addNome}
              onChange={e => setAddNome(e.target.value)}
              placeholder="Nome"
              className="admin-input rounded-lg px-2 py-2 text-sm"
            />
            <input
              value={addMensagem}
              onChange={e => setAddMensagem(e.target.value)}
              placeholder="Mensagem"
              className="admin-input rounded-lg px-2 py-2 text-sm"
              onKeyDown={e => { if (e.key === 'Enter') adicionar() }}
            />
          </div>
          <button
            onClick={adicionar}
            className="self-start flex items-center gap-1.5 text-[13px] admin-accent font-semibold rounded-lg px-3 py-2"
          >
            <Plus size={15} /> Adicionar
          </button>
        </div>

        {/* List of existing rows */}
        {linhas.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[80px_140px_1fr_auto] gap-2 text-[11px] admin-muted px-1">
              <span>Tempo</span><span>Nome</span><span>Mensagem</span><span></span>
            </div>
            {linhas.map((l, i) => (
              <div key={l.id} className="grid grid-cols-[80px_140px_1fr_auto] gap-2 items-center">
                <input value={l.tempo} onChange={e => set(i, 'tempo', e.target.value)} placeholder="90 / 1:30" className="admin-input rounded-lg px-2 py-2 text-sm" />
                <input value={l.nome} onChange={e => set(i, 'nome', e.target.value)} placeholder="Nome" className="admin-input rounded-lg px-2 py-2 text-sm" />
                <input value={l.mensagem} onChange={e => set(i, 'mensagem', e.target.value)} placeholder="Mensagem" className="admin-input rounded-lg px-2 py-2 text-sm" />
                <div className="flex items-center gap-1">
                  <button onClick={() => move(i, -1)} aria-label="Subir" className="admin-muted hover:admin-text p-1"><ArrowUp size={15} /></button>
                  <button onClick={() => move(i, 1)} aria-label="Descer" className="admin-muted hover:admin-text p-1"><ArrowDown size={15} /></button>
                  <button onClick={() => rm(i)} aria-label="Remover" className="admin-muted hover:admin-text p-1"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {linhas.length === 0 && (
          <p className="text-[13px] admin-muted text-center py-4">Nenhuma mensagem ainda. Use o formulário acima para adicionar.</p>
        )}
      </div>

      {/* RIGHT: Chat preview */}
      <div className="mt-6 lg:mt-0 lg:sticky lg:top-6">
        <ChatPreview mensagens={mensagensPreview} />
      </div>
    </div>
    </>
  )
}
