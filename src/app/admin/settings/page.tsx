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
        <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Konfigurieren Sie globale Parameter und verwalten Sie Ihr Profil.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* System & Global Config */}
        <IOSCard className="p-8 border-black/5 shadow-sm">
            <h3 className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-6">System & Globale Konfiguration</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-black/5 group cursor-not-allowed">
                    <div>
                        <p className="text-sm font-black text-gray-800">Kita Stammdaten</p>
                        <p className="text-[10px] font-bold text-gray-400">Name, Adresse, Logo der Einrichtung</p>
                    </div>
                    <span className="text-[10px] font-black text-gray-300">DEMO ONLY</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-black/5 group cursor-not-allowed">
                    <div>
                        <p className="text-sm font-black text-gray-800">Benachrichtigungen</p>
                        <p className="text-[10px] font-bold text-gray-400">E-Mail & Push-Einstellungen für Eltern</p>
                    </div>
                    <span className="text-[10px] font-black text-gray-300">AUTO</span>
                </div>
            </div>
        </IOSCard>

        {/* Account Settings */}
        <IOSCard className="p-8 border-black/5 shadow-sm">
            <h3 className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-6">Persönliche Einstellungen</h3>
            <Link href="/profile" className="block p-5 bg-white border border-black/5 rounded-2xl hover:border-[#667eea]/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#667eea] text-white flex items-center justify-center text-xs font-black italic shadow-lg shadow-indigo-500/20">👤</div>
                        <div>
                            <p className="text-sm font-black text-gray-900 group-hover:text-[#667eea] transition-colors">Profil verwalten</p>
                            <p className="text-[10px] font-bold text-gray-400">Name, E-Mail und Passwort ändern</p>
                        </div>
                    </div>
                    <span className="text-lg opacity-30 group-hover:translate-x-1 group-hover:opacity-100 transition-all">→</span>
                </div>
            </Link>
        </IOSCard>

        <IOSCard className="p-8 border-black/5 shadow-sm">
          <h3 className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-6">Hilfe & Dokumentation</h3>
          <Link
            href="/docs"
            className="block p-5 bg-white border border-black/5 rounded-2xl hover:border-[#667eea]/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-slate-500/20">
                  MD
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900 group-hover:text-[#667eea] transition-colors">
                    Handbuch & Präsentation
                  </p>
                  <p className="text-[10px] font-bold text-gray-400">
                    Markdown-Dateien herunterladen (PDF / Folien)
                  </p>
                </div>
              </div>
              <span className="text-lg opacity-30 group-hover:translate-x-1 group-hover:opacity-100 transition-all">→</span>
            </div>
          </Link>
        </IOSCard>

        {/* Application Info */}
        <div className="p-10 bg-black rounded-[40px] text-white relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full"></div>
            
            <div className="relative z-10">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-4">Application Environment</p>
                <h4 className="text-3xl font-black mb-2">KG School v1.0.0</h4>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{environment} mode</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
