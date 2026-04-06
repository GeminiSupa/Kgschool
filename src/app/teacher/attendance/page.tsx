'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.attendance'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useAttendanceStore } from '@/stores/attendance'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { AttendanceBulkActions } from '@/components/attendance/AttendanceBulkActions'
import { CheckInOutButton } from '@/components/attendance/CheckInOutButton'
import { AbsenceSubmissionForm } from '@/components/forms/AbsenceSubmissionForm'
import { sT } from '@/i18n/sT'

export default function TeacherAttendancePage() {
  const { t } = useI18n()

  const { user } = useAuth()
  const { 
    attendance, 
    loading: attendanceLoading, 
    error: attendanceError, 
    fetchAttendance, 
    markAttendance, 
    markBulkAttendance, 
    checkIn, 
    checkOut, 
    markAbsentWithSubmission,
    absenceSubmissions,
    fetchAbsenceSubmissions
  } = useAttendanceStore()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [children, setChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
      // 1. Fetch children assigned to this teacher
      const { data: groupAssignments, error: groupsError } = await supabase
        .from('group_teachers')
        .select('group_id')
        .eq('teacher_id', user?.id)
        .is('end_date', null)

      let groupIds: string[] = []
      if (groupAssignments && groupAssignments.length > 0) {
        groupIds = groupAssignments.map(ga => ga.group_id)
      } else {
        // Fallback to groups table educator_id
        const { data: groups } = await supabase
          .from('groups')
          .select('id')
          .eq('educator_id', user?.id)
        if (groups) groupIds = groups.map(g => g.id)
      }

      if (groupIds.length > 0) {
        const { data: childrenData, error: childrenError } = await supabase
          .from('children')
          .select('*')
          .in('group_id', groupIds)
          .eq('status', 'active')
          .order('first_name')
        
        if (childrenError) throw childrenError
        setChildren(childrenData || [])
      } else {
        setChildren([])
      }

      // 2. Fetch attendance for selected date
      await fetchAttendance(undefined, selectedDate)
      
      // 3. Fetch absence submissions for today's attendance records
      // This is handled via fetchAbsenceSubmissions if needed, 
      // but the store usually handles it. We'll ensure we have submissions.
    } catch (e: any) {
      console.error('Error loading attendance data:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const attendanceMap = useMemo(() => {
    const map: Record<string, any> = {}
    attendance.forEach(a => {
      map[a.child_id] = a
    })
    return map
  }, [attendance])

  const submissionMap = useMemo(() => {
    const map: Record<string, any> = {}
    // Assuming absenceSubmissions includes all relevant submissions for the fetched attendance
    absenceSubmissions.forEach(s => {
      // We need to link submission to child_id. 
      // If s doesn't have child_id directly, we find the attendance record it belongs to.
      const att = attendance.find(a => a.id === s.attendance_id)
      if (att) map[att.child_id] = s
    })
    return map
  }, [absenceSubmissions, attendance])

  const handleToggleSelectAll = () => {
    if (selectedChildren.length === children.length && children.length > 0) {
      setSelectedChildren([])
    } else {
      setSelectedChildren(children.map(c => c.id))
    }
  }

  const handleToggleChildSelection = (childId: string) => {
    setSelectedChildren(prev => 
      prev.includes(childId) ? prev.filter(id => id !== childId) : [...prev, childId]
    )
  }

  const handleMarkBulkPresent = async () => {
    if (selectedChildren.length === 0) return
    setSubmitting(true)
    try {
      await markBulkAttendance(selectedChildren, selectedDate, 'present')
      setSelectedChildren([])
      setBulkMode(false)
      await loadData()
    } catch (e: any) {
      alert(e.message || t(sT('errSaveAttendance')))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckIn = async (childId: string, date: string) => {
    try {
      await checkIn(childId, date)
      await loadData()
    } catch (e: any) {
      alert(e.message || t(sT('errCheckIn')))
    }
  }

  const handleCheckOut = async (childId: string, date: string) => {
    try {
      await checkOut(childId, date)
      await loadData()
    } catch (e: any) {
      alert(e.message || t(sT('errCheckOut')))
    }
  }

  const handleMarkPresent = async (childId: string) => {
    try {
      await markAttendance({
        child_id: childId,
        date: selectedDate,
        status: 'present',
        check_in_time: new Date().toISOString()
      })
      await loadData()
    } catch (e: any) {
      alert(e.message || t(sT('errMarkPresent')))
    }
  }

  const handleAbsenceSubmit = async (data: { reason: string; notes?: string }) => {
    if (!selectedChildId) return
    setSubmitting(true)
    try {
      await markAbsentWithSubmission(selectedChildId, selectedDate, data.reason, data.notes)
      setShowAbsenceModal(false)
      setSelectedChildId(null)
      await loadData()
    } catch (e: any) {
      alert(e.message || t(sT('errReportAbsence')))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Erfassen Sie die tägliche Anwesenheit der Kinder</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-white border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
          />
          <IOSButton
            variant="secondary"
            onClick={() => { setBulkMode(!bulkMode); setSelectedChildren([]) }}
            className="px-4 py-2 text-sm font-bold"
          >
            {bulkMode ? 'Abbrechen' : 'Mehrfachauswahl'}
          </IOSButton>
        </div>
      </div>

      {bulkMode && (
        <AttendanceBulkActions
          selectAll={selectedChildren.length === children.length && children.length > 0}
          selectedCount={selectedChildren.length}
          onToggleSelectAll={handleToggleSelectAll}
          onMarkAllPresent={handleMarkBulkPresent}
          onClearSelection={() => setSelectedChildren([])}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-24"><LoadingSpinner /></div>
      ) : error || attendanceError ? (
        <ErrorAlert message={error || attendanceError?.message || 'Fehler beim Laden'} />
      ) : children.length === 0 ? (
        <IOSCard className="p-12 text-center">
          <div className="text-5xl opacity-40 mb-4">👥</div>
          <p className="text-ui-soft font-medium">Keine Kinder in Ihren Gruppen gefunden.</p>
        </IOSCard>
      ) : (
        <div className="grid gap-4">
          {children.map(child => {
            const att = attendanceMap[child.id]
            const sub = submissionMap[child.id]
            const isSelected = selectedChildren.includes(child.id)

            return (
              <IOSCard 
                key={child.id} 
                className={`p-4 transition-all duration-300 ${isSelected ? 'ring-2 ring-[#667eea] bg-[#667eea]/5' : ''}`}
                onClick={() => bulkMode && handleToggleChildSelection(child.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {bulkMode && (
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="peer h-5 w-5 appearance-none rounded-md border border-black/10 bg-white transition-all checked:bg-[#667eea] checked:border-[#667eea]"
                        />
                        <svg
                          className="pointer-events-none absolute h-3.5 w-3.5 translate-x-[3px] text-white opacity-0 peer-checked:opacity-100"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 dark:text-slate-50 truncate">{child.first_name} {child.last_name}</h4>
                      {sub && (
                        <p className="text-xs text-red-600 font-bold mt-0.5">
                          Abwesend: {sub.reason}
                        </p>
                      )}
                      {att?.status === 'present' && !bulkMode && (
                        <div className="mt-1">
                          <CheckInOutButton
                            childId={child.id}
                            date={selectedDate}
                            checkInTime={att.check_in_time}
                            checkOutTime={att.check_out_time}
                            onCheckIn={handleCheckIn}
                            onCheckOut={handleCheckOut}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {!bulkMode && (
                    <div className="flex items-center gap-2">
                      <IOSButton
                        variant={att?.status === 'present' ? 'primary' : 'secondary'}
                        onClick={(e) => { e.stopPropagation(); handleMarkPresent(child.id) }}
                        className={`text-xs px-4 py-2 font-bold ${att?.status === 'present' ? 'bg-green-500 border-green-500' : ''}`}
                      >
                        {att?.status === 'present' ? '✓ Anwesend' : 'Anwesend'}
                      </IOSButton>
                      <IOSButton
                        variant={att?.status === 'absent' ? 'primary' : 'secondary'}
                        onClick={(e) => { e.stopPropagation(); setSelectedChildId(child.id); setShowAbsenceModal(true) }}
                        className={`text-xs px-4 py-2 font-bold ${att?.status === 'absent' ? 'bg-red-500 border-red-500' : ''}`}
                      >
                        {att?.status === 'absent' ? '✖ Abwesend' : 'Abwesend'}
                      </IOSButton>
                    </div>
                  )}
                </div>
              </IOSCard>
            )
          })}
        </div>
      )}

      {showAbsenceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <IOSCard className="max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
            <AbsenceSubmissionForm
              onSubmit={handleAbsenceSubmit}
              onCancel={() => { setShowAbsenceModal(false); setSelectedChildId(null) }}
              loading={submitting}
            />
          </IOSCard>
        </div>
      )}
    </div>
  )
}
