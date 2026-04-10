import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import ClientAuthHydrator from '@/components/common/ClientAuthHydrator'
import { ToastHost } from '@/components/common/ToastHost'
import { I18nProvider } from '@/i18n/I18nProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  weight: ['500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Kid Cloud',
  description: 'Multi-tenant daycare management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${inter.className} min-h-screen antialiased bg-background text-foreground`}
      >
        <I18nProvider>
          <ClientAuthHydrator />
          <ToastHost />
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
