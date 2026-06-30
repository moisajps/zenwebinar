'use client'

import { type Oferta } from './config-types'
import { trackAula, linkComUtm } from './track'

// ─── Drawer da oferta (estilo anúncio do YouTube — IMG_0920) ──────────────────
// Sobe cobrindo o chat. O X fecha e deixa o card fixo no rodapé.
export function OfferDrawer({ oferta, aulaDate, onClose }: { oferta: Oferta; aulaDate: string; onClose: () => void }) {
  const irParaLink = () => {
    trackAula(aulaDate, 'cta_click', { origem: 'drawer' })
    window.open(linkComUtm(oferta.link, aulaDate, 'drawer'), '_blank')
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col" style={{ background: '#0F0F0F' }}>
      {/* Animação de subida */}
      <style>{`
        @keyframes drawerUp {
          0%   { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col h-full" style={{ animation: 'drawerUp 0.32s cubic-bezier(0.16,1,0.3,1)' }}>
        {/* Barra superior: Patrocinado + ⋮ + X */}
        <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
          <span className="text-[13px]" style={{ color: '#AAAAAA' }}>{oferta.patrocinado}</span>
          <div className="flex items-center gap-3">
            <button className="opacity-50" aria-label="Mais opções">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#AAAAAA' }}>
                <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
              </svg>
            </button>
            <button onClick={onClose} aria-label="Fechar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8E8E8" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: 'none' }}>
          {/* Card da oferta */}
          <div className="rounded-2xl overflow-hidden">
            {/* Seção superior — banner full-bleed */}
            <img src={oferta.bannerImagem} alt="" className="w-full block" />

            {/* Seção inferior — escura, alinhada à esquerda */}
            <div className="px-5 py-7" style={{ background: '#272727' }}>
              <div className="flex items-center gap-3">
                <img
                  src={oferta.marcaLogo}
                  alt=""
                  className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                  style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                />
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-tight" style={{ color: '#FFFFFF' }}>
                    {oferta.marcaTitulo}
                  </p>
                  <p className="text-[13px] leading-tight mt-0.5" style={{ color: '#AAAAAA' }}>
                    {oferta.marca}
                  </p>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed mt-5" style={{ color: '#CCCCCC' }}>
                {oferta.descricao}
              </p>
              <button
                onClick={irParaLink}
                className="w-full mt-6 rounded-full py-3.5 font-bold text-[15px] transition-transform active:scale-[0.98]"
                style={{ background: '#FFFFFF', color: '#0F0F0F' }}
              >
                {oferta.cta}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Card fixo no rodapé do chat (estilo enquete fixada) ──────────────────────
export function OfferCard({ oferta, aulaDate }: { oferta: Oferta; aulaDate: string }) {
  const irParaLink = () => {
    trackAula(aulaDate, 'cta_click', { origem: 'card' })
    window.open(linkComUtm(oferta.link, aulaDate, 'card'), '_blank')
  }

  return (
    <div className="px-3 pb-2 flex-shrink-0">
      <div className="rounded-xl overflow-hidden" style={{ background: '#1F1F1F', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-3 pt-3 pb-3">
          {/* Logo alinhada ao título + marca */}
          <div className="flex items-center gap-2.5">
            <img
              src={oferta.marcaLogo}
              alt=""
              className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            />
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-tight" style={{ color: '#F1F1F1' }}>
                {oferta.marcaTitulo}
              </p>
              <p className="text-[12px] leading-tight mt-0.5" style={{ color: '#AAAAAA' }}>
                {oferta.marca}
              </p>
            </div>
          </div>
          {/* Chamada + preço, com mais espaço */}
          <div className="mt-3.5">
            <p className="text-[12px] leading-tight" style={{ color: '#AAAAAA' }}>
              {oferta.cardChamada}
            </p>
            <p className="text-[14px] font-bold leading-tight mt-1" style={{ color: '#F1F1F1' }}>
              {oferta.cardPreco}
            </p>
          </div>
        </div>
        <button
          onClick={irParaLink}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 font-bold text-[13px] transition-colors active:opacity-90"
          style={{ background: '#F59E0B', color: '#0F0F0F' }}
        >
          {oferta.cta}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  )
}
