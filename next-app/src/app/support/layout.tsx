'use client'

import React, { useState } from 'react'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useAuth } from '@/hooks/useAuth'

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, profile, loading } = useAuth()

  // Role protection for support routes
  if (!loading && (!user || profile?.role !== 'support')) {
    redirect('/dashboard')
  }

  return (
    <AppShell
      showSidebar={true}
      collapsed={collapsed}
      sidebar={<AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />}
    >
      <div className="p-4 md:p-8 space-y-8 animate-[fadeInUp_0.4s_cubic-bezier(0.4,0,0.2,1)]">
        {children}
      </div>
    </AppShell>
  )
}

