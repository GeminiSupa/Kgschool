'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.leave.id'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLeaveRequestsStore, type LeaveRequest } from '@/stores/leaveRequests'
import { useChildrenStore, type Child } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type Params = { id?: string }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

function formatLeaveType(type: string) {
  if (!type) return type
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export default function AdminLeaveRequestDetailPage() {
  const { t } = useI18n()

  const router = useRouter()
  const params = useParams() as Params
  const requestId = params.id || ''

  const supabase = useMemo(() => createClient(), [])
  const leaveRequestsStore = useLeaveRequestsStore()
  const childrenStore = useChildrenStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [request, setRequest] = useState<LeaveRequest | null>(null)
  const [parentName, setParentName] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const children: Child[] = childrenStore.children

  const getChildName = (childId: string) => {
    const child = children.find((c) => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        await leaveRequestsStore.fetchLeaveRequests()

        const found = leaveRequestsStore.leaveRequests.find((r) => r.id === requestId) || null
        setRequest(found)

        if (!found) return

        const { data, error: parentErr } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', found.parent_id)
          .single()

        if (parentErr) throw parentErr
        setParentName(data?.full_name || found.parent_id)

        await childrenStore.fetchChildren()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load request')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  const approveRequest = async () => {
    if (!request) return
    setProcessing(true)
    try {
      await leaveRequestsStore.updateLeaveRequestStatus(
        request.id,
        'approved',
        adminNotes.trim() || undefined
      )
      alert('Leave request approved successfully!')
      router.push('/admin/leave')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to approve request')
    } finally {
      setProcessing(false)
    }
  }

  const rejectRequest = async () => {
    if (!request) return
    setProcessing(true)
    try {
      await leaveRequestsStore.updateLeaveRequestStatus(
        request.id,
        'rejected',
        adminNotes.trim() || undefined
      )
      alert('Leave request rejected.')
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
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
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
        <div className="p-8 text-center text-gray-500">Leave request not found.</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 max-w-3xl space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Child</h3>
              <p className="mt-1 text-lg text-gray-900">{getChildName(request.child_id)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Parent</h3>
              <p className="mt-1 text-lg text-gray-900">{parentName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                <p className="mt-1 text-gray-900">{formatDate(request.start_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                <p className="mt-1 text-gray-900">{formatDate(request.end_date)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Leave Type</h3>
              <p className="mt-1 text-gray-900">{formatLeaveType(request.leave_type)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Reason</h3>
              <p className="mt-1 text-gray-900">{request.reason}</p>
            </div>

            {request.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Additional Notes</h3>
                <p className="mt-1 text-gray-900">{request.notes}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <span
                className={[
                  'mt-1 inline-block px-3 py-1 text-sm font-medium rounded-full',
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

            {request.admin_notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Admin Notes</h3>
                <p className="mt-1 text-gray-900">{request.admin_notes}</p>
              </div>
            )}

            {request.status === 'pending' && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Admin Response</h3>

                <div className="mb-4">
                  <label htmlFor="admin_notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="admin_notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add any notes for the parent..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void approveRequest()}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void rejectRequest()}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

