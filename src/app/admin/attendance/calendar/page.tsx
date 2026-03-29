'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.attendance.calendar'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useGroupsStore, type Group } from '@/stores/groups'
import { useChildrenStore, type Child } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type AttendanceJoined = {
  id: string
  child_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'early_pickup' | string
  children: {
    first_name: string
    last_name: string
    group_id: string
  }
}

type LunchOrderJoined = {
  id: string
  child_id?: string
  status: string
  lunch_menus?: {
    date: string
  }
}

type AbsenceNotificationJoined = {
  id: string
  child_id?: string
  absence_date: string
  deadline_met: boolean
}

type CalendarRecord = {
  id: string
  childId: string
  childName: string
  status: string
}

type CalendarDay = {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  records: CalendarRecord[]
  hasLunchOrder: boolean
  hasInformedAbsence: boolean
  billable: boolean
}

export default function AdminAttendanceCalendarPage() {
  const { t } = useI18n()

  const supabase = useMemo(() => createClient(), [])

  const groupsStore = useGroupsStore()
  const childrenStore = useChildrenStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedChildId, setSelectedChildId] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())

  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  const groups: Group[] = groupsStore.groups
  const children: Child[] = childrenStore.children

  const currentMonthNum = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const filteredChildren = useMemo(() => {
    if (!selectedGroupId) return children
    return children.filter((c) => c.group_id === selectedGroupId)
  }, [children, selectedGroupId])

  const getMonthName = (monthNumber: number) => {
    const date = new Date(2000, monthNumber - 1, 1)
    return date.toLocaleString('default', { month: 'long' })
  }

  const loadCalendar = async () => {
    setLoading(true)
    setError('')

    try {
      const startDate = new Date(currentYear, currentMonthNum - 1, 1)
      const endDate = new Date(currentYear, currentMonthNum, 0)
      const startStr = startDate.toISOString().split('T')[0]
      const endStr = endDate.toISOString().split('T')[0]

      // Attendance
      let attendanceQuery = supabase
        .from('attendance')
        .select('*, children!inner(first_name, last_name, group_id)')
        .gte('date', startStr)
        .lte('date', endStr)

      if (selectedChildId) attendanceQuery = attendanceQuery.eq('child_id', selectedChildId)
      else if (selectedGroupId) attendanceQuery = attendanceQuery.eq('children.group_id', selectedGroupId)

      const { data: attendanceData, error: attendanceError } = await attendanceQuery
      if (attendanceError) throw attendanceError
      const attendance = (attendanceData || []) as AttendanceJoined[]

      // Lunch orders
      let ordersQuery = supabase
        .from('lunch_orders')
        .select('*, lunch_menus!inner(date), children!inner(id, group_id)')
        .gte('lunch_menus.date', startStr)
        .lte('lunch_menus.date', endStr)
        .neq('status', 'cancelled')

      if (selectedChildId) ordersQuery = ordersQuery.eq('child_id', selectedChildId)
      else if (selectedGroupId) ordersQuery = ordersQuery.eq('children.group_id', selectedGroupId)

      const { data: ordersData, error: ordersError } = await ordersQuery
      if (ordersError) throw ordersError
      const lunchOrders = (ordersData || []) as LunchOrderJoined[]

      // Absence notifications
      let absencesQuery = supabase
        .from('absence_notifications')
        .select('*, children!inner(id, group_id)')
        .gte('absence_date', startStr)
        .lte('absence_date', endStr)
        .eq('deadline_met', true)

      if (selectedChildId) absencesQuery = absencesQuery.eq('child_id', selectedChildId)
      else if (selectedGroupId) absencesQuery = absencesQuery.eq('children.group_id', selectedGroupId)

      const { data: absencesData, error: absencesError } = await absencesQuery
      if (absencesError) throw absencesError
      const absenceNotifications = (absencesData || []) as AbsenceNotificationJoined[]

      // Build calendar (6 weeks)
      const year = currentYear
      const monthIndex = currentMonthNum - 1
      const firstDay = new Date(year, monthIndex, 1)
      const startCalendarDate = new Date(firstDay)
      startCalendarDate.setDate(startCalendarDate.getDate() - startCalendarDate.getDay()) // Sunday start

      const days: CalendarDay[] = []
      const current = new Date(startCalendarDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < 42; i++) {
        const dateStr = current.toISOString().split('T')[0]
        const isCurrentMonth = current.getMonth() === monthIndex
        const isToday = current.getTime() === today.getTime()

        const dayRecords: CalendarRecord[] = attendance
          .filter((a) => a.date === dateStr)
          .map((a) => ({
            id: a.id,
            childId: a.child_id,
            childName: `${a.children.first_name} ${a.children.last_name}`,
            status: a.status,
          }))

        const dayOrders = lunchOrders.filter((o) => o.lunch_menus?.date === dateStr)
        const hasLunchOrder = dayOrders.length > 0

        const dayAbsences = absenceNotifications.filter((a) => a.absence_date === dateStr)
        const hasInformedAbsence = dayAbsences.length > 0

        let billable = false
        if (isCurrentMonth && current.getDay() !== 0 && current.getDay() !== 6) {
          billable = hasLunchOrder || dayRecords.some((r) => r.status === 'present')
        }

        days.push({
          date: dateStr,
          day: current.getDate(),
          isCurrentMonth,
          isToday,
          records: dayRecords,
          hasLunchOrder,
          hasInformedAbsence,
          billable,
        })

        current.setDate(current.getDate() + 1)
      }

      setCalendarDays(days)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load calendar'
      console.error('Error loading calendar:', e)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      await Promise.all([groupsStore.fetchGroups(), childrenStore.fetchChildren()])
      await loadCalendar()
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!groups.length && !children.length) return
    // When filters/month change, reload calendar
    loadCalendar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, selectedGroupId, selectedChildId])

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const currentMonth = () => {
    setCurrentDate(new Date())
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
        <div className="flex gap-2">
          <button
            onClick={previousMonth}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            ← Previous
          </button>
          <button
            onClick={nextMonth}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Next →
          </button>
          <button
            onClick={currentMonth}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Today
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-4 items-center">
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">All Groups</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        <select
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-gray-900"
        >
          <option value="">All Children</option>
          {filteredChildren.map((child) => (
            <option key={child.id} value={child.id}>
              {child.first_name} {child.last_name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-center">
              {getMonthName(currentMonthNum)} {currentYear}
            </h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => (
                <div
                  key={day.date}
                  className={[
                    'min-h-[100px] p-2 border border-gray-200 rounded',
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                    day.isToday ? 'ring-2 ring-blue-500' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={[
                        'text-sm font-medium',
                        day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                        day.isToday ? 'text-blue-600' : '',
                      ].join(' ')}
                    >
                      {day.day}
                    </span>
                    {day.billable && (
                      <span className="text-xs px-1 py-0.5 bg-green-100 text-green-700 rounded">
                        €
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {day.records.map((record) => {
                      const status =
                        record.status === 'present'
                          ? 'bg-green-100 text-green-800'
                          : record.status === 'absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'

                      return (
                        <div key={record.id} className={['text-xs p-1 rounded', status].join(' ')}>
                          {record.childName.substring(0, 8)}:{' '}
                          {record.status.substring(0, 1).toUpperCase() + record.status.substring(1)}
                        </div>
                      )
                    })}

                    {day.hasLunchOrder && (
                      <div className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded" title="Lunch order">
                        🍽️
                      </div>
                    )}

                    {day.hasInformedAbsence && (
                      <div
                        className="text-xs px-1 py-0.5 bg-purple-100 text-purple-700 rounded"
                        title="Informed absence (refundable)"
                      >
                        📝
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded" />
                <span>Late/Early Pickup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-1 py-0.5 bg-green-100 text-green-700 rounded">€</span>
                <span>Billable Day</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded">🍽️</span>
                <span>Lunch Order</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-1 py-0.5 bg-purple-100 text-purple-700 rounded">📝</span>
                <span>Informed Absence (Refundable)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

