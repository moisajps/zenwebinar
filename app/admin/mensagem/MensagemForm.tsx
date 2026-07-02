'use client'
import { useState } from 'react'
import { ChatPreview } from '@/components/admin/ChatPreview'

export function MensagemForm({ teamName, aulaId }: { teamName: string; aulaId?: string }) {
  const [message, setMessage] = useState('')
  const [msg, setMsg] = useState('')

  const enviar = async () => {
    const r = await fetch('/api/admin/aula/mensagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, aulaId }),
    })
    setMsg(r.ok ? 'Enviada!' : 'Erro ao enviar')
    if (r.ok) setMessage('')
  }

  return (
    <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">
      <div className="flex flex-col gap-3">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          maxLength={300}
          className="admin-input rounded-lg px-3 py-2"
          placeholder="Mensagem que aparece destacada no chat ao vivo"
        />
        <button
          onClick={enviar}
          disabled={!message.trim()}
          className="admin-accent font-bold rounded-full py-3 disabled:opacity-50 transition-colors cursor-pointer"
        >
          Enviar como equipe
        </button>
        {msg && <p className="text-sm admin-muted">{msg}</p>}
      </div>

      <div className="mt-6 lg:mt-0 lg:sticky lg:top-6">
        <ChatPreview
          mensagens={
            message.trim()
              ? [{ name: teamName, msg: message, isOfficial: true }]
              : []
          }
        />
      </div>
    </div>
  )
}
