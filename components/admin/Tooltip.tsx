'use client'
import { useState } from 'react'
import { Info } from 'lucide-react'

export function InfoTip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex">
      <button type="button" aria-label="Ajuda" className="admin-muted hover:admin-text"
        onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)} onBlur={() => setShow(false)}>
        <Info size={14} />
      </button>
      {show && (
        <span role="tooltip" className="absolute left-5 top-1/2 -translate-y-1/2 z-50 w-56 rounded-lg px-3 py-2 text-[12px] admin-card shadow-xl"
          style={{ color: 'var(--admin-text)' }}>
          {text}
        </span>
      )}
    </span>
  )
}
