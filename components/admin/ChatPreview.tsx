'use client'
import { ChatRow } from '@/app/aula/LiveElements'

export function ChatPreview({ mensagens }: { mensagens: { name: string; msg: string; isOfficial?: boolean }[] }) {
  const visiveis = mensagens.filter(m => m.name?.trim())
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--admin-border)' }}>
      <div className="px-3 py-2 text-[11px] admin-muted border-b" style={{ borderColor: 'var(--admin-border)' }}>Prévia do chat</div>
      <div className="py-2 max-h-[70vh] overflow-y-auto" style={{ background: '#0F0F0F' }}>
        {visiveis.length === 0
          ? <p className="text-center py-8 text-[13px]" style={{ color: '#717171' }}>Sem mensagens ainda…</p>
          : visiveis.map((m, i) => (
              <ChatRow key={i} name={m.name} msg={m.msg} isHistory isOfficial={m.isOfficial} />
            ))}
      </div>
    </div>
  )
}
