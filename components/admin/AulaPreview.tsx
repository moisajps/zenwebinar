'use client'

import type { AulaConfig } from '@/app/aula/config-types'
import { OfferCard } from '@/app/aula/Offer'

interface AulaPreviewProps {
  cfg: AulaConfig
}

export function AulaPreview({ cfg }: AulaPreviewProps) {
  const oferta = cfg.oferta

  return (
    <div className="flex flex-col gap-2">
      <p className="admin-muted text-xs">Pré-visualização (estático)</p>

      {/* Preview frame — always dark */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--admin-border)', background: '#0F0F0F' }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ background: '#0F0F0F', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* AO VIVO badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: '#FF0000' }}
            />
            <span className="text-[11px] font-bold" style={{ color: '#FFFFFF' }}>
              AO VIVO
            </span>
          </div>

          {/* Title */}
          <p
            className="text-[11px] truncate ml-3 text-right flex-1"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            {cfg.titulo || 'Sem título'}
          </p>
        </div>

        {/* Video placeholder — 16:9 */}
        <div
          className="relative w-full flex items-center justify-center"
          style={{ aspectRatio: '16/9', background: '#1a1a1a' }}
        >
          {/* Play triangle */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="16,10 16,38 38,24"
              fill="rgba(255,255,255,0.2)"
            />
          </svg>
        </div>

        {/* Chat / offer area */}
        <div style={{ background: '#0F0F0F' }}>
          {oferta?.ativo === true ? (
            <div style={{ pointerEvents: 'none' }} aria-hidden>
              <OfferCard oferta={oferta} aulaDate="preview" />
            </div>
          ) : (
            <p
              className="text-xs text-center py-4"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              Oferta desligada — ative em Oferta →
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
