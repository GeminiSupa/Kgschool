'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.attendance'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useAttendanceStore } from '@/stores/attendance'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { sT } from '@/i18n/sT'

export default function ParentAttendancePage() {
  const { t } = useI18n()

  const { user } = useAuth()
  const { attendance, loading: attendanceLoading, error: attendanceError, fetchAttendance } = useAttendanceStore()
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id, selectedDate])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Fetch my children
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .contains('parent_ids', [user?.id])
      
      if (childrenError) throw childrenError
      setMyChildren(children || [])

      // 2. Fetch attendance for selected date
      if (children && children.length > 0) {
        await fetchAttendance(undefined, selectedDate)
      }
    } catch (e: any) {
      console.error('Error loading parent attendance:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredAttendance = useMemo(() => {
    const childIds = myChildren.map(c => c.id)
    return attendance.filter(a => childIds.includes(a.child_id))
  }, [attendance, myChildren])

  const getChildName = (childId: string) => {
    const child = myChildren.find(c => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  const statusColors: Record<string, string> = {
    present: 'bg-green-50 text-green-700 border-green-100',
    absent: 'bg-red-50 text-red-700 border-red-100',
    late: 'bg-amber-50 text-amber-700 border-amber-100'
  }

  const statusLabels: Record<string, string> = {
    present: 'Anwesend',
    absent: 'Abwesend',
    late: 'Verspätet'
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Status der Anwesenheit Ihrer Kinder</p>
        </div>
        <Link href="/parent/leave/new">
          <IOSButton variant="primary" className="px-5 py-2.5 text-sm font-bold flex items-center gap-2">
            <span>📝</span>
            <span>Abwesenheit melden</span>
          </IOSButton>
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all shadow-sm"
        />
      </div>

      {loading || attendanceLoading ? (
        <div className="flex justify-center py-24"><LoadingSpinner /></div>
      ) : error || attendanceError ? (
        <ErrorAlert message={error || attendanceError?.message || t(sT('errLoadData'))} />
      ) : filteredAttendance.length === 0 ? (
        <IOSCard className="p-12 text-center">
          <div className="text-5xl opacity-40 mb-4">📅</div>
          <p className="text-ui-soft font-medium">Keine Anwesenheitsdaten für dieses Datum gefunden.</p>
        </IOSCard>
      ) : (
        <div className="grid gap-4">
          {filteredAttendance.map(record => (
            <IOSCard key={record.id} className="p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-lg font-black shadow-inner">
                    {getChildName(record.child_id)[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{getChildName(record.child_id)}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm font-medium text-ui-soft">
                      <p className="flex items-center gap-1.5">
                        <span className="text-xs">⬇️</span> In: {record.check_in_time ? formatTime(record.check_in_time) : '--:--'}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="text-xs">⬆️</span> Out: {record.check_out_time ? formatTime(record.check_out_time) : '--:--'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full border ${statusColors[record.status] || 'bg-gray-50 text-slate-700 dark:text-slate-200 border-gray-100'}`}>
                    {statusLabels[record.status] || record.status}
                  </span>
                  {record.notes && (
                    <p className="text-xs font-medium text-ui-soft italic mt-1 max-w-[200px] text-right">
                      "{record.notes}"
                    </p>
                  )}
                </div>
              </div>
            </IOSCard>
          ))}
        </div>
      )}
    </div>
  )
}
