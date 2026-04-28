'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function SignupPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-linear-to-br from-aura-primary/10 to-aura-accent/15 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <IOSCard className="p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-2">Kontenerstellung eingeschränkt</h1>
            <p className="text-ui-muted">
              Benutzerkonten können aus Sicherheitsgründen nur von Administratoren erstellt werden.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Benötigen Sie ein Konto?</strong>
              <br />
              Bitte kontaktieren Sie Ihren Kindergarten-Administrator, um Ihr Konto zu erstellen. Er wird Ihnen
              die Anmeldedaten zur Verfügung stellen.
            </p>
          </div>

          <div className="space-y-3">
            <IOSButton variant="primary" size="large" className="w-full" onClick={() => router.push('/login')}>
              Zur Anmeldung
            </IOSButton>

            <Link href="/" className="block text-center text-ui-muted hover:text-aura-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--aura-primary)/25 rounded-md px-1">
              ← Zurück zur Startseite
            </Link>
            <div className="flex justify-center gap-4 text-xs text-ui-soft">
              <Link href="/privacy" className="hover:text-aura-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--aura-primary)/25 rounded-md px-1">
                Datenschutz
              </Link>
              <Link href="/imprint" className="hover:text-aura-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--aura-primary)/25 rounded-md px-1">
                Impressum
              </Link>
              <Link href="/security" className="hover:text-aura-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--aura-primary)/25 rounded-md px-1">
                Sicherheit
              </Link>
            </div>
          </div>
        </IOSCard>
      </div>
    </div>
  )
}

