'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.calendar'

import React, { useEffect, useState } from 'react'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function ParentCalendarPage() {
  const { t } = useI18n()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [])

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10 text-center">
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Wichtige Ereignisse und Schließfächer Ihrer Kita.</p>
      </div>

      <div className="space-y-8">
            <h3 className="text-sm font-black text-ui-soft uppercase tracking-widest ml-4">Anstehende Termine</h3>
            
            <div className="space-y-4">
                <IOSCard className="p-6 border-black/5 flex gap-6 hover:shadow-xl transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center shrink-0 border border-indigo-100/50 shadow-lg shadow-indigo-500/5">
                        <span className="text-[9px] font-black uppercase">Apr</span>
                        <span className="text-xl font-black leading-none">12</span>
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-slate-50 mb-1">Sommerfest</h4>
                        <p className="text-sm text-ui-soft font-medium">Gemeinsames Grillen im Garten mit allen Eltern und Kindern.</p>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">🕒 14:00 - 18:00 Uhr</p>
                    </div>
                </IOSCard>

                <IOSCard className="p-6 border-black/5 flex gap-6 hover:shadow-xl transition-all">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex flex-col items-center justify-center shrink-0 border border-amber-100/50 shadow-lg shadow-amber-500/5">
                        <span className="text-[9px] font-black uppercase">Mai</span>
                        <span className="text-xl font-black leading-none">01</span>
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-slate-50 mb-1">Kita geschlossen</h4>
                        <p className="text-sm text-ui-soft font-medium">Tag der Arbeit. Die Kita bleibt an diesem Tag geschlossen.</p>
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-2">📅 Ganztägig</p>
                    </div>
                </IOSCard>
            </div>
      </div>
    </div>
  )
}
