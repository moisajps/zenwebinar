import type { ReactNode } from 'react'
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="admin-text w-full px-6 md:px-8 py-6 2xl:max-w-[1600px] 2xl:mx-auto">
      {children}
    </div>
  )
}
