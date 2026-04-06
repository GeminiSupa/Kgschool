'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.work'

import React, { useEffect, useState } from 'react'
import { useParentWorkStore, ParentWorkTask } from '@/stores/parentWork'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function ParentWorkPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { tasks, submissions, loading, fetchTasks, fetchSubmissions } = useParentWorkStore()
  
  useEffect(() => {
    if (profile?.kita_id) {
        fetchTasks('open', undefined, profile.kita_id)
        if (profile.id) fetchSubmissions(undefined, profile.id)
    }
  }, [profile, fetchTasks, fetchSubmissions])

  if (loading && tasks.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10 text-center">
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Übernehmen Sie Aufgaben und melden Sie Ihre Arbeitsstunden.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <IOSCard className="p-8 border-black/5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Geleistete Stunden</p>
                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-5xl font-black">12.5</span>
                    <span className="text-base font-black opacity-60 uppercase">Stunden</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span>Ziel: 20h / Jahr</span>
                    <span className="px-2 py-1 bg-white/20 rounded-lg">62% Erfüllt</span>
                </div>
            </IOSCard>

            <IOSCard className="p-8 border-black/5 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 text-black flex items-center justify-center text-xl mb-4 border border-black/5">✍️</div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 mb-2">Stunden melden</h3>
                <p className="text-xs text-ui-soft font-medium mb-6">Tragen Sie geleistete Arbeit hier ein.</p>
                <IOSButton className="w-full py-3 bg-black text-white border-none text-[10px] font-black uppercase tracking-widest">Jetzt melden</IOSButton>
            </IOSCard>
      </div>

      <h3 className="text-sm font-black text-black/20 uppercase tracking-widest mb-6 ml-4">Offene Aufgaben</h3>
      <div className="grid grid-cols-1 gap-4">
            {tasks.map(task => (
                <IOSCard key={task.id} className="p-8 border-black/5 hover:border-black/10 transition-all group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-lg font-black text-slate-900 dark:text-slate-50">{task.title}</h4>
                                <span className="px-2 py-1 bg-gray-50 text-ui-soft text-[9px] font-black uppercase rounded-md border border-black/5">{task.task_type}</span>
                            </div>
                            <p className="text-sm text-ui-soft font-medium line-clamp-2">{task.description}</p>
                        </div>
                        <IOSButton variant="secondary" className="px-8 py-3 text-[10px] font-black uppercase tracking-widest border-black/5 bg-gray-50 hover:bg-white text-black">Übernehmen</IOSButton>
                    </div>
                </IOSCard>
            ))}
      </div>
    </div>
  )
}
