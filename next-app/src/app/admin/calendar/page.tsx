'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

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

export default function AdminCalendarPage() {
  const { t } = useI18n()

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
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {t(pT(ROUTE))}
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">
            Manage your school calendar, track absences, and schedule important events.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
                onClick={() => setIsSlideOverOpen(true)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
          >
            Add New Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
            <IOSCard className="p-10 border-slate-50 shadow-xl shadow-slate-200/40">
                <div className="flex items-center justify-between mb-12">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{new Date(currentYear, currentMonth).toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</h3>
                    <div className="flex gap-4">
                        <button className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">←</button>
                        <button className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">→</button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                        <div key={d} className="text-center text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">{d}</div>
                    ))}
                    {calendarDays.map(day => {
                        const dayEvents = getEventsForDay(day)
                        return (
                            <div key={day} className="aspect-square bg-slate-50/50 rounded-3xl border border-slate-100 p-4 group hover:bg-white hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-100/40">
                                <span className="text-lg font-black text-slate-300 group-hover:text-indigo-600 transition-colors">{day}</span>
                                
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
            <IOSCard className="p-8 border-indigo-100 bg-indigo-50/20 shadow-none">
                <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Today's Absences
                </h4>
                <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-400 italic">No reported absences for today.</p>
                </div>
            </IOSCard>

            <IOSCard className="p-8 border-slate-50 shadow-xl shadow-slate-200/40">
                <h4 className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-8">Upcoming Events</h4>
                <div className="space-y-8">
                    {events.slice(0, 3).map(event => (
                        <div key={event.id} className="flex gap-6 items-center group cursor-pointer">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex flex-col items-center justify-center shrink-0 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                <span className="text-[9px] font-black opacity-40 uppercase">{new Date(event.start_date).toLocaleString('de-DE', { month: 'short' })}</span>
                                <span className="text-2xl font-black leading-none mt-1">{new Date(event.start_date).getDate()}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight truncate">{event.title}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">
                                    {new Date(event.start_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && (
                        <p className="text-xs font-bold text-slate-400 italic">No upcoming events scheduled.</p>
                    )}
                </div>
            </IOSCard>
        </div>
      </div>

      {/* Add Event SlideOver */}
      <SlideOver 
        isOpen={isSlideOverOpen} 
        onClose={() => setIsSlideOverOpen(false)} 
        title="Add New Calendar Event"
      >
        <form onSubmit={handleAddEvent} className="space-y-8">
            <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Title</label>
                <input 
                    type="text"
                    required
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="e.g. Summer Festival"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                    <input 
                        type="date"
                        required
                        value={newEvent.start_date}
                        onChange={e => setNewEvent({...newEvent, start_date: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                    <input 
                        type="date"
                        required
                        value={newEvent.end_date}
                        onChange={e => setNewEvent({...newEvent, end_date: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Type</label>
                <select 
                    value={newEvent.holiday_type}
                    onChange={e => setNewEvent({...newEvent, holiday_type: e.target.value as any})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all appearance-none"
                >
                    <option value="holiday">Holiday</option>
                    <option value="vacation">Vacation</option>
                    <option value="closure">Closure</option>
                    <option value="training">Training</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">Affects Billing</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Payment calculation impact</span>
                    </div>
                    <input 
                        type="checkbox"
                        checked={newEvent.affects_billing}
                        onChange={e => setNewEvent({...newEvent, affects_billing: e.target.checked})}
                        className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-100"
                    />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">Affects Attendance</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Tracking requirements</span>
                    </div>
                    <input 
                        type="checkbox"
                        checked={newEvent.affects_attendance}
                        onChange={e => setNewEvent({...newEvent, affects_attendance: e.target.checked})}
                        className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-100"
                    />
                </div>
            </div>

            <div className="pt-8">
                <button 
                    type="submit"
                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
                >
                    {calendarLoading ? 'Saving Event...' : 'Confirm & Add Event'}
                </button>
            </div>
        </form>
      </SlideOver>
    </div>
  )
}
