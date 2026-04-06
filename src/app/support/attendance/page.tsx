'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useKita } from '@/hooks/useKita'
import { useAttendanceStore, type Attendance } from '@/stores/attendance'
import { useGroupsStore, type Group } from '@/stores/groups'
import type { Child } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { AttendanceBulkActions } from '@/components/attendance/AttendanceBulkActions'
import { CheckInOutButton } from '@/components/attendance/CheckInOutButton'
import { IOSCard } from '@/components/ui/IOSCard'
import { useI18n } from '@/i18n/I18nProvider'
import { fillTemplate, sT } from '@/i18n/sT'

export default function SupportAttendancePage() {
  const { t } = useI18n()
  const supabase = useMemo(() => createClient(), [])
  const { getUserKitaId } = useKita()

  const attendanceStore = useAttendanceStore()
  const groupsStore = useGroupsStore()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])

  const [children, setChildren] = useState<Child[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const attendanceMap = useMemo<Record<string, Attendance>>(() => {
    const map: Record<string, Attendance> = {}
    attendanceStore.attendance.forEach((a) => {
      map[a.child_id] = a
    })
    return map
  }, [attendanceStore.attendance])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError('')
      try {
        const kitaId = await getUserKitaId()

        // Load children + groups once
        let childrenQuery = supabase
          .from('children')
          .select('*')
          .eq('status', 'active')
          .order('first_name')

        if (kitaId) {
          childrenQuery = childrenQuery.eq('kita_id', kitaId)
        }

        const { data: childrenData, error: childrenErr } = await childrenQuery

        if (childrenErr) throw childrenErr
        setChildren((childrenData || []) as Child[])

        await groupsStore.fetchGroups(kitaId || undefined)
        setGroups(groupsStore.groups)

        // Initial attendance
        await attendanceStore.fetchAttendance(undefined, selectedDate)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : t(sT('errLoadAttendance'))
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        await attendanceStore.fetchAttendance(undefined, selectedDate)
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : t(sT('errLoadAttendance'))
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const getGroupName = (groupId?: string) => {
    if (!groupId) return ''
    return groups.find((g) => g.id === groupId)?.name || ''
  }

  const getAttendanceStatus = (childId: string) => attendanceMap[childId]?.status || ''
  const getCheckInTime = (childId: string) => attendanceMap[childId]?.check_in_time
  const getCheckOutTime = (childId: string) => attendanceMap[childId]?.check_out_time

  const enterBulkMode = () => {
    setBulkMode(true)
    setSelectedChildren([])
  }

  const exitBulkMode = () => {
    setBulkMode(false)
    setSelectedChildren([])
  }

  const toggleSelectAll = () => {
    if (selectedChildren.length === children.length && children.length > 0) {
      setSelectedChildren([])
    } else {
      setSelectedChildren(children.map((c) => c.id))
    }
  }

  const toggleChildSelection = (childId: string) => {
    setSelectedChildren((prev) => (prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]))
  }

  const clearSelection = () => setSelectedChildren([])

  const markAllPresent = async () => {
    if (selectedChildren.length === 0) return
    try {
      await attendanceStore.markBulkAttendance(selectedChildren, selectedDate, 'present')
      alert(
        fillTemplate(t(sT('successMarkedPresentBatch')), { count: selectedChildren.length })
      )
      setSelectedChildren([])
      await attendanceStore.fetchAttendance(undefined, selectedDate)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t(sT('errMarkBulkAttendance'))
      alert(message)
    }
  }

  const markPresent = async (childId: string) => {
    try {
      await attendanceStore.markAttendance({
        child_id: childId,
        date: selectedDate,
        status: 'present',
        check_in_time: new Date().toISOString(),
      })
      await attendanceStore.fetchAttendance(undefined, selectedDate)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t(sT('errMarkPresent'))
      alert(message)
    }
  }

  const markAbsent = async (childId: string) => {
    try {
      await attendanceStore.markAttendance({
        child_id: childId,
        date: selectedDate,
        status: 'absent',
      })
      await attendanceStore.fetchAttendance(undefined, selectedDate)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t(sT('errMarkAbsentStatus'))
      alert(message)
    }
  }

  const handleCheckIn = async (childId: string, date: string) => {
    try {
      await attendanceStore.checkIn(childId, date)
      await attendanceStore.fetchAttendance(undefined, date)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t(sT('errCheckIn'))
      alert(message)
    }
  }

  const handleCheckOut = async (childId: string, date: string) => {
    try {
      await attendanceStore.checkOut(childId, date)
      await attendanceStore.fetchAttendance(undefined, date)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t(sT('errCheckOut'))
      alert(message)
    }
  }

  return (
    <div>
      <Heading size="xl" className="mb-6">
        Take Attendance
      </Heading>

      <div className="mb-6 flex gap-4 items-center flex-wrap">
        <input
          value={selectedDate}
          type="date"
          onChange={(e) => setSelectedDate(e.target.value)}
          className="min-h-11 rounded-lg border-2 border-border bg-background px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        />

        {bulkMode ? (
          <button
            type="button"
            onClick={exitBulkMode}
            className="min-h-11 rounded-lg bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 dark:bg-slate-500 dark:hover:bg-slate-600"
          >
            Exit Bulk Mode
          </button>
        ) : (
          <button
            type="button"
            onClick={enterBulkMode}
            className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
          >
            Bulk Mode
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : (
        <IOSCard className="p-0 overflow-hidden">
          {children.length === 0 ? (
            <div className="p-8 text-center text-ui-soft">No active children found.</div>
          ) : (
            <>
              {bulkMode && (
                <AttendanceBulkActions
                  selectAll={selectedChildren.length === children.length && children.length > 0}
                  selectedCount={selectedChildren.length}
                  onToggleSelectAll={toggleSelectAll}
                  onMarkAllPresent={markAllPresent}
                  onClearSelection={clearSelection}
                />
              )}

              <div className="divide-y divide-border">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/5">
                    <div className="flex items-center gap-3 flex-1">
                      {bulkMode && (
                        <input
                          type="checkbox"
                          checked={selectedChildren.includes(child.id)}
                          onChange={() => toggleChildSelection(child.id)}
                          className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                        />
                      )}

                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-slate-50">
                          {child.first_name} {child.last_name}
                        </p>

                        {child.group_id && <p className="text-xs text-ui-soft mt-1">Group: {getGroupName(child.group_id) || 'Unassigned'}</p>}

                        {getCheckInTime(child.id) && (
                          <p className="text-xs text-blue-600 mt-1">
                            Check-in: {getCheckInTime(child.id) ? new Date(getCheckInTime(child.id) as string).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        )}

                        {getCheckOutTime(child.id) && (
                          <p className="text-xs text-orange-600 mt-1">
                            Check-out:{' '}
                            {new Date(getCheckOutTime(child.id) as string).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>

                    {!bulkMode && (
                      <div className="flex gap-2 items-start">
                        <CheckInOutButton
                          childId={child.id}
                          date={selectedDate}
                          checkInTime={getCheckInTime(child.id) as string | undefined}
                          checkOutTime={getCheckOutTime(child.id) as string | undefined}
                          onCheckIn={handleCheckIn}
                          onCheckOut={handleCheckOut}
                        />

                        <button
                          type="button"
                          onClick={() => markPresent(child.id)}
                          className={[
                            'min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50',
                            getAttendanceStatus(child.id) === 'present'
                              ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                              : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15',
                          ].join(' ')}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() => markAbsent(child.id)}
                          className={[
                            'min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50',
                            getAttendanceStatus(child.id) === 'absent'
                              ? 'bg-red-600 text-white dark:bg-red-500'
                              : 'bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15',
                          ].join(' ')}
                        >
                          Absent
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </IOSCard>
      )}
    </div>
  )
}

