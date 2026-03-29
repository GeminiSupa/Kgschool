'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { IOSStatCard } from '@/components/common/IOSStatCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.dashboard'

export default function TeacherDashboardPage() {
  const { t } = useI18n()

  const supabase = createClient()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  const [myGroups, setMyGroups] = useState<any[]>([])
  const [childrenCount, setChildrenCount] = useState(0)
  const [todayAttendance, setTodayAttendance] = useState(0)
  const [todayMenu, setTodayMenu] = useState<any>(null)

  useEffect(() => {
    async function fetchTeacherData() {
      if (!user?.id) return

      try {
        const { data: assignments, error: assignError } = await supabase
          .from('group_teachers')
          .select('*, groups(*)')
          .eq('teacher_id', user.id)
          .is('end_date', null)
          .order('start_date', { ascending: false })

        if (assignError) throw assignError

        const groupsWithCounts = await Promise.all(
          (assignments || []).map(async (assignment) => {
            const { count } = await supabase
              .from('children')
              .select('id', { count: 'exact', head: true })
              .eq('group_id', assignment.group_id)
              .eq('status', 'active')

            return {
              ...assignment,
              group: assignment.groups,
              childrenCount: count || 0
            }
          })
        )

        setMyGroups(groupsWithCounts)

        if (groupsWithCounts.length > 0) {
          const groupIds = groupsWithCounts.map((g) => g.group_id)
          
          const { count } = await supabase
            .from('children')
            .select('id', { count: 'exact', head: true })
            .in('group_id', groupIds)
            .eq('status', 'active')
          
          setChildrenCount(count || 0)

          const today = new Date().toISOString().split('T')[0]
          const { data: childrenData } = await supabase
            .from('children')
            .select('id')
            .in('group_id', groupIds)
            .eq('status', 'active')

          if (childrenData && childrenData.length > 0) {
            const childIds = childrenData.map((c) => c.id)
            const { count: attCount } = await supabase
              .from('attendance')
              .select('id', { count: 'exact', head: true })
              .eq('date', today)
              .in('child_id', childIds)
              .eq('status', 'present')
            
            setTodayAttendance(attCount || 0)
          }
        }

        // Fetch Today's Menu
        const today = new Date().toISOString().split('T')[0]
        const { data: menuData } = await supabase
          .from('lunch_menus')
          .select('*')
          .eq('date', today)
          .maybeSingle()
        
        setTodayMenu(menuData)
      } catch (error) {
        console.error('Error fetching teacher dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchTeacherData()
    }
  }, [supabase, user])

  return (
    <div className="max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
            {t(pT(ROUTE))}
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl">
            Welcome back! Here's what's happening in your groups today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/teacher/attendance" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            Take Attendance
          </Link>
          <Link href="/teacher/daily-reports/new" className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors">
            New Daily Report
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-16">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <IOSStatCard title={t(pT(ROUTE, 'statMyGroups'))} value={myGroups.length} icon="👪" />
            <IOSStatCard title={t(pT(ROUTE, 'statAssignedChildren'))} value={childrenCount} icon="👶" />
            <IOSStatCard title={t(pT(ROUTE, 'statTodayAttendance'))} value={todayAttendance} icon="✅" trend={{ type: 'up', value: '4%' }} />
          </div>

          {/* Today's Menu Highlight */}
          {todayMenu && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-sm font-black text-orange-600 uppercase tracking-[0.2em]">Heutiges Menü 🍽️</h2>
                  <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <Link href="/teacher/lunch">
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Heute, {new Date().toLocaleDateString('de-DE')}</span>
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
            {/* My Groups - 7 cols */}
            <div className="lg:col-span-7">
               <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em]">{t(pT(ROUTE, 'sectionMyGroups'))}</h2>
                  <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              {myGroups.length === 0 ? (
                <IOSCard className="p-12 text-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
                  <div className="text-4xl mb-4 opacity-20">🕊️</div>
                  <p className="text-slate-500 font-bold">{t(pT(ROUTE, 'noGroups'))}</p>
                </IOSCard>
              ) : (
                <div className="grid gap-4">
                  {myGroups.map((groupAssignment) => (
                    <Link
                      key={groupAssignment.group.id}
                      href={`/teacher/groups/${groupAssignment.group.id}`}
                      className="group"
                    >
                      <IOSCard className="p-6 hover:border-indigo-100 transition-all duration-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                               {groupAssignment.group.name[0]}
                            </div>
                            <div>
                              <p className="text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{groupAssignment.group.name}</p>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{groupAssignment.group.age_range}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm ${
                                groupAssignment.role === 'primary' ? 'bg-indigo-100 text-indigo-700' :
                                groupAssignment.role === 'assistant' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {groupAssignment.role === 'primary' ? 'Primary' : groupAssignment.role}
                            </span>
                            <p className="text-sm font-bold text-slate-500 mt-2">
                              {groupAssignment.childrenCount} {t(pT(ROUTE, 'childrenCount'))}
                            </p>
                          </div>
                        </div>
                      </IOSCard>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Access - 5 cols */}
            <div className="lg:col-span-5">
               <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{t(pT(ROUTE, 'sectionQuickAccess'))}</h2>
                  <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <IOSCard className="p-4 bg-slate-50/50 border-slate-50">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { href: '/teacher/children', icon: '👶', label: t(pT(ROUTE, 'qlChildren')), color: 'bg-blue-50 text-blue-600' },
                    { href: '/teacher/attendance', icon: '✅', label: t(pT(ROUTE, 'qlAttendance')), color: 'bg-emerald-50 text-emerald-600' },
                    { href: '/teacher/daily-reports', icon: '📄', label: t(pT(ROUTE, 'qlDailyReports')), color: 'bg-indigo-50 text-indigo-600' },
                    { href: '/teacher/observations', icon: '👁️', label: t(pT(ROUTE, 'qlObservations')), color: 'bg-pink-50 text-pink-600' },
                    { href: '/teacher/portfolios', icon: '📔', label: t(pT(ROUTE, 'qlPortfolios')), color: 'bg-amber-50 text-amber-600' },
                    { href: '/teacher/messages', icon: '💬', label: t(pT(ROUTE, 'qlMessages')), color: 'bg-sky-50 text-sky-600' },
                  ].map((item) => (
                    <Link key={item.href} href={item.href} className="group">
                      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center">
                        <span className={`text-xl mb-3 p-3 rounded-xl ${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </IOSCard>

              <div className="mt-8">
                 <IOSCard className="p-8 bg-linear-to-br from-slate-900 to-slate-800 border-0 text-white overflow-hidden relative group">
                    <div className="absolute bottom-0 right-0 -mr-6 -mb-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                    <h4 className="text-lg font-black mb-2 relative z-10">Teacher Toolkit</h4>
                    <p className="text-slate-400 text-sm mb-6 relative z-10">Everything you need to manage your classroom effectively.</p>
                    <Link href="/teacher/todo" className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-500 transition-colors relative z-10">View To-Do List</Link>
                 </IOSCard>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
