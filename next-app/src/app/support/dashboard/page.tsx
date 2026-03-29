'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { useAuth } from '@/hooks/useAuth'

export default function SupportDashboardPage() {
  const supabase = createClient()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)

  const [totalChildren, setTotalChildren] = useState(0)
  const [todayAttendance, setTodayAttendance] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

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
                  <p className="text-sm text-gray-600">Total Children</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalChildren}</p>
                </div>
                <span className="text-3xl">👶</span>
              </div>
            </IOSCard>

            <IOSCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Attendance</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{todayAttendance}</p>
                </div>
                <span className="text-3xl">✅</span>
              </div>
            </IOSCard>

            <IOSCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unread Messages</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{unreadMessages}</p>
                </div>
                <span className="text-3xl">💬</span>
              </div>
            </IOSCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IOSCard className="p-6">
              <Heading size="md" className="mb-4">
                Quick Actions
              </Heading>
              <div className="space-y-2">
                <Link
                  href="/support/attendance"
                  className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                >
                  ✅ Take Attendance
                </Link>
                <Link
                  href="/support/children"
                  className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                >
                  👶 View Children
                </Link>
                <Link
                  href="/support/messages"
                  className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                >
                  💬 Send Messages
                </Link>
                <Link
                  href="/support/reports"
                  className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
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
                <div className="text-gray-500 text-sm">No recent activity.</div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="p-3 bg-gray-50 rounded-md text-sm">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(activity.timestamp)}</p>
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

