'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n/I18nProvider'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function DashboardRedirect() {
  const router = useRouter()
  const { t } = useI18n()
  const { profile, loading, user } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    // Profile can take a moment to appear right after sign-in / registration.
    // Retry hydration once before sending the user to /unauthorized.
    if (!profile?.role) {
      void useAuthStore.getState().fetchProfile()
      const timer = window.setTimeout(() => {
        const p = useAuthStore.getState().profile
        if (!p?.role) router.replace('/unauthorized')
      }, 1200)
      return () => window.clearTimeout(timer)
    }

    // Legacy / API-created rows may use `staff` — same app area as teachers.
    const role = profile.role === 'staff' ? 'teacher' : profile.role

    if (role === 'admin') router.replace('/admin/dashboard')
    else if (role === 'teacher') router.replace('/teacher/dashboard')
    else if (role === 'parent') router.replace('/parent/dashboard')
    else if (role === 'kitchen') router.replace('/kitchen/dashboard')
    else if (role === 'support') router.replace('/support/dashboard')
    else router.replace('/unauthorized')
  }, [profile, loading, user, router])

  return (
    <div className="flex h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-sm">
        <div className="mb-4 flex justify-center">
          <LoadingSpinner color="border-aura-indigo" />
        </div>
        <p className="text-muted text-sm font-medium">{t('common.loadingDashboard')}</p>
      </div>
    </div>
  )
}
