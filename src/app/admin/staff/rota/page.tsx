'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.staff.rota'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { sT } from '@/i18n/sT'

type GroupLite = { id: string; name: string }
type StaffLite = { id: string; full_name: string }

type StaffRotaEntry = {
  id: string
  staff_id: string
  group_id: string
  date: string
  start_time?: string | null
  end_time?: string | null
  is_absence: boolean
  absence_type?: 'sick' | 'vacation' | 'training' | 'other' | null
  replacement_staff_id?: string | null
  notes?: string | null
  created_at: string
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

function formatTime(time?: string | null) {
  if (!time) return ''
  return time.substring(0, 5)
}

function formatAbsenceType(type?: string | null) {
  const map: Record<string, string> = {
    sick: 'Sick',
    vacation: 'Vacation',
    training: 'Training',
    other: 'Other',
  }
  return map[type || ''] || 'Absence'
}

function getAbsenceClass(type?: string | null) {
  const classes: Record<string, string> = {
    sick: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
    vacation: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
    training: 'px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800',
    other: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
  }
  return classes[type || ''] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-slate-800 dark:text-slate-100'
}

export default function AdminStaffRotaPage() {
  const { t } = useI18n()

  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [groups, setGroups] = useState<GroupLite[]>([])
  const [staffList, setStaffList] = useState<StaffLite[]>([])
  const [groupsMap, setGroupsMap] = useState<Record<string, string>>({})
  const [staffMap, setStaffMap] = useState<Record<string, string>>({})

  const [rota, setRota] = useState<StaffRotaEntry[]>([])

  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')

  const loadGroups = async () => {
    const { data, error: gErr } = await supabase
      .from('groups')
      .select('id, name')
      .order('name')

    if (gErr) throw gErr
    const list = (data || []) as GroupLite[]
    setGroups(list)
    const map: Record<string, string> = {}
    list.forEach((g) => {
      map[g.id] = g.name
    })
    setGroupsMap(map)
  }

  const loadStaff = async () => {
    const { data, error: sErr } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['teacher', 'support'])
      .order('full_name')

    if (sErr) throw sErr
    const list = (data || []) as StaffLite[]
    setStaffList(list)
    const map: Record<string, string> = {}
    list.forEach((s) => {
      map[s.id] = s.full_name
    })
    setStaffMap(map)
  }

  const loadRota = async () => {
    let query = supabase.from('staff_rota').select('*')
    if (selectedGroupId) query = query.eq('group_id', selectedGroupId)
    if (selectedDate) query = query.eq('date', selectedDate)
    if (dateRangeStart) query = query.gte('date', dateRangeStart)
    if (dateRangeEnd) query = query.lte('date', dateRangeEnd)
    query = query.order('date', { ascending: true })

    const { data, error: rErr } = await query
    if (rErr) throw rErr
    setRota((data || []) as StaffRotaEntry[])
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        await Promise.all([loadGroups(), loadStaff()])
        await loadRota()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t(sT('errLoadRota')))
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!groups.length || !staffList.length) return
    void loadRota()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId, selectedDate, dateRangeStart, dateRangeEnd])

  return (
    <div>
      <div className="mb-6">
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
        <p className="text-ui-muted mt-2">Manage daily staff assignments and absences</p>
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
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4 flex gap-4 flex-wrap">
            <div>
              <label htmlFor="group_filter" className="block text-xs text-ui-soft mb-1">
                Group
              </label>
              <select
                id="group_filter"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date_filter" className="block text-xs text-ui-soft mb-1">
                Date
              </label>
              <input
                id="date_filter"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="date_range_start" className="block text-xs text-ui-soft mb-1">
                Start Date
              </label>
              <input
                id="date_range_start"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label htmlFor="date_range_end" className="block text-xs text-ui-soft mb-1">
                End Date
              </label>
              <input
                id="date_range_end"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                type="date"
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Replacement</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rota.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-ui-soft">
                      No rota entries found
                    </td>
                  </tr>
                ) : (
                  rota.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">{formatDate(entry.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">{groupsMap[entry.group_id] || entry.group_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">{staffMap[entry.staff_id] || entry.staff_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-soft">
                        {entry.start_time && entry.end_time ? `${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {entry.is_absence ? (
                          <span className={getAbsenceClass(entry.absence_type)}>{formatAbsenceType(entry.absence_type)}</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Present</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-soft">
                        {entry.replacement_staff_id ? (staffMap[entry.replacement_staff_id] || entry.replacement_staff_id) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

