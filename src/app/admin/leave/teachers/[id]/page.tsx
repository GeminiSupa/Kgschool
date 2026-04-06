'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.leave.teachers.id'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useTeacherLeaveRequestsStore, type TeacherLeaveRequest } from '@/stores/teacherLeaveRequests'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { sT } from '@/i18n/sT'

type Params = { id?: string }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

function formatLeaveType(type: string) {
  if (!type) return type
  return type.charAt(0).toUpperCase() + type.slice(1)
}

type TeacherLite = {
  id: string
  full_name: string
}

export default function AdminTeacherLeaveRequestDetailPage() {
  const { t } = useI18n()

  const router = useRouter()
  const params = useParams() as Params
  const requestId = params.id || ''

  const supabase = useMemo(() => createClient(), [])
  const teacherLeaveRequestsStore = useTeacherLeaveRequestsStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [request, setRequest] = useState<TeacherLeaveRequest | null>(null)
  const [teachers, setTeachers] = useState<TeacherLite[]>([])

  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? teacher.full_name : teacherId
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        await teacherLeaveRequestsStore.fetchLeaveRequests()
        const found = teacherLeaveRequestsStore.leaveRequests.find((r) => r.id === requestId) || null
        setRequest(found)

        const { data, error: teachersErr } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'teacher')
          .order('full_name')

        if (teachersErr) throw teachersErr
        setTeachers((data || []) as TeacherLite[])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load request')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, t])

  const approveRequest = async () => {
    if (!request) return
    setProcessing(true)
    try {
      await teacherLeaveRequestsStore.updateLeaveRequestStatus(
        request.id,
        'approved',
        adminNotes.trim() || undefined
      )
      alert(t(sT('successLeaveApproved')))
      router.push('/admin/leave')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t(sT('errApproveLeave')))
    } finally {
      setProcessing(false)
    }
  }

  const rejectRequest = async () => {
    if (!request) return
    setProcessing(true)
    try {
      await teacherLeaveRequestsStore.updateLeaveRequestStatus(
        request.id,
        'rejected',
        adminNotes.trim() || undefined
      )
      alert(t(sT('successLeaveRejected')))
      router.push('/admin/leave')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to reject request')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/leave')}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Leave Requests
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      ) : !request ? (
        <div className="p-8 text-center text-ui-soft">Leave request not found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 max-w-3xl space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-ui-muted">Teacher</h3>
                <p className="mt-1 text-slate-900 dark:text-slate-50">{getTeacherName(request.teacher_id)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-ui-muted">Status</h3>
                <span
                  className={[
                    'inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full',
                    request.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : request.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800',
                  ].join(' ')}
                >
                  {request.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-ui-muted">Start Date</h3>
                <p className="mt-1 text-slate-900 dark:text-slate-50">{formatDate(request.start_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-ui-muted">End Date</h3>
                <p className="mt-1 text-slate-900 dark:text-slate-50">{formatDate(request.end_date)}</p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-ui-muted">Leave Type</h3>
              <p className="mt-1 text-slate-900 dark:text-slate-50">{formatLeaveType(request.leave_type)}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-ui-muted">Reason</h3>
              <p className="mt-1 text-slate-900 dark:text-slate-50">{request.reason}</p>
            </div>

            {request.admin_notes && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-ui-muted">Admin Notes</h3>
                <p className="mt-1 text-slate-900 dark:text-slate-50">{request.admin_notes}</p>
              </div>
            )}

            {request.status === 'pending' && (
              <div className="pt-4 border-t space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Admin Notes (Optional)</h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes about this decision..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void approveRequest()}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void rejectRequest()}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

