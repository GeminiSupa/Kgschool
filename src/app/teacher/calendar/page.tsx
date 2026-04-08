'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.calendar'

import React, { useEffect, useState } from 'react'
import { useTeacherLeaveRequestsStore } from '@/stores/teacherLeaveRequests'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function TeacherCalendarPage() {
  const { t } = useI18n()

  const { leaveRequests: requests, fetchLeaveRequests: fetchRequests } = useTeacherLeaveRequestsStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
        await fetchRequests(undefined, 'approved')
        setLoading(false)
    }
    loadData()
  }, [fetchRequests])

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const calendarDays = Array.from({ length: daysInMonth(currentMonth, currentYear) }, (_, i) => i + 1)

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-10 text-center md:text-left">
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Eigene Abwesenheiten und Kita-Veranstaltungen.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
            <IOSCard className="p-8 border-black/5 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">{new Date(currentYear, currentMonth).toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</h3>
                    <div className="flex gap-2">
                        <button type="button" aria-label="Previous month" className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg text-xl text-ui-soft transition-colors hover:bg-slate-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50">‹</button>
                        <button type="button" aria-label="Next month" className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg text-xl text-ui-soft transition-colors hover:bg-slate-100 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50">›</button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-ui-soft uppercase tracking-widest py-2">{d}</div>
                    ))}
                    {calendarDays.map(day => (
                        <div key={day} className="aspect-square bg-slate-50/60 dark:bg-white/6 rounded-2xl border border-black/5 dark:border-white/10 p-2 group hover:border-[#667eea]/35 transition-all cursor-pointer relative overflow-hidden">
                            <span className="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">{day}</span>
                        </div>
                    ))}
                </div>
            </IOSCard>
        </div>

        <div className="space-y-6">
            <IOSCard className="p-6 border-black/5 bg-[#667eea]/5">
                <h4 className="text-[10px] font-black text-[#667eea]/40 uppercase tracking-widest mb-4">Urlaub & Abwesenheit</h4>
                <div className="space-y-4">
                    {requests.length === 0 ? (
                         <p className="text-[10px] font-black text-ui-soft italic">Keine geplanten Urlaube diesen Monat.</p>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="p-4 bg-white rounded-2xl border border-black/5 shadow-sm">
                                <p className="text-xs font-black text-slate-900 dark:text-slate-50">Urlaub genehmigt</p>
                                <p className="text-[10px] font-black text-[#667eea] uppercase mt-1">{new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()}</p>
                            </div>
                        ))
                    )}
                </div>
            </IOSCard>
        </div>
      </div>
    </div>
  )
}
