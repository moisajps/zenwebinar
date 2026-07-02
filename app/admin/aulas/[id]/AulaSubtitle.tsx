'use client'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export function AulaSubtitle({ slug }: { slug: string }) {
  const href = `/aula/${slug}`
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.origin + href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono text-xs" style={{ color: 'var(--admin-muted)' }}>
        /aula/{slug}
      </span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir aula em nova aba"
        className="cursor-pointer inline-flex"
        style={{ color: 'var(--admin-muted)' }}
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
      <button
        aria-label="Copiar link da aula"
        onClick={handleCopy}
        className="cursor-pointer inline-flex"
        style={{ color: copied ? 'var(--admin-accent)' : 'var(--admin-muted)' }}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </span>
  )
}
