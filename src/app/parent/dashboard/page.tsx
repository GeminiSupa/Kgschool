'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useMessagesStore } from '@/stores/messages'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSStatCard } from '@/components/common/IOSStatCard'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'
import { pT } from '@/i18n/pT'
import { MiniLineChart, type MiniLinePoint } from '@/components/dashboard/MiniLineChart'
import { getLastNDays } from '@/utils/dashboard/dateRange'

const ROUTE = 'parent.dashboard'

export default function ParentDashboardPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { unreadCount, fetchMessages } = useMessagesStore()
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [todayMenu, setTodayMenu] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [unreadTrend, setUnreadTrend] = useState<MiniLinePoint[]>([])

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user?.id])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Fetch children where this user is a parent
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*, groups(name)')
        .contains('parent_ids', [user?.id])
      
      if (childrenError) throw childrenError
      setMyChildren(children || [])

      // 2. Fetch messages to get unread count
      if (user?.id) {
        await fetchMessages(user.id, 'inbox')
      }

      // 7-day "new messages" trend (approx): count messages received per day
      if (user?.id) {
        const days = getLastNDays(7)
        const counts: number[] = []
        for (const d of days) {
          const { count: c } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .gte('created_at', `${d.key}T00:00:00.000Z`)
            .lt('created_at', `${d.key}T23:59:59.999Z`)
          counts.push(c || 0)
        }
        setUnreadTrend(days.map((d, i) => ({ xLabel: d.label, y: counts[i] ?? 0 })))
      }

      // 3. Fetch Today's Menu
      const today = new Date().toISOString().split('T')[0]
      const { data: menuData } = await supabase
        .from('lunch_menus')
        .select('*')
        .eq('date', today)
        .maybeSingle()
      
      setTodayMenu(menuData)
    } catch (e) {
      console.error('Error loading parent dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {t(pT(ROUTE))}
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">
            {t(pT(ROUTE, 'subtitle'))}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/parent/messages"
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/15 dark:shadow-indigo-900/40 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-background"
          >
            {t(pT(ROUTE, 'ctaInbox'))}
          </Link>
          <Link
            href="/parent/absences/new"
            className="px-6 py-3 bg-background text-slate-700 dark:text-slate-200 border border-border rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 focus:ring-offset-2 dark:focus:ring-offset-background"
          >
            {t(pT(ROUTE, 'qaAbsence'))}
          </Link>
        </div>
      </div>

      <div className="space-y-16">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <IOSStatCard
            title={t(pT(ROUTE, 'statMyChildren'))}
            value={myChildren.length}
            icon="👶"
          />
          <IOSStatCard
            title={t(pT(ROUTE, 'statUnread'))}
            value={unreadCount}
            icon="💬"
            trend={unreadCount > 0 ? { type: 'up', value: unreadCount.toString() } : undefined}
          />
          <IOSStatCard
            title={t(pT(ROUTE, 'statUpcoming'))}
            value={0}
            icon="📅"
          />
        </div>

        <IOSCard className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-ui-soft">{t(pT(ROUTE, 'statUnread'))}</h2>
            <Link href="/parent/messages" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300 hover:underline">
              {t('common.view')} →
            </Link>
          </div>
          <MiniLineChart data={unreadTrend} />
        </IOSCard>

        {/* Today's Menu Highlight */}
        {todayMenu && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-sm font-black text-orange-600 uppercase tracking-[0.2em]">{t(pT(ROUTE, 'sectionTodayMenu'))}</h2>
                <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            <Link href="/parent/lunch">
              <IOSCard className="p-0 overflow-hidden border-orange-100 bg-linear-to-br from-orange-50/50 to-white hover:shadow-2xl hover:shadow-orange-200/20 transition-all duration-500 group">
                <div className="flex flex-col md:flex-row">
                  {todayMenu.photo_url && (
                    <div className="md:w-64 h-48 md:h-auto relative overflow-hidden">
                      <img src={todayMenu.photo_url} alt={todayMenu.meal_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-linear-to-r from-orange-900/10 to-transparent" />
                    </div>
                  )}
                  <div className="p-8 flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-full">Mittagessen</span>
                      <span className="text-[10px] font-bold text-ui-soft uppercase tracking-widest">Heute, {new Date().toLocaleDateString('de-DE')}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-orange-600 transition-colors uppercase italic">{todayMenu.meal_name}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed line-clamp-2 max-w-2xl">{todayMenu.description || 'Keine Beschreibung vorhanden.'}</p>
                  </div>
                </div>
              </IOSCard>
            </Link>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Children - 8 cols */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em]">{t(pT(ROUTE, 'sectionMyChildren'))}</h2>
                <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            {myChildren.length === 0 ? (
              <IOSCard className="p-16 text-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
                <div className="text-4xl mb-4 opacity-20">🐣</div>
                <p className="text-slate-500 font-bold">{t(pT(ROUTE, 'emptyNoChildren'))}</p>
              </IOSCard>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {myChildren.map(child => (
                  <Link key={child.id} href={`/parent/children/${child.id}`} className="group">
                    <IOSCard className="p-8 hover:border-indigo-100 transition-all duration-500">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                          {child.first_name[0]}{child.last_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xl font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {child.first_name} {child.last_name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <p className="text-[10px] font-black text-ui-soft uppercase tracking-widest">
                              {child.groups?.name || t(pT(ROUTE, 'noGroup'))}
                            </p>
                          </div>
                        </div>
                        <div className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </IOSCard>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Access - 4 cols */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-sm font-black text-ui-soft uppercase tracking-[0.2em]">{t(pT(ROUTE, 'sectionQuickAccess'))}</h2>
                <div className="h-px flex-1 bg-slate-100"></div>
            </div>
            <IOSCard className="p-4 bg-slate-50/50 border-slate-50">
              <div className="grid gap-2">
                <QuickActionLink href="/parent/attendance" icon="✅" labelKey="qaAttendance" color="emerald" />
                <QuickActionLink href="/parent/daily-reports" icon="📄" labelKey="qaDailyReports" color="indigo" />
                <QuickActionLink href="/parent/messages" icon="💬" labelKey="qaMessages" color="sky" />
                <QuickActionLink href="/parent/lunch" icon="🍽️" labelKey="qaLunch" color="orange" />
                <QuickActionLink href="/parent/fees" icon="💰" labelKey="qaBilling" color="amber" />
                <QuickActionLink href="/parent/leave/new" icon="📝" labelKey="qaAbsence" color="rose" />
              </div>
            </IOSCard>

            <div className="mt-8">
               <IOSCard className="p-8 bg-linear-to-br from-indigo-900 to-indigo-800 border-0 text-white overflow-hidden relative group text-center">
                  <div className="absolute top-0 left-0 -ml-8 -mt-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                  <h4 className="text-xl font-black mb-2 relative z-10">School Calendar</h4>
                  <p className="text-indigo-100/70 text-sm mb-6 relative z-10 font-medium">{t(sT('parentCalendarTeaser'))}</p>
                  <Link href="/parent/calendar" className="inline-block w-full py-3 bg-white text-indigo-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/90 transition-all relative z-10">Check Schedule</Link>
               </IOSCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickActionLink({
  href,
  icon,
  labelKey,
  color,
}: {
  href: string
  icon: string
  labelKey: string
  color: string
}) {
  const { t } = useI18n()
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    pink: 'bg-pink-50 text-pink-600'
  }

  return (
    <Link href={href} className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-white transition-all duration-300 group">
      <div className={`w-10 h-10 flex items-center justify-center rounded-xl text-lg ${colorClasses[color] || 'bg-gray-100'} shadow-sm border border-black/5 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-slate-900 dark:group-hover:text-slate-50 transition-colors">
        {t(pT(ROUTE, labelKey))}
      </span>
      <div className="ml-auto text-gray-300 group-hover:text-ui-soft transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
