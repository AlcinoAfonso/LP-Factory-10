import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LP Factory 10',
  description: 'Fábrica de Landing Pages SaaS Multi-tenant',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
