'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.parent-work'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParentWorkStore, ParentWorkTask } from '@/stores/parentWork'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function AdminParentWorkPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { tasks, submissions, loading, error, fetchTasks, fetchSubmissions } = useParentWorkStore()
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'submissions'>('tasks')

  useEffect(() => {
    if (profile?.kita_id) {
        fetchTasks(undefined, undefined, profile.kita_id)
        fetchSubmissions(undefined, undefined, profile.kita_id)
    }
  }, [profile, fetchTasks, fetchSubmissions])

  if (loading && tasks.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Verwalten Sie Arbeitsstunden und Aufgaben für Eltern.</p>
        </div>
        <Link href="/admin/parent-work/new">
          <IOSButton className="px-6 py-2.5 text-sm font-black uppercase tracking-widest bg-black text-white border-none shadow-xl shadow-black/10">
            ➕ Aufgabe ausschreiben
          </IOSButton>
        </Link>
      </div>

      <div className="mb-10 flex gap-2">
            <button 
                onClick={() => setActiveTab('tasks')}
                className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                    activeTab === 'tasks' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-ui-soft border-black/5 hover:border-black/10'
                }`}
            >
                Aufgaben
            </button>
            <button 
                onClick={() => setActiveTab('submissions')}
                className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                    activeTab === 'submissions' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-ui-soft border-black/5 hover:border-black/10'
                }`}
            >
                Stundenmeldungen
            </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
            {activeTab === 'tasks' ? (
                tasks.map(task => (
                    <IOSCard key={task.id} className="p-8 border-black/5 group relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 leading-tight">{task.title}</h3>
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-indigo-100/50">{task.task_type}</span>
                                </div>
                                <p className="text-sm text-ui-soft line-clamp-2 font-medium mb-4 max-w-2xl">{task.description}</p>
                                <div className="flex flex-wrap gap-x-8 gap-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-black/20 uppercase tracking-widest">Vergütung</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{task.hourly_rate}€ / h</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-black/20 uppercase tracking-widest">Status</span>
                                        <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">{task.status}</span>
                                    </div>
                                </div>
                            </div>
                            <Link href={`/admin/parent-work/${task.id}`}>
                              <IOSButton
                                variant="secondary"
                                className="px-8 py-3 text-[10px] font-black uppercase tracking-widest border-black/5 bg-gray-50 hover:bg-white text-black"
                              >
                                Details
                              </IOSButton>
                            </Link>
                        </div>
                    </IOSCard>
                ))
            ) : (
                submissions.map(sub => (
                    <IOSCard key={sub.id} className="p-8 border-black/5">
                         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 mb-1">Stundeneintrag</h3>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black text-black/30 uppercase tracking-widest">
                                    <span>📅 {new Date(sub.work_date).toLocaleDateString()}</span>
                                    <span className="text-[#667eea]">🕒 {sub.hours_worked} Stunden</span>
                                    <span className={`px-2 py-0.5 rounded ${sub.status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {sub.status}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {sub.status === 'pending' && <IOSButton className="px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-black text-white border-none">Genehmigen</IOSButton>}
                                <Link href={`/admin/parent-work/${sub.task_id}`} className="flex-1">
                                  <IOSButton variant="secondary" className="w-full px-6 py-2 text-[10px] font-black uppercase tracking-widest border-black/5 text-black">
                                    Details
                                  </IOSButton>
                                </Link>
                            </div>
                         </div>
                    </IOSCard>
                ))
            )}
      </div>
    </div>
  )
}
