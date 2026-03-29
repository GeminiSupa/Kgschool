'use client'

import React, { useState } from 'react'
import { useI18n } from '@/i18n/I18nProvider'

interface AppShellProps {
  showSidebar?: boolean
  collapsed?: boolean
  header?: React.ReactNode
  sidebar?: React.ReactNode
  children: React.ReactNode
}

export function AppShell({
  showSidebar = true,
  collapsed = false,
  header,
  sidebar,
  children
}: AppShellProps) {
  const { t } = useI18n()
  const sidebarWidth = collapsed ? '80px' : '280px'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-background text-foreground transition-colors duration-500">
      {header && <div className="flex-none">{header}</div>}

      <div className="flex flex-1 overflow-hidden relative z-10">
        {showSidebar && (
          <>
            <button
              type="button"
              className="md:hidden fixed left-4 bottom-4 z-40 rounded-full bg-blue-600 text-white shadow-lg px-4 py-3 text-sm font-semibold"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label={t('shell.openMenu')}
            >
              {t('shell.openMenu')}
            </button>
            {mobileSidebarOpen && (
              <button
                type="button"
                className="md:hidden fixed inset-0 z-40 bg-black/40"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label={t('shell.closeMenu')}
              />
            )}
            <aside
              className={[
                'md:hidden fixed inset-y-0 left-0 z-50 w-[84vw] max-w-[320px] bg-background shadow-2xl transition-transform duration-300',
                mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
              ].join(' ')}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-700">{t('shell.navigation')}</p>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-gray-600 hover:bg-gray-100"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label={t('shell.closeMenu')}
                >
                  ✕
                </button>
              </div>
              <div className="h-[calc(100%-49px)] overflow-y-auto">{sidebar}</div>
            </aside>
          </>
        )}
        {showSidebar && (
          <aside
            className="hidden md:block transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] shrink-0 origin-left border-r border-slate-200 z-20 shadow-sm"
            style={{ width: sidebarWidth }}
          >
            {sidebar}
          </aside>
        )}

        <main className="flex-1 overflow-y-auto relative perspective-1000">
          <div className="min-h-full transition-transform duration-500 transform-style-3d bg-transparent">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
