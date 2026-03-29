'use client'

import React, { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useAuth } from '@/hooks/useAuth'
import { redirect } from 'next/navigation'

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const { user, profile, loading } = useAuth()

  // Basic parent role protection
  if (!loading && (!user || profile?.role !== 'parent')) {
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
