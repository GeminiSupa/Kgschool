'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.settings'

import React from 'react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
export default function AdminSettingsPage() {
  const { t } = useI18n()

  const environment = process.env.NODE_ENV || 'development'

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10">
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Konfigurieren Sie globale Parameter und verwalten Sie Ihr Profil.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* System & Global Config */}
        <IOSCard className="p-8 border-border shadow-sm">
            <h3 className="text-[10px] font-black text-ui-soft uppercase tracking-widest mb-6">System & Globale Konfiguration</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-slate-50/80 dark:bg-white/5 group cursor-not-allowed">
                    <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">Kita Stammdaten</p>
                        <p className="text-[10px] font-bold text-ui-soft">Name, Adresse, Logo der Einrichtung</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-black text-ui-soft">DEMO ONLY</span>
                </div>
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-slate-50/80 dark:bg-white/5 group cursor-not-allowed">
                    <div className="min-w-0">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">Benachrichtigungen</p>
                        <p className="text-[10px] font-bold text-ui-soft">E-Mail & Push-Einstellungen für Eltern</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-black text-ui-soft">AUTO</span>
                </div>
            </div>
        </IOSCard>

        {/* Account Settings */}
        <IOSCard className="p-8 border-border shadow-sm">
            <h3 className="text-[10px] font-black text-ui-soft uppercase tracking-widest mb-6">Persönliche Einstellungen</h3>
            <Link href="/profile" className="block p-5 rounded-2xl border border-border bg-card dark:bg-white/5 hover:border-(--aura-primary)/35 hover:shadow-xl hover:shadow-black/5 transition-all group">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-aura-primary text-white flex items-center justify-center text-xs font-black italic shadow-lg shadow-black/10">👤</div>
                        <div>
                            <p className="text-sm font-black text-slate-900 dark:text-slate-50 group-hover:text-aura-primary transition-colors">Profil verwalten</p>
                            <p className="text-[10px] font-bold text-ui-soft">Name, E-Mail und Passwort ändern</p>
                        </div>
                    </div>
                    <span className="text-lg opacity-30 group-hover:translate-x-1 group-hover:opacity-100 transition-all">→</span>
                </div>
            </Link>
        </IOSCard>

        <IOSCard className="p-8 border-border shadow-sm">
          <h3 className="text-[10px] font-black text-ui-soft uppercase tracking-widest mb-6">Hilfe & Dokumentation</h3>
          <Link
            href="/docs"
            className="block p-5 rounded-2xl border border-border bg-card dark:bg-white/5 hover:border-(--aura-primary)/35 hover:shadow-xl hover:shadow-black/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-500/20">
                  MD
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-slate-50 group-hover:text-aura-primary transition-colors">
                    Handbuch & Präsentation
                  </p>
                  <p className="text-[10px] font-bold text-ui-soft">
                    Markdown-Dateien herunterladen (PDF / Folien)
                  </p>
                </div>
              </div>
              <span className="text-lg opacity-30 group-hover:translate-x-1 group-hover:opacity-100 transition-all">→</span>
            </div>
          </Link>
        </IOSCard>

        {/* Application Info */}
        <div className="p-10 rounded-[40px] text-white relative overflow-hidden flex flex-col items-center text-center bg-zinc-950 border border-white/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" aria-hidden />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" aria-hidden />
            
            <div className="relative z-10">
                <p className="text-[10px] font-black text-white/55 uppercase tracking-[4px] mb-4">Application Environment</p>
                <h4 className="text-3xl font-black mb-2">Kid Cloud v1.0.0</h4>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" aria-hidden />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/75">{environment} mode</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
