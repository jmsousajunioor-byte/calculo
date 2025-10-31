import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cálculo Judiciário',
  description: 'App de cálculo judicial com INPC e juros',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen text-slate-800">
        <div className="max-w-5xl mx-auto p-6 md:p-10">
          {children}
        </div>
      </body>
    </html>
  )
}

