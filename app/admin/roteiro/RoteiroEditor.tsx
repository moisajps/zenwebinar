'use client'
import { useMemo, useState } from 'react'
import { parseRoteiro } from '@/lib/roteiro-parse'

export function RoteiroEditor({ inicial }: { inicial: string }) {
  const [texto, setTexto] = useState(inicial)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState('')

  const preview = useMemo(() => {
    try { return { rows: parseRoteiro(texto), erro: '' } }
    catch (e) { return { rows: [], erro: (e as Error).message } }
  }, [texto])

  const salvar = async () => {
    setSalvando(true); setMsg('')
    const r = await fetch('/api/admin/aula/roteiro', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto }),
    })
    const j = await r.json()
    setSalvando(false)
    setMsg(r.ok ? `Salvo! ${j.total} mensagens.` : `Erro: ${j.erro}`)
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={16}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-mono text-sm"
        placeholder={'10 | Ana | Boa noite!\n01:30 | Bia | Olá'} />
      {preview.erro
        ? <p className="text-rose-400 text-sm">{preview.erro}</p>
        : <p className="text-white/50 text-sm">{preview.rows.length} mensagens válidas.</p>}
      <button onClick={salvar} disabled={salvando || !!preview.erro}
        className="bg-amber-500 text-black font-bold rounded-full py-3 disabled:opacity-50">
        {salvando ? 'Salvando...' : 'Salvar roteiro'}
      </button>
      {msg && <p className="text-sm text-white/70">{msg}</p>}
    </div>
  )
}
