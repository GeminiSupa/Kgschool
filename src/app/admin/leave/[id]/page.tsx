'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.leave.id'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { getProfileIdsForKita } from '@/utils/tenant/profileScope'
import { useLeaveRequestsStore, type LeaveRequest } from '@/stores/leaveRequests'
import { useChildrenStore, type Child } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { sT } from '@/i18n/sT'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

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

        const child = (await childrenStore.fetchChildById(found.child_id)) as Child | null
        const kitaId = child?.kita_id
        if (!kitaId) {
          setParentName('')
          return
        }
        const tenantIds = await getProfileIdsForKita(supabase, kitaId)
        if (!tenantIds.includes(found.parent_id)) {
          setParentName('')
          return
        }

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
  }, [requestId, t])

  const approveRequest = async () => {
    if (!request) return
    setProcessing(true)
    try {
      await leaveRequestsStore.updateLeaveRequestStatus(
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
      await leaveRequestsStore.updateLeaveRequestStatus(
        request.id,
        'rejected',
        adminNotes.trim() || undefined
      )
      alert(t(sT('successLeaveRejected')))
      router.push('/admin/leave')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t(sT('errRejectLeave')))
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
        <IOSCard className="p-6 max-w-3xl space-y-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-ui-soft">Child</h3>
              <p className="mt-1 text-lg text-slate-900 dark:text-slate-50">{getChildName(request.child_id)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-ui-soft">Parent</h3>
              <p className="mt-1 text-lg text-slate-900 dark:text-slate-50">{parentName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-ui-soft">Start Date</h3>
                <p className="mt-1 text-slate-900 dark:text-slate-50">{formatDate(request.start_date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-ui-soft">End Date</h3>
                <p className="mt-1 text-slate-900 dark:text-slate-50">{formatDate(request.end_date)}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-ui-soft">Leave Type</h3>
              <p className="mt-1 text-slate-900 dark:text-slate-50">{formatLeaveType(request.leave_type)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-ui-soft">Reason</h3>
              <p className="mt-1 text-slate-900 dark:text-slate-50">{request.reason}</p>
            </div>

            {request.notes && (
              <div>
                <h3 className="text-sm font-medium text-ui-soft">Additional Notes</h3>
                <p className="mt-1 text-slate-900 dark:text-slate-50">{request.notes}</p>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-ui-soft">Status</h3>
              <span
                className={[
                  'mt-1 inline-block px-3 py-1 text-sm font-black uppercase tracking-wide rounded-full border border-black/5 dark:border-white/10',
                  request.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200'
                    : request.status === 'rejected'
                      ? 'bg-red-50 text-red-800 dark:bg-red-400/10 dark:text-red-200'
                      : 'bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-200',
                ].join(' ')}
              >
                {request.status}
              </span>
            </div>

            {request.admin_notes && (
              <div>
                <h3 className="text-sm font-medium text-ui-soft">Admin Notes</h3>
                <p className="mt-1 text-slate-900 dark:text-slate-50">{request.admin_notes}</p>
              </div>
            )}

            {request.status === 'pending' && (
              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-4">Admin Response</h3>

                <div className="mb-4">
                  <label htmlFor="admin_notes" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="admin_notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="ui-textarea"
                    placeholder="Add any notes for the parent..."
                  />
                </div>

                <div className="flex gap-3">
                  <IOSButton
                    type="button"
                    onClick={() => void approveRequest()}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </IOSButton>
                  <IOSButton
                    type="button"
                    onClick={() => void rejectRequest()}
                    disabled={processing}
                    variant="danger"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </IOSButton>
                </div>
              </div>
            )}
          </div>
        </IOSCard>
      )}
    </div>
  )
}

