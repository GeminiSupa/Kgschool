'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { useAuth } from '@/hooks/useAuth'
import { MiniLineChart, type MiniLinePoint } from '@/components/dashboard/MiniLineChart'
import { getLastNDays } from '@/utils/dashboard/dateRange'

export default function SupportDashboardPage() {
  const supabase = createClient()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)

  const [totalChildren, setTotalChildren] = useState(0)
  const [todayAttendance, setTodayAttendance] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [attendanceTrend, setAttendanceTrend] = useState<MiniLinePoint[]>([])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)

        const today = new Date().toISOString().split('T')[0]

        const { count } = await supabase
          .from('children')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
        setTotalChildren(count || 0)

        const { count: attendanceCount } = await supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'present')
        setTodayAttendance(attendanceCount || 0)

        const days = getLastNDays(7)
        const counts: number[] = []
        for (const d of days) {
          const { count: c } = await supabase
            .from('attendance')
            .select('id', { count: 'exact', head: true })
            .eq('date', d.key)
            .eq('status', 'present')
          counts.push(c || 0)
        }
        setAttendanceTrend(days.map((d, i) => ({ xLabel: d.label, y: counts[i] ?? 0 })))

        if (user?.id) {
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .is('read_at', null)
          setUnreadMessages(unreadCount || 0)
        }

        const { data } = await supabase
          .from('attendance_logs')
          .select('*, attendance:attendance_id (child_id)')
          .gte('timestamp', today)
          .order('timestamp', { ascending: false })
          .limit(5)

        if (data) {
          setRecentActivity(
            data.map((log: any) => ({
              id: log.id,
              description: `Attendance ${log.action} recorded`,
              timestamp: log.timestamp,
            }))
          )
        } else {
          setRecentActivity([])
        }
      } catch (e) {
        console.error('Error loading dashboard:', e)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [supabase, user?.id])

  const formatTime = (time: string) => new Date(time).toLocaleString()

  return (
    <div>
      <Heading size="xl" className="mb-6">
        Support Staff Dashboard
      </Heading>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <IOSCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ui-muted">Total Children</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">{totalChildren}</p>
                </div>
                <span className="text-3xl">👶</span>
              </div>
            </IOSCard>

            <IOSCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ui-muted">Today's Attendance</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">{todayAttendance}</p>
                </div>
                <span className="text-3xl">✅</span>
              </div>
            </IOSCard>

            <IOSCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ui-muted">Unread Messages</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">{unreadMessages}</p>
                </div>
                <span className="text-3xl">💬</span>
              </div>
            </IOSCard>
          </div>

          <IOSCard className="p-6">
            <div className="flex items-center justify-between mb-3">
              <Heading size="md">Attendance trend</Heading>
              <Link href="/support/attendance" className="ui-micro-link">
                View →
              </Link>
            </div>
            <MiniLineChart data={attendanceTrend} />
          </IOSCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IOSCard className="p-6">
              <Heading size="md" className="mb-4">
                Quick Actions
              </Heading>
              <div className="space-y-2">
                <Link
                  href="/support/attendance"
                  className="ui-card-link rounded-xl bg-aura-primary/10 text-aura-primary dark:bg-aura-primary/15"
                >
                  ✅ Take Attendance
                </Link>
                <Link
                  href="/support/children"
                  className="ui-card-link rounded-xl bg-aura-primary/10 text-aura-primary dark:bg-aura-primary/15"
                >
                  👶 View Children
                </Link>
                <Link
                  href="/support/messages"
                  className="ui-card-link rounded-xl bg-aura-primary/10 text-aura-primary dark:bg-aura-primary/15"
                >
                  💬 Send Messages
                </Link>
                <Link
                  href="/support/reports"
                  className="ui-card-link rounded-xl bg-aura-primary/10 text-aura-primary dark:bg-aura-primary/15"
                >
                  📊 View Reports
                </Link>
              </div>
            </IOSCard>

            <IOSCard className="p-6">
              <Heading size="md" className="mb-4">
                Recent Activity
              </Heading>
              {recentActivity.length === 0 ? (
                <div className="text-ui-soft text-sm">No recent activity.</div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="rounded-xl border border-border/60 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-xs text-ui-soft mt-1">{formatTime(activity.timestamp)}</p>
                    </div>
                  ))}
                </div>
              )}
            </IOSCard>
          </div>
        </div>
      )}
    </div>
  )
}

