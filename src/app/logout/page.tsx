'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useAuthStore } from '@/stores/auth'
import { clearCachedKitaId } from '@/utils/tenant/client'

export default function LogoutPage() {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const setProfile = useAuthStore((s) => s.setProfile)

  useEffect(() => {
    const doLogout = async () => {
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } finally {
        clearCachedKitaId()
        setUser(null)
        setProfile(null)
        router.replace('/login')
      }
    }
    void doLogout()
  }, [router, setProfile, setUser])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-ui-muted">Abmeldung...</p>
    </div>
  )
}

