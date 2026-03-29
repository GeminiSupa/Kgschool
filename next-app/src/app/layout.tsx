import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientAuthHydrator from '@/components/common/ClientAuthHydrator'
import { ToastHost } from '@/components/common/ToastHost'
import { I18nProvider } from '@/i18n/I18nProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kita Management',
  description: 'Multi-tenant Kita Management Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased bg-gray-50 text-gray-900`}>
        <I18nProvider>
          <ClientAuthHydrator />
          <ToastHost />
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
