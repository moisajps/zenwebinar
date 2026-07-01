'use client'
import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

export function ThemeProviderClient({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      themes={['light', 'dark']}
      enableSystem={false}
      storageKey="admin-theme"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
