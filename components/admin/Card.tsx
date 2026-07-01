import type { ReactNode } from 'react'
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`admin-card rounded-xl p-4 ${className}`}>{children}</div>
}
