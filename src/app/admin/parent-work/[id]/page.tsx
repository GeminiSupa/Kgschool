'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  useParentWorkStore,
  type ParentWorkTask,
  type ParentWorkSubmission,
} from '@/stores/parentWork'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

type ProfileMap = Record<string, string>

export default function AdminParentWorkDetailsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const taskId = params?.id

  const supabase = createClient()
  const { profile } = useAuth()
  const parentWorkStore = useParentWorkStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [task, setTask] = useState<ParentWorkTask | null>(null)
  const [profiles, setProfiles] = useState<ProfileMap>({})

  useEffect(() => {
    const run = async () => {
      if (!taskId) {
        setError(t(sT('errNotFoundTask')))
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const [{ data: taskData, error: taskError }, profilesRes] = await Promise.all([
          supabase.from('parent_work_tasks').select('*').eq('id', taskId).maybeSingle(),
          supabase.from('profiles').select('id, full_name'),
        ])

        if (taskError) throw taskError
        if (!taskData) {
          setError(t(sT('errNotFoundTask')))
          setTask(null)
          return
        }

        setTask(taskData as ParentWorkTask)

        setProfiles(
          (profilesRes.data || []).reduce<ProfileMap>((acc, p) => {
            acc[p.id] = p.full_name
            return acc
          }, {})
        )

        // Load submissions for this task.
        await parentWorkStore.fetchSubmissions(taskId, undefined, profile?.kita_id)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t(sT('errLoadTask')))
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- task load only on taskId; avoid refetch on store/profile churn
  }, [taskId, t])

  const submissions = parentWorkStore.submissions

  const formatTaskType = (type: string) => {
    const types: Record<string, string> = {
      cleaning: t(sT('pwTypeCleaning')),
      cooking: t(sT('pwTypeCooking')),
      maintenance: t(sT('pwTypeMaintenance')),
      gardening: t(sT('pwTypeGardening')),
      administration: t(sT('pwTypeAdministration')),
      other: t(sT('pwTypeOther')),
    }
    return types[type] || type
  }

  const formatStatus = (status: ParentWorkTask['status']) => {
    const statuses: Record<string, string> = {
      open: t(sT('pwTaskOpen')),
      assigned: t(sT('pwTaskAssigned')),
      in_progress: t(sT('pwTaskInProgress')),
      completed: t(sT('pwTaskCompleted')),
      cancelled: t(sT('pwTaskCancelled')),
    }
    return statuses[status] || status
  }

  const getStatusClass = (status: ParentWorkTask['status']) => {
    const classes: Record<string, string> = {
      open: 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800',
      assigned: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
      in_progress: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
      completed: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
      cancelled: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
    }
    return classes[status] || classes.open
  }

  const getSubmissionStatusClass = (status: ParentWorkSubmission['status']) => {
    const classes: Record<string, string> = {
      pending: 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
      approved: 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
      rejected: 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
      paid: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800',
    }
    return classes[status] || classes.pending
  }

  const formatSubmissionStatus = (status: ParentWorkSubmission['status']) => {
    const statuses: Record<string, string> = {
      pending: t(sT('pwSubPending')),
      approved: t(sT('pwSubApproved')),
      rejected: t(sT('pwSubRejected')),
      paid: t(sT('pwSubPaid')),
    }
    return statuses[status] || status
  }

  const getAssignedToName = (userId?: string) => {
    if (!userId) return t(sT('loadingUnassigned'))
    return profiles[userId] || userId
  }

  const getParentName = (userId: string) => profiles[userId] || userId

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  const approveSubmission = async (submissionId: string) => {
    if (!confirm(t(sT('confirmApproveSubmission')))) return
    try {
      await parentWorkStore.approveSubmission(submissionId)
      await parentWorkStore.fetchSubmissions(taskId, undefined, profile?.kita_id)
      alert(t(sT('successSubmissionApproved')))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t(sT('errApproveSubmission')))
    }
  }

  const rejectSubmission = async (submissionId: string) => {
    const reason = prompt(t(sT('promptRejectReason')))
    if (reason === null) return

    try {
      await parentWorkStore.rejectSubmission(submissionId, reason || undefined)
      await parentWorkStore.fetchSubmissions(taskId, undefined, profile?.kita_id)
      alert(t(sT('successSubmissionRejected')))
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : t(sT('errRejectSubmission')))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/parent-work')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          {t(sT('pwBackLink'))}
        </button>
        <Heading size="xl">{task?.title || t(sT('pwTaskDetails'))}</Heading>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      ) : task ? (
        <div className="space-y-6">
          <IOSCard className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-4 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                <p className="text-gray-600 mt-1">{formatTaskType(task.task_type)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <label className="text-sm font-medium text-gray-500">{t(sT('pwDescription'))}</label>
                <p className="mt-1 text-gray-900">{task.description || t(sT('pwNoDescription'))}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t(sT('pwStatus'))}</label>
                <p className="mt-1">
                  <span className={getStatusClass(task.status)}>{formatStatus(task.status)}</span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">{t(sT('pwHourlyRate'))}</label>
                <p className="mt-1 text-gray-900">€{task.hourly_rate.toFixed(2)}/hr</p>
              </div>
              {task.estimated_hours && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t(sT('pwEstimatedHours'))}</label>
                  <p className="mt-1 text-gray-900">
                    {task.estimated_hours} {t(sT('pwHoursUnit'))}
                  </p>
                </div>
              )}
              {task.assigned_to && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t(sT('pwAssignedTo'))}</label>
                  <p className="mt-1 text-gray-900">{getAssignedToName(task.assigned_to)}</p>
                </div>
              )}
              {task.due_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">{t(sT('pwDueDate'))}</label>
                  <p className="mt-1 text-gray-900">{formatDate(task.due_date)}</p>
                </div>
              )}
            </div>

            {task.notes && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">{t(sT('pwNotes'))}</label>
                <p className="mt-1 text-gray-900">{task.notes}</p>
              </div>
            )}
          </IOSCard>

          <IOSCard className="p-6 max-w-4xl mx-auto">
            <Heading size="md" className="mb-4">
              {t(sT('pwSubmissions'))}
            </Heading>

            {submissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{t(sT('pwNoSubmissions'))}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t(sT('pwColParent'))}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t(sT('pwColDate'))}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t(sT('pwColHours'))}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t(sT('pwColAmount'))}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t(sT('pwColStatus'))}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t(sT('pwColActions'))}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getParentName(submission.parent_id)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(submission.work_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {submission.hours_worked}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          €{(submission.payment_amount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getSubmissionStatusClass(submission.status)}>
                            {formatSubmissionStatus(submission.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {submission.status === 'pending' && (
                            <div className="flex gap-4 items-center">
                              <button
                                type="button"
                                onClick={() => void approveSubmission(submission.id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                {t(sT('pwApprove'))}
                              </button>
                              <button
                                type="button"
                                onClick={() => void rejectSubmission(submission.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                {t(sT('pwReject'))}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </IOSCard>
        </div>
      ) : (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5 max-w-3xl mx-auto">
          {t(sT('pwTaskNotFound'))}
        </IOSCard>
      )}
    </div>
  )
}

