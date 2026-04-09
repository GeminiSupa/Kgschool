'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'
import { sT } from '@/i18n/sT'

const ROUTE = 'admin.calendar'

import React, { useEffect, useState, useMemo } from 'react'
import { useLeaveRequestsStore } from '@/stores/leaveRequests'
import { useTeacherLeaveRequestsStore } from '@/stores/teacherLeaveRequests'
import { useCalendarStore, CalendarEvent } from '@/stores/calendar'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { SlideOver } from '@/components/ui/SlideOver'
import Link from 'next/link'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminCalendarPage() {
  const { t, lang } = useI18n()
  const calLocale = lang === 'de' ? 'de-DE' : lang === 'tr' ? 'tr-TR' : 'en-US'

  const { leaveRequests, fetchLeaveRequests } = useLeaveRequestsStore()
  const { leaveRequests: teacherRequests, fetchLeaveRequests: fetchTeacherRequests } = useTeacherLeaveRequestsStore()
  const { events, fetchEvents, addEvent, loading: calendarLoading } = useCalendarStore()
  const [loading, setLoading] = useState(true)
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    holiday_type: 'holiday' as const,
    affects_billing: true,
    affects_attendance: true,
    kita_id: null,
    is_recurring: false,
    recurring_pattern: null
  })

  useEffect(() => {
    async function loadData() {
        await Promise.all([
            fetchLeaveRequests(undefined, 'approved'),
            fetchTeacherRequests(undefined, 'approved'),
            fetchEvents()
        ])
        setLoading(false)
    }
    loadData()
  }, [fetchLeaveRequests, fetchTeacherRequests, fetchEvents])

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const calendarDays = Array.from({ length: daysInMonth(currentMonth, currentYear) }, (_, i) => i + 1)

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    await addEvent(newEvent)
    setIsSlideOverOpen(false)
    setNewEvent({
        title: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        holiday_type: 'holiday' as const,
        affects_billing: true,
        affects_attendance: true,
        kita_id: null,
        is_recurring: false,
        recurring_pattern: null
    })
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.start_date <= dateStr && e.end_date >= dateStr)
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">
            {t(pT(ROUTE))}
          </h1>
          <p className="text-lg text-ui-muted font-medium max-w-2xl">{t(sT('calendarSubtitle'))}</p>
        </div>
        <div className="flex gap-3">
          <IOSButton type="button" onClick={() => setIsSlideOverOpen(true)}>
            {t(sT('addNewEvent'))}
          </IOSButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
            <IOSCard className="p-10 border-slate-50 shadow-xl shadow-slate-200/40 dark:shadow-black/40">
                <div className="flex items-center justify-between mb-12">
                    <h3 className="text-3xl font-black text-foreground tracking-tight">
                      {new Date(currentYear, currentMonth).toLocaleString(calLocale, { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex gap-4">
                        <button type="button" className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-xl bg-slate-50 dark:bg-white/10 text-ui-soft transition-all shadow-sm hover:bg-indigo-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 dark:focus-visible:ring-indigo-500/40" aria-label="Previous month">←</button>
                        <button type="button" className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-xl bg-slate-50 dark:bg-white/10 text-ui-soft transition-all shadow-sm hover:bg-indigo-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 dark:focus-visible:ring-indigo-500/40" aria-label="Next month">→</button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                        <div key={d} className="text-center text-[11px] font-black text-ui-soft uppercase tracking-[0.2em] mb-4">{d}</div>
                    ))}
                    {calendarDays.map(day => {
                        const dayEvents = getEventsForDay(day)
                        return (
                            <div
                              key={day}
                              className="aspect-square bg-slate-50/60 dark:bg-white/6 rounded-3xl border border-slate-200/70 dark:border-white/10 p-4 group hover:bg-white dark:hover:bg-white/10 hover:border-indigo-200/60 dark:hover:border-indigo-400/30 transition-all cursor-pointer relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-100/40 dark:hover:shadow-indigo-900/20"
                            >
                                <span className="text-lg font-black text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                                  {day}
                                </span>
                                
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {dayEvents.map(e => (
                                        <div key={e.id} className="w-full h-1.5 rounded-full bg-indigo-500" title={e.title} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </IOSCard>
        </div>

        <div className="space-y-8">
            <IOSCard className="p-8 border-indigo-100/70 dark:border-indigo-400/20 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-none">
                <h4 className="text-[11px] font-black text-indigo-500 dark:text-indigo-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-300" />
                    {t(sT('todaysAbsences'))}
                </h4>
                <div className="space-y-4">
                    <p className="text-sm font-bold text-ui-soft italic">{t(sT('noAbsencesToday'))}</p>
                </div>
            </IOSCard>

            <IOSCard className="p-8 border-slate-50 shadow-xl shadow-slate-200/40 dark:shadow-black/40">
                <h4 className="text-[11px] font-black text-ui-soft uppercase tracking-widest mb-8">{t(sT('upcomingEvents'))}</h4>
                <div className="space-y-8">
                    {events.slice(0, 3).map(event => (
                        <div key={event.id} className="flex gap-6 items-center group cursor-pointer">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/8 flex flex-col items-center justify-center shrink-0 border border-slate-100 dark:border-white/10 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                <span className="text-[9px] font-black opacity-40 uppercase">
                                  {new Date(event.start_date).toLocaleString(calLocale, { month: 'short' })}
                                </span>
                                <span className="text-2xl font-black leading-none mt-1">{new Date(event.start_date).getDate()}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-black text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors tracking-tight truncate">{event.title}</p>
                                <p className="text-[10px] font-black text-ui-soft uppercase mt-1 tracking-widest">
                                    {new Date(event.start_date).toLocaleTimeString(calLocale, { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <p className="text-xs font-bold text-ui-soft italic">{t(sT('noUpcomingEvents'))}</p>
                    )}
                </div>
            </IOSCard>
        </div>
      </div>

      {/* Add Event SlideOver */}
      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        title={t(sT('addCalendarEventSlideTitle'))}
      >
        <form onSubmit={handleAddEvent} className="space-y-8">
            <div className="space-y-3">
                <label className="text-[11px] font-black text-ui-soft uppercase tracking-widest ml-1">{t(sT('eventTitleLabel'))}</label>
                <input 
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder={t(sT('eventTitlePlaceholder'))}
                    className="w-full min-h-11 px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-(--aura-primary)/25 outline-none transition-all"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-ui-soft uppercase tracking-widest ml-1">{t(sT('startDateLabel'))}</label>
                    <input 
                        type="date"
                        required
                        value={newEvent.start_date}
                        onChange={e => setNewEvent({...newEvent, start_date: e.target.value})}
                        className="w-full min-h-11 px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-(--aura-primary)/25 outline-none transition-all"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-ui-soft uppercase tracking-widest ml-1">{t(sT('endDateLabel'))}</label>
                    <input 
                        type="date"
                        required
                        value={newEvent.end_date}
                        onChange={e => setNewEvent({...newEvent, end_date: e.target.value})}
                        className="w-full min-h-11 px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-(--aura-primary)/25 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[11px] font-black text-ui-soft uppercase tracking-widest ml-1">Kategorie</label>
                <select 
                    value={newEvent.holiday_type}
                    onChange={e => setNewEvent({...newEvent, holiday_type: e.target.value as any})}
                    className="w-full min-h-11 px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-(--aura-primary)/25 outline-none transition-all appearance-none"
                >
                    <option value="holiday">{t(sT('eventTypeHoliday'))}</option>
                    <option value="vacation">{t(sT('eventTypeVacation'))}</option>
                    <option value="closure">{t(sT('eventTypeClosure'))}</option>
                    <option value="training">{t(sT('eventTypeTraining'))}</option>
                    <option value="other">{t(sT('eventTypeOther'))}</option>
                </select>
            </div>

            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{t(sT('affectsBilling'))}</span>
                        <span className="text-[10px] font-bold text-ui-soft uppercase mt-0.5">{t(sT('affectsBillingHint'))}</span>
                    </div>
                    <input 
                        type="checkbox"
                        checked={newEvent.affects_billing}
                        onChange={e => setNewEvent({...newEvent, affects_billing: e.target.checked})}
                        className="h-7 w-7 rounded-xl text-aura-primary focus:ring-(--aura-primary)/25"
                    />
                </div>
                <div className="flex items-center justify-between gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">{t(sT('affectsAttendance'))}</span>
                        <span className="text-[10px] font-bold text-ui-soft uppercase mt-0.5">{t(sT('affectsAttendanceHint'))}</span>
                    </div>
                    <input 
                        type="checkbox"
                        checked={newEvent.affects_attendance}
                        onChange={e => setNewEvent({...newEvent, affects_attendance: e.target.checked})}
                        className="h-7 w-7 rounded-xl text-aura-primary focus:ring-(--aura-primary)/25"
                    />
                </div>
            </div>

            <div className="pt-8">
                <button 
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                >
                    {calendarLoading ? t(sT('savingEvent')) : t(sT('confirmAddEvent'))}
                </button>
            </div>
        </form>
      </SlideOver>
    </div>
  )
}
