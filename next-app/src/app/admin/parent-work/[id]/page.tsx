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

type ProfileMap = Record<string, string>

export default function AdminParentWorkDetailsPage() {
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
        setError('Task not found')
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
          setError('Task not found')
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
        setError(err instanceof Error ? err.message : 'Failed to load task')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const submissions = parentWorkStore.submissions

  const formatTaskType = (type: string) => {
    const types: Record<string, string> = {
      cleaning: 'Cleaning',
      cooking: 'Cooking',
      maintenance: 'Maintenance',
      gardening: 'Gardening',
      administration: 'Administration',
      other: 'Other',
    }
    return types[type] || type
  }

  const formatStatus = (status: ParentWorkTask['status']) => {
    const statuses: Record<string, string> = {
      open: 'Open',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
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
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      paid: 'Paid',
    }
    return statuses[status] || status
  }

  const getAssignedToName = (userId?: string) => {
    if (!userId) return 'Unassigned'
    return profiles[userId] || userId
  }

  const getParentName = (userId: string) => profiles[userId] || userId

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  const approveSubmission = async (submissionId: string) => {
    if (!confirm('Approve this submission?')) return
    try {
      await parentWorkStore.approveSubmission(submissionId)
      await parentWorkStore.fetchSubmissions(taskId, undefined, profile?.kita_id)
      alert('Submission approved!')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to approve submission')
    }
  }

  const rejectSubmission = async (submissionId: string) => {
    const reason = prompt('Reason for rejection (optional):')
    if (reason === null) return

    try {
      await parentWorkStore.rejectSubmission(submissionId, reason || undefined)
      await parentWorkStore.fetchSubmissions(taskId, undefined, profile?.kita_id)
      alert('Submission rejected!')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to reject submission')
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
          ← Back to Parent Work Tasks
        </button>
        <Heading size="xl">{task?.title || 'Task Details'}</Heading>
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
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-900">{task.description || 'No description'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1">
                  <span className={getStatusClass(task.status)}>{formatStatus(task.status)}</span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Hourly Rate</label>
                <p className="mt-1 text-gray-900">€{task.hourly_rate.toFixed(2)}/hr</p>
              </div>
              {task.estimated_hours && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Hours</label>
                  <p className="mt-1 text-gray-900">{task.estimated_hours} hours</p>
                </div>
              )}
              {task.assigned_to && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned To</label>
                  <p className="mt-1 text-gray-900">{getAssignedToName(task.assigned_to)}</p>
                </div>
              )}
              {task.due_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Due Date</label>
                  <p className="mt-1 text-gray-900">{formatDate(task.due_date)}</p>
                </div>
              )}
            </div>

            {task.notes && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="mt-1 text-gray-900">{task.notes}</p>
              </div>
            )}
          </IOSCard>

          <IOSCard className="p-6 max-w-4xl mx-auto">
            <Heading size="md" className="mb-4">
              Submissions
            </Heading>

            {submissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No submissions yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => void rejectSubmission(submission.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
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
          Task not found.
        </IOSCard>
      )}
    </div>
  )
}

