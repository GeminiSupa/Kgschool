'use client'

import { useEffect, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { useAuthStore } from '@/stores/auth'
import { createClient } from '@/utils/supabase/client'

export default function ClientAuthHydrator() {
  const setUser = useAuthStore((s) => s.setUser)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let cancelled = false

    const applySession = async (sessionUser: User | null) => {
      if (!sessionUser) {
        setUser(null)
        return
      }
      setUser(sessionUser)
      await fetchProfile()
    }

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      await applySession(session?.user ?? null)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user ?? null)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [setUser, fetchProfile, supabase])

  return null
}
