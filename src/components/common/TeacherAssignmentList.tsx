'use client'

import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useStaffAssignmentsStore, type StaffAssignment } from '@/stores/staffAssignments'

export interface TeacherAssignmentListRef {
  refresh: () => Promise<void>
}

interface TeacherAssignmentListProps {
  childId?: string
  staffId?: string
  canEdit?: boolean
  canDelete?: boolean
  onEdit?: (assignment: StaffAssignment) => void
  onDelete?: (assignment: StaffAssignment) => void
  onRefreshed?: () => void
}

export const TeacherAssignmentList = forwardRef<TeacherAssignmentListRef, TeacherAssignmentListProps>(
  ({ childId, staffId, canEdit = false, canDelete = false, onEdit, onDelete, onRefreshed }, ref) => {
    const supabase = createClient()
    const { fetchAssignments, assignments } = useStaffAssignmentsStore()
    const [loading, setLoading] = useState(true)
    const [staffNames, setStaffNames] = useState<Record<string, string>>({})

    const doFetch = async () => {
      setLoading(true)
      try {
        await fetchAssignments(childId, staffId)
        
        // Wait, assignments from Zustand might not be synchronously populated right after fetchAssignments
        // if we rely on the component re-render. To get the names quickly, 
        // we can fetch the local fresh list directly or use a `useEffect` on `assignments`.
        // Let's do the name fetching in a separate effect that watches `assignments`.
      } catch (err: any) {
        console.error('Error fetching assignments:', err)
      } finally {
        setLoading(false)
        if (onRefreshed) onRefreshed()
      }
    }

    useImperativeHandle(ref, () => ({
      refresh: doFetch
    }))

    // Fetch initial data
    useEffect(() => {
      if (childId || staffId) {
        doFetch()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [childId, staffId])

    // Update staff names whenever assignments change
    useEffect(() => {
      async function fetchNames() {
        if (!assignments || assignments.length === 0) return
        
        const ids = Array.from(new Set(assignments.map(a => a.staff_id)))
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', ids)

        if (data) {
          const map: Record<string, string> = {}
          data.forEach(p => { map[p.id] = p.full_name })
          setStaffNames(map)
        }
      }
      fetchNames()
    }, [assignments, supabase])

    const getStaffName = (id: string) => staffNames[id] || id

    const formatAssignmentType = (type: string) => {
      const types: Record<string, string> = {
        primary_teacher: 'Primary Teacher',
        assistant_teacher: 'Assistant Teacher',
        support_staff: 'Support Staff'
      }
      return types[type] || type
    }

    const formatDate = (date: string) => new Date(date).toLocaleDateString('de-DE')

    if (loading) {
      return <div className="text-center py-4 text-gray-500 text-sm">Loading assignments...</div>
    }

    if (assignments.length === 0) {
      return <div className="text-center py-4 text-gray-500 text-sm">No staff assignments yet.</div>
    }

    return (
      <div className="space-y-2">
        {assignments.map((assignment) => {
          const typeClass =
            assignment.assignment_type === 'primary_teacher' ? 'bg-blue-100 text-blue-800' :
            assignment.assignment_type === 'assistant_teacher' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'

          return (
            <div key={assignment.id} className="p-3 bg-white/50 border border-black/10 rounded-xl shadow-sm hover:bg-white/80 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{getStaffName(assignment.staff_id)}</p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${typeClass}`}>
                      {formatAssignmentType(assignment.assignment_type)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    {formatDate(assignment.start_date)}
                    {assignment.end_date ? (
                      <span> - {formatDate(assignment.end_date)}</span>
                    ) : (
                      <span className="text-green-600"> (Active)</span>
                    )}
                  </p>
                  {assignment.notes && (
                    <p className="text-xs text-gray-500 mt-1.5 italic bg-black/5 p-1.5 rounded-lg">
                      {assignment.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-2">
                  {canEdit && (
                    <button
                      onClick={() => onEdit?.(assignment)}
                      className="px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete?.(assignment)}
                      className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
)

TeacherAssignmentList.displayName = 'TeacherAssignmentList'
