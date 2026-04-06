'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { clearCachedKitaId } from '@/utils/tenant/client'

export default function LogoutPage() {
  const setUser = useAuthStore((s) => s.setUser)
  const setProfile = useAuthStore((s) => s.setProfile)

  useEffect(() => {
    const doLogout = async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.signOut()
        if (error) console.error('[logout]', error)
      } finally {
        clearCachedKitaId()
        setUser(null)
        setProfile(null)
        // Full navigation so middleware sees cleared cookies (avoids SPA race → still “logged in”)
        if (typeof window !== 'undefined') {
          window.location.replace('/login')
        }
      }
    }
    void doLogout()
  }, [setProfile, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-ui-muted">Abmeldung...</p>
    </div>
  )
}

