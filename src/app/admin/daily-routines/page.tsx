'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'
import { sT } from '@/i18n/sT'

const ROUTE = 'admin.daily-routines'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDailyRoutinesStore, DailyRoutine } from '@/stores/dailyRoutines'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function AdminDailyRoutinesPage() {
  const { t } = useI18n()

  const { dailyRoutines, loading, error, fetchDailyRoutines } = useDailyRoutinesStore()
  const { groups, fetchGroups } = useGroupsStore()
  
  const [selectedGroup, setSelectedGroup] = useState('')

  useEffect(() => {
    fetchDailyRoutines(selectedGroup || undefined)
    fetchGroups()
  }, [selectedGroup, fetchDailyRoutines, fetchGroups])

  if (loading && dailyRoutines.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
            {t(pT(ROUTE))}
          </h1>
          <p className="text-lg text-ui-muted font-medium max-w-2xl">{t(sT('dailyRoutinesListSubtitle'))}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/daily-routines/new">
            <IOSButton>{t(sT('createRoutine'))}</IOSButton>
          </Link>
        </div>
      </div>

      <div className="mb-10">
        <div className="relative inline-block w-full md:w-64">
            <select 
                value={selectedGroup} 
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="ui-select pl-6 pr-12 py-3 text-[11px] font-black uppercase tracking-widest appearance-none cursor-pointer"
            >
                <option value="">{t(sT('allGroups'))}</option>
                {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-ui-soft">
                ▼
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {dailyRoutines.map(routine => (
                <IOSCard key={routine.id} className="p-0 overflow-hidden group hover:border-aura-primary/20 transition-all duration-500">
                    <div className="p-8 flex items-center gap-8">
                        <div className="shrink-0 w-24 flex flex-col items-center justify-center p-4 bg-aura-primary/10 rounded-2xl border border-aura-primary/15 group-hover:bg-aura-primary group-hover:text-white transition-all duration-500 shadow-sm">
                            <span className="text-xs font-black uppercase tracking-tight opacity-60 mb-1">Start</span>
                            <span className="text-xl font-black">{routine.start_time}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-black text-foreground mb-1 group-hover:text-aura-primary transition-colors tracking-tight truncate">{routine.routine_name}</h3>
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="flex items-center gap-2 text-[10px] font-black text-ui-soft uppercase tracking-widest">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    {routine.location || 'Classroom'}
                                </span>
                                <span className="px-3 py-1 bg-slate-100/80 dark:bg-white/5 text-ui-soft text-[9px] font-black uppercase tracking-widest rounded-full">
                                    {routine.day_of_week === null ? 'Every Day' : `Day ${routine.day_of_week}`}
                                </span>
                            </div>
                        </div>

                        <div className="shrink-0">
                             <Link href={`/admin/daily-routines/edit/${routine.id}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-sm shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-all">
                                ✏️
                             </Link>
                        </div>
                    </div>
                </IOSCard>
            ))}
      </div>

      {dailyRoutines.length === 0 && !loading && (
        <IOSCard className="p-24 text-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
            <div className="text-6xl opacity-10 mb-6">📅</div>
            <p className="text-slate-500 font-bold text-xl">{t(sT('dailyRoutinesEmptyTitle'))}</p>
            <p className="text-ui-soft mt-2 font-medium">{t(sT('dailyRoutinesEmptyHint'))}</p>
        </IOSCard>
      )}
    </div>
  )
}
