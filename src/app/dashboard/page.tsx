'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
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

    // Profile must exist after hydration; otherwise session is invalid for app use.
    if (!profile?.role) {
      router.replace('/unauthorized')
      return
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
