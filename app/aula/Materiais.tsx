// app/aula/Materiais.tsx
'use client'

import { useEffect, useState } from 'react'
import type { Materiais } from './config-types'

// Botão "Ver lista de materiais" + painel (bottom-sheet no mobile) com a lista.
// Usado na tela de espera e no replay.
export function MateriaisButton({ materiais }: { materiais: Materiais }) {
  const [open, setOpen] = useState(false)

  // Trava o scroll do body enquanto o painel está aberto
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Fecha no ESC
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 active:scale-[0.98] text-white/90 font-sans text-sm font-medium px-5 py-3 transition-all"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        Ver lista de materiais
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={materiais.titulo}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Painel */}
          <div className="relative w-full sm:max-w-md max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden border border-white/10 bg-[#161616] shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
              <div className="min-w-0">
                <p className="font-display text-lg text-white leading-tight">{materiais.titulo}</p>
                <p className="font-sans text-[11px] uppercase tracking-[2px] text-rose-300/80 mt-1">{materiais.subtitulo}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Lista */}
            <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
              {materiais.grupos.map((g) => (
                <div key={g.categoria}>
                  <p className="font-sans text-[11px] font-semibold uppercase tracking-[2px] text-amber-400/90 mb-2">
                    {g.categoria}
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {g.itens.map((item) => (
                      <li key={item} className="flex gap-2 text-[14px] leading-snug text-white/85">
                        <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-amber-400/70 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {g.nota && (
                    <p className="font-sans text-[12px] italic text-white/45 mt-1.5 pl-3.5 leading-snug">
                      {g.nota}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/10 flex-shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-full bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white font-sans text-sm font-medium py-3 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
