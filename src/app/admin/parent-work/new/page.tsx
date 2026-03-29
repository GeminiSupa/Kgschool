'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useParentWorkStore, type ParentWorkTask } from '@/stores/parentWork'
import { useKita } from '@/hooks/useKita'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type ParentProfile = { id: string; full_name: string; role: string }

export default function AdminParentWorkNewPage() {
  const router = useRouter()
  const parentWorkStore = useParentWorkStore()
  const supabase = createClient()
  const { getUserKitaId } = useKita()

  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [parentsLoading, setParentsLoading] = useState(true)
  const [parents, setParents] = useState<ParentProfile[]>([])

  const [form, setForm] = useState<{
    title: string
    description: string
    task_type: ParentWorkTask['task_type']
    hourly_rate: number
    estimated_hours?: number
    due_date: string
    assigned_to: string
    notes: string
  }>({
    title: '',
    description: '',
    task_type: 'cleaning',
    hourly_rate: 0,
    estimated_hours: undefined,
    due_date: '',
    assigned_to: '',
    notes: '',
  })

  useEffect(() => {
    const run = async () => {
      try {
        setParentsLoading(true)
        setSubmitError('')

        const kitaId = await getUserKitaId()
        if (kitaId) {
          const { data: membersData, error: membersError } = await supabase
            .from('organization_members')
            .select('profile_id')
            .eq('kita_id', kitaId)

          if (membersError) throw membersError

          const ids = membersData?.map((m) => m.profile_id).filter(Boolean) || []
          if (ids.length === 0) {
            setParents([])
            return
          }

          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .in('id', ids)

          if (profilesError) throw profilesError

          setParents((profilesData || []).filter((p) => p.role === 'parent'))
        } else {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('role', 'parent')
            .order('full_name')

          if (profilesError) throw profilesError
          setParents(profilesData || [])
        }
      } catch (err: unknown) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to load parents')
      } finally {
        setParentsLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError('')

    try {
      const assigned = !!form.assigned_to

      const taskData: Partial<ParentWorkTask> = {
        title: form.title,
        description: form.description || undefined,
        task_type: form.task_type,
        hourly_rate: form.hourly_rate,
        estimated_hours: form.estimated_hours,
        due_date: form.due_date || undefined,
        assigned_to: assigned ? form.assigned_to : undefined,
        assigned_date: assigned ? new Date().toISOString().split('T')[0] : undefined,
        notes: form.notes || undefined,
        status: assigned ? 'assigned' : 'open',
      }

      await parentWorkStore.createTask(taskData)
      router.push('/admin/parent-work')
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setLoading(false)
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
        <Heading size="xl">Create New Parent Work Task</Heading>
      </div>

      <IOSCard className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && <ErrorAlert message={submitError} />}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Kitchen Cleaning"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the task in detail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="task_type" className="block text-sm font-medium text-gray-700 mb-2">
                Task Type <span className="text-red-500">*</span>
              </label>
              <select
                id="task_type"
                value={form.task_type}
                onChange={(e) => setForm((p) => ({ ...p, task_type: e.target.value as ParentWorkTask['task_type'] }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="cleaning">Cleaning</option>
                <option value="cooking">Cooking</option>
                <option value="maintenance">Maintenance</option>
                <option value="gardening">Gardening</option>
                <option value="administration">Administration</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (€) <span className="text-red-500">*</span>
              </label>
              <input
                id="hourly_rate"
                value={form.hourly_rate}
                onChange={(e) => setForm((p) => ({ ...p, hourly_rate: Number(e.target.value) }))}
                type="number"
                step="0.01"
                min={0}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="estimated_hours" className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Hours
              </label>
              <input
                id="estimated_hours"
                value={form.estimated_hours ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    estimated_hours: e.target.value === '' ? undefined : Number(e.target.value),
                  }))
                }
                type="number"
                step="0.5"
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                id="due_date"
                value={form.due_date}
                onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-2">
              Assign To (Optional)
            </label>
            <select
              id="assigned_to"
              value={form.assigned_to}
              onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              disabled={parentsLoading}
            >
              <option value="">{parentsLoading ? 'Loading...' : 'Unassigned'}</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <IOSButton
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/parent-work')}
              disabled={loading}
              className="px-4 py-2"
            >
              Cancel
            </IOSButton>
            <IOSButton type="submit" variant="primary" disabled={loading} className="px-4 py-2">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <LoadingSpinner size="sm" /> Creating...
                </span>
              ) : (
                'Create Task'
              )}
            </IOSButton>
          </div>
        </form>
      </IOSCard>
    </div>
  )
}

