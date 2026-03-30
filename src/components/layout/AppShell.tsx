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
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-background/80backdrop-blur-xl border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-100 dark:ring-white/10">KG</div>
          <span className="font-bold text-sm tracking-tight text-foreground">{t('brand.appTitle')}</span>
        </div>
        <button
          type="button"
          className="p-2 -mr-2 rounded-xl text-muted hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label={t('shell.openMenu')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>
      </div>

      {header && <div className="hidden md:block flex-none">{header}</div>}

      <div className="flex flex-1 overflow-hidden relative z-10">
        {showSidebar && (
          <>
            {mobileSidebarOpen && (
              <button
                type="button"
                className="md:hidden fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label={t('shell.closeMenu')}
              />
            )}
            <aside
              className={[
                'md:hidden fixed inset-y-0 left-0 z-50 w-[84vw] max-w-[320px] bg-background shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
              ].join(' ')}
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-100">KG</div>
                  <span className="font-bold text-sm tracking-tight text-foreground">{t('brand.appTitle')}</span>
                </div>
                <button
                  type="button"
                  className="rounded-xl p-2 text-muted hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label={t('shell.closeMenu')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="h-[calc(100%-65px)] overflow-y-auto">{sidebar}</div>
            </aside>
          </>
        )}
        {showSidebar && (
          <aside
            className="hidden md:block transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] shrink-0 origin-left border-r border-border z-20 shadow-sm"
            style={{ width: sidebarWidth }}
          >
            {sidebar}
          </aside>
        )}

        <main className="flex-1 overflow-y-auto relative perspective-1000 bg-background/50">
          <div className="min-h-full transition-transform duration-500 transform-style-3d bg-transparent">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
