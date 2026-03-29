'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/utils/supabase/client'

export default function ClientAuthHydrator() {
  const { setUser, fetchProfile, user } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch of session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, supabase.auth])

  // Fetch profile whenever user ID changes
  useEffect(() => {
    if (user?.id) {
      fetchProfile()
    }
  }, [user?.id, fetchProfile])

  return null
}
