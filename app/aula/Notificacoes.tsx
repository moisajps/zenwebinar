// app/aula/Notificacoes.tsx
// Notificações de compra (prova social) que aparecem no canto inferior esquerdo
// do vídeo durante a aula ao vivo. Começam X min após o pitch da oferta.
'use client'

import { useEffect, useState } from 'react'
import type { NotificacoesCompra } from './config-types'

// Nomes femininos BR genéricos. Sem sobrenome p/ soar natural.
const NOMES = [
  'Juliana', 'Patrícia', 'Fernanda', 'Camila', 'Aline', 'Vanessa', 'Daniela',
  'Bruna', 'Letícia', 'Mariana', 'Renata', 'Tatiane', 'Sandra', 'Cláudia',
  'Adriana', 'Priscila', 'Carla', 'Simone', 'Roberta', 'Débora', 'Luana',
  'Jéssica', 'Michele', 'Cristiane', 'Eliane', 'Rafaela', 'Gabriela', 'Larissa',
  'Andréa', 'Viviane', 'Rosângela', 'Márcia', 'Sônia', 'Elaine', 'Kelly',
  'Bianca', 'Natália', 'Amanda', 'Flávia', 'Isabela',
]

type Toast = { nome: string; key: number }

export function PurchaseNotifications({
  startedAt,
  pitchSegundos,
  cfg,
}: {
  startedAt: string
  pitchSegundos: number
  cfg: NotificacoesCompra
}) {
  const [toast, setToast] = useState<Toast | null>(null)

  // Agenda as notificações com base no tempo decorrido desde o início do vídeo
  useEffect(() => {
    if (!cfg.ativo) return
    const start = new Date(startedAt).getTime()
    const elapsed = Math.max(0, (Date.now() - start) / 1000)

    // Início: pitch + offset. Intervalo aleatório entre min e max.
    let firstAt = pitchSegundos + cfg.inicioAposPitchSegundos
    let gapMin = cfg.intervaloMinSegundos
    let gapMax = cfg.intervaloMaxSegundos

    // Overrides de teste na URL: ?notif=SEC (primeira) e ?notifgap=SEC (intervalo fixo)
    try {
      const q = new URLSearchParams(window.location.search)
      const n = q.get('notif')
      if (n !== null && !isNaN(Number(n))) firstAt = Number(n)
      const g = q.get('notifgap')
      if (g !== null && !isNaN(Number(g))) { gapMin = Number(g); gapMax = Number(g) }
    } catch { /* ignore */ }

    // Monta a agenda (timestamp + nome), sem repetir nome em sequência
    const schedule: { at: number; nome: string }[] = []
    let t = firstAt
    let last = ''
    for (let i = 0; i < cfg.total; i++) {
      let nome = NOMES[Math.floor(Math.random() * NOMES.length)]
      if (nome === last) nome = NOMES[(NOMES.indexOf(nome) + 1) % NOMES.length]
      last = nome
      schedule.push({ at: t, nome })
      t += gapMin + Math.random() * (gapMax - gapMin)
    }

    // Agenda só as futuras — reload no meio não despeja as que já passaram
    let key = 0
    const timers = schedule
      .filter(s => s.at > elapsed)
      .map(s => setTimeout(() => setToast({ nome: s.nome, key: key++ }), (s.at - elapsed) * 1000))
    return () => timers.forEach(clearTimeout)
  }, [startedAt, pitchSegundos, cfg])

  // Cada toast some sozinho depois de 5s
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  if (!toast) return null

  return (
    <div className="absolute bottom-3 left-3 z-30 pointer-events-none max-w-[78%]">
      <style>{`
        @keyframes notifSlideIn {
          0%   { opacity: 0; transform: translateX(-16px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div
        key={toast.key}
        className="flex items-center gap-2.5 rounded-xl py-2 pl-2 pr-3.5"
        style={{
          background: 'rgba(15,15,15,0.92)',
          border: '1px solid rgba(245,158,11,0.45)',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          animation: 'notifSlideIn 0.4s ease-out',
        }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#22c55e' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[13px] font-bold text-white truncate">{toast.nome}</span>
          <span className="text-[11px] text-white/70 leading-snug">acabou de adquirir {cfg.produtoLabel}</span>
        </div>
      </div>
    </div>
  )
}
