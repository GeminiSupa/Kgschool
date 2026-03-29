'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useChildrenStore, type Child } from '@/stores/children'
import { useStaffAssignmentsStore, type StaffAssignment } from '@/stores/staffAssignments'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { TeacherAssignmentList, type TeacherAssignmentListRef } from '@/components/common/TeacherAssignmentList'

type ProfileLite = {
  id: string
  full_name: string
  role: 'teacher' | 'support' | string
}

type AssignmentForm = {
  staff_id: string
  assignment_type: StaffAssignment['assignment_type']
  start_date: string
  end_date: string
  notes: string
}

function toISODate(d: Date) {
  return d.toISOString().split('T')[0]
}

export default function AdminChildAssignTeachersPage() {
  const router = useRouter()
  const params = useParams()
  const childId = typeof params?.id === 'string' ? params.id : ''

  const supabase = useMemo(() => createClient(), [])
  const childrenStore = useChildrenStore()
  const staffAssignmentsStore = useStaffAssignmentsStore()

  const assignmentListRef = useRef<TeacherAssignmentListRef | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [childName, setChildName] = useState('')

  const [editingAssignment, setEditingAssignment] = useState<StaffAssignment | null>(null)

  const [staffLoading, setStaffLoading] = useState(true)
  const [staffMembers, setStaffMembers] = useState<ProfileLite[]>([])

  const [form, setForm] = useState<AssignmentForm>(() => ({
    staff_id: '',
    assignment_type: 'primary_teacher',
    start_date: toISODate(new Date()),
    end_date: '',
    notes: '',
  }))

  const resetCreateForm = () => {
    setEditingAssignment(null)
    setForm({
      staff_id: '',
      assignment_type: 'primary_teacher',
      start_date: toISODate(new Date()),
      end_date: '',
      notes: '',
    })
  }

  const populateEditForm = (assignment: StaffAssignment) => {
    setEditingAssignment(assignment)
    setForm({
      staff_id: assignment.staff_id,
      assignment_type: assignment.assignment_type,
      start_date: assignment.start_date,
      end_date: assignment.end_date || '',
      notes: assignment.notes || '',
    })
  }

  const refreshAssignments = async () => {
    if (!childId) return
    await staffAssignmentsStore.fetchAssignments(childId)
    await assignmentListRef.current?.refresh()
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        if (!childId) {
          setError('Child not found')
          return
        }

        const child = (await childrenStore.fetchChildById(childId)) as Child | null
        if (!child) {
          setError('Child not found')
          return
        }
        setChildName(`${child.first_name} ${child.last_name}`)

        const { data: staffData, error: staffErr } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('role', ['teacher', 'support'])
          .order('full_name')

        if (staffErr) throw staffErr
        setStaffMembers((staffData || []) as ProfileLite[])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load data')
      } finally {
        setLoading(false)
        setStaffLoading(false)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId])

  useEffect(() => {
    if (!childId) return
    refreshAssignments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId])

  const validateForm = () => {
    if (!form.staff_id) return 'Please select a staff member'
    if (!form.assignment_type) return 'Please select an assignment type'
    if (!form.start_date) return 'Please select a start date'
    if (form.end_date && form.end_date.trim() !== '') {
      const start = new Date(form.start_date)
      const end = new Date(form.end_date)
      if (end < start) return 'End date must be after start date'
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(form.start_date)
    if (start < today) return 'Start date cannot be in the past'
    return ''
  }

  const handleSubmit = async () => {
    if (!childId) return

    const msg = validateForm()
    if (msg) {
      alert(msg)
      return
    }

    const assignmentData: Partial<StaffAssignment> = {
      child_id: childId,
      staff_id: form.staff_id,
      assignment_type: form.assignment_type,
      start_date: form.start_date,
      ...(form.end_date.trim() ? { end_date: form.end_date } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    }

    try {
      await staffAssignmentsStore.createAssignment(assignmentData)
      alert('Assignment created successfully!')
      await refreshAssignments()
      resetCreateForm()
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to create assignment'
      alert(message)
    }
  }

  const handleUpdate = async () => {
    if (!editingAssignment) return

    const msg = validateForm()
    if (msg) {
      alert(msg)
      return
    }

    const assignmentData: Partial<StaffAssignment> = {
      staff_id: form.staff_id,
      assignment_type: form.assignment_type,
      start_date: form.start_date,
      ...(form.end_date.trim() ? { end_date: form.end_date } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      child_id: childId,
    }

    try {
      await staffAssignmentsStore.updateAssignment(editingAssignment.id, assignmentData)
      alert('Assignment updated successfully!')
      setEditingAssignment(null)
      await refreshAssignments()
      resetCreateForm()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to update assignment')
    }
  }

  const handleDelete = async (assignment: StaffAssignment) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return
    try {
      await staffAssignmentsStore.deleteAssignment(assignment.id)
      alert('Assignment removed successfully!')
      await refreshAssignments()
      if (editingAssignment?.id === assignment.id) resetCreateForm()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to remove assignment')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6">
        <ErrorAlert message={error} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push(`/admin/children/${childId}`)}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Child Details
        </button>
        <Heading size="xl" className="mb-2">
          Assign Teachers to Child
        </Heading>
        {childName && <p className="text-sm text-gray-500">{childName}</p>}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <Heading size="md" className="mb-4">
            Current Assignments
          </Heading>
          <TeacherAssignmentList
            ref={assignmentListRef}
            childId={childId}
            canEdit
            canDelete
            onEdit={(assignment) => populateEditForm(assignment)}
            onDelete={(assignment) => void handleDelete(assignment)}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <Heading size="md" className="mb-4">
            {editingAssignment ? 'Add New Assignment' : 'Add New Assignment'}
          </Heading>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              void handleSubmit()
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Member <span className="text-red-500">*</span>
              </label>
              <select
                value={form.staff_id}
                disabled={staffLoading}
                onChange={(e) => setForm((p) => ({ ...p, staff_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{staffLoading ? 'Loading staff...' : 'Select staff member'}</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.assignment_type}
                onChange={(e) => setForm((p) => ({ ...p, assignment_type: e.target.value as StaffAssignment['assignment_type'] }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="primary_teacher">Primary Teacher</option>
                <option value="assistant_teacher">Assistant Teacher</option>
                <option value="support_staff">Support Staff</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes about this assignment..."
              />
            </div>

            {editingAssignment ? (
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => resetCreateForm()}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpdate()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Update
                </button>
              </div>
            ) : (
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => resetCreateForm()}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Assignment
                </button>
              </div>
            )}
          </form>
        </div>

        {editingAssignment && (
          <div className="bg-white rounded-lg shadow p-6">
            <Heading size="md" className="mb-4">
              Editing Assignment
            </Heading>
            <p className="text-sm text-gray-600">
              Updating the selected assignment. Click <b>Save Update</b> to persist changes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

