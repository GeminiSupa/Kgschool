'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.todo'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useDailyReportsStore } from '@/stores/dailyReports'
import { useAttendanceStore } from '@/stores/attendance'
import { useMessagesStore } from '@/stores/messages'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'

export default function TeacherTodoPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { dailyReports, fetchDailyReports } = useDailyReportsStore()
  const { attendance, fetchAttendance } = useAttendanceStore()
  const { messages, fetchMessages } = useMessagesStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTodoData() {
      try {
        if (!profile?.id) return
        const today = new Date().toISOString().split('T')[0]
        await Promise.all([
          fetchDailyReports(undefined, today),
          fetchAttendance(undefined, today),
          fetchMessages(profile.id)
        ])
      } catch (e) {
        console.error('Error loading todo data:', e)
      } finally {
        setLoading(false)
      }
    }
    loadTodoData()
  }, [fetchDailyReports, fetchAttendance, fetchMessages, profile?.id])

  const pendingTasks = useMemo(() => {
    const tasks = []

    // 1. Daily Report Task
    const hasReportToday = dailyReports.length > 0
    if (!hasReportToday) {
      tasks.push({
        id: 'report-today',
        title: 'Tagesbericht erstellen',
        description: 'Der heutige Bericht für Ihre Gruppe fehlt noch.',
        icon: '📄',
        category: 'pedagogical',
        link: '/teacher/daily-reports/new',
        priority: 'high'
      })
    }

    // 2. Attendance Task
    const missingCheckOut = attendance.some(a => a.status === 'present' && !a.check_out_time)
    if (missingCheckOut) {
        tasks.push({
            id: 'attendance-checkout',
            title: 'Check-out ausstehen',
            description: 'Einige Kinder wurden noch nicht ausgecheckt.',
            icon: '✅',
            category: 'admin',
            link: '/teacher/attendance',
            priority: 'medium'
        })
    }

    // 3. Unread Messages Task
    const unreadCount = messages.filter(m => !m.read_at && m.recipient_id === profile?.id).length
    if (unreadCount > 0) {
        tasks.push({
            id: 'unread-messages',
            title: `${unreadCount} neue Nachrichten`,
            description: 'Sie haben ungelesene Nachrichten von Eltern oder Admin.',
            icon: '💬',
            category: 'communication',
            link: '/teacher/messages',
            priority: 'low'
        })
    }

    return tasks
  }, [dailyReports, attendance, messages, profile])

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10">
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Hier finden Sie alle anstehenden Aufgaben und Erinnerungen für heute.</p>
      </div>

      {pendingTasks.length === 0 ? (
        <IOSCard className="p-20 text-center bg-green-50/20 border-green-100/50 shadow-none">
            <div className="text-6xl mb-6">🎉</div>
            <p className="text-lg font-black text-green-800">Alles erledigt!</p>
            <p className="text-sm text-green-600/60 mt-2 font-bold uppercase tracking-widest">Genießen Sie Ihren Feierabend.</p>
        </IOSCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            {pendingTasks.map(task => (
                <Link key={task.id} href={task.link}>
                    <IOSCard className={`p-0 overflow-hidden group hover:scale-[1.01] transition-all duration-300 border-black/5 hover:shadow-2xl hover:shadow-indigo-500/10`}>
                        <div className="flex">
                            <div className={`w-2 ${
                                task.priority === 'high' ? 'bg-red-500' :
                                task.priority === 'medium' ? 'bg-amber-500' :
                                'bg-blue-500'
                            }`}></div>
                            <div className="p-6 flex items-center justify-between flex-1">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl shadow-inner group-hover:bg-black group-hover:text-white transition-all duration-500">
                                        {task.icon}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 uppercase tracking-tight leading-none">{task.title}</h3>
                                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded border ${
                                                task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                                                task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                'bg-blue-50 text-blue-600 border-blue-100'
                                            }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-ui-soft">{task.description}</p>
                                    </div>
                                </div>
                                <span className="text-2xl opacity-10 group-hover:opacity-100 group-hover:translate-x-2 transition-all">→</span>
                            </div>
                        </div>
                    </IOSCard>
                </Link>
            ))}
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-black/5">
        <h4 className="text-[10px] font-black text-black/20 uppercase tracking-[4px] mb-6">Demnächst anstehend</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-gray-50/50 border border-black/5 rounded-[32px] flex items-center gap-4 opacity-40">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs">📔</div>
                <p className="text-xs font-black text-ui-soft">Portfolio-Einträge (Woche)</p>
            </div>
            <div className="p-6 bg-gray-50/50 border border-black/5 rounded-[32px] flex items-center gap-4 opacity-40">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs">👶</div>
                <p className="text-xs font-black text-ui-soft">Beobachtungsbogen (Monat)</p>
            </div>
        </div>
      </div>
    </div>
  )
}
