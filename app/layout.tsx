import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Webinar ao Vivo',
  description: 'Aula ao vivo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
