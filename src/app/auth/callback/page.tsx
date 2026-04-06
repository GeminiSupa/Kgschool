'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useAuthStore, type Profile } from '@/stores/auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()
  const authStore = useAuthStore()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        // Give Supabase a moment to hydrate session after redirect
        await new Promise((resolve) => setTimeout(resolve, 200))

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('Callback - User error:', userError)
          router.push('/login')
          return
        }

        const currentUser = user
        authStore.setUser(currentUser)

        // Fetch profile with a small retry (mirrors Nuxt behavior)
        let profile: Profile | null = null
        let lastProfileError: unknown = null
        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          if (!error && data) {
            profile = data as Profile
            break
          }

          lastProfileError = error
          if (i < 4) await new Promise((resolve) => setTimeout(resolve, 250))
        }

        if (!profile) {
          // Try to create a basic profile if missing
          const email = currentUser.email || ''
          const fullName = email ? email.split('@')[0] || 'User' : 'User'
          const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: currentUser.id,
              email,
              full_name: fullName,
              role: 'parent',
            })
            .select()
            .single()

          if (createError || !created) {
            console.error('Callback - Could not create profile:', createError || lastProfileError)
            router.push('/login')
            return
          }

          profile = created as Profile
        }

        authStore.setProfile(profile)

        // Attempt refresh if we have a refresh token (non-critical)
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session?.refresh_token) {
            const { error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) console.warn('Callback - Could not refresh session:', refreshError.message)
          }
        } catch (refreshErr: unknown) {
          const message = refreshErr instanceof Error ? refreshErr.message : String(refreshErr)
          console.warn('Callback - Session refresh error (non-critical):', message)
        }

        const role = profile?.role
        if (role === 'admin') router.replace('/admin/dashboard')
        else if (role === 'teacher') router.replace('/teacher/dashboard')
        else if (role === 'parent') router.replace('/parent/dashboard')
        else if (role === 'kitchen') router.replace('/kitchen/dashboard')
        else if (role === 'support') router.replace('/support/dashboard')
        else router.replace('/login')
      } catch (e) {
        console.error('Callback error:', e)
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [router, supabase, authStore])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        {loading && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />}
        <p className="text-ui-muted">Loading...</p>
      </div>
    </div>
  )
}

