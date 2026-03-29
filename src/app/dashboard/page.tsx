'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardRedirect() {
  const router = useRouter()
  const { profile, loading, user } = useAuth()

  useEffect(() => {
    if (loading) return
    
    // If no user is logged in, useAuth middleware might catch it, but just in case:
    if (!user) {
      router.push('/login')
      return
    }

    const role = profile?.role
    if (role === 'admin') router.push('/admin/dashboard')
    else if (role === 'teacher') router.push('/teacher/dashboard')
    else if (role === 'parent') router.push('/parent/dashboard')
    else if (role === 'kitchen') router.push('/kitchen/dashboard')
    else if (role === 'support') router.push('/support/dashboard')
    else {
      // Fallback if role is missing or not fully loaded
      console.warn('No specific role found, staying on /dashboard')
    }
  }, [profile, loading, user, router])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Lade Dashboard...</p>
      </div>
    </div>
  )
}
