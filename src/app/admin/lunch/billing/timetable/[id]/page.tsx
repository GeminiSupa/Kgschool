'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.billing.timetable.id'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useGroupsStore } from '@/stores/groups'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type BillingTimetable = {
  id: string
  group_id: string
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
  effective_from: string
  effective_to?: string | null
  notes?: string
}

type BillingTimetableFormState = {
  group_id: string
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
  effective_from: string
  effective_to: string
  notes: string
}

export default function AdminLunchBillingTimetableEditPage() {
  const { t } = useI18n()

  const router = useRouter()
  const params = useParams<{ id: string }>()
  const timetableId = params?.id

  const supabase = useMemo(() => createClient(), [])
  const groupsStore = useGroupsStore()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<BillingTimetableFormState>({
    group_id: '',
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    notes: '',
  })

  const groups = groupsStore.groups

  useEffect(() => {
    const run = async () => {
      if (!timetableId) {
        setError('Timetable not found')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const kitaId = profile?.kita_id || undefined
        await groupsStore.fetchGroups(kitaId)

        const { data: timetableData, error: timetableError } = await supabase
          .from('billing_timetable')
          .select('*')
          .eq('id', timetableId)
          .maybeSingle()

        if (timetableError) throw timetableError
        if (!timetableData) {
          setError('Timetable not found')
          return
        }

        const typed = timetableData as BillingTimetable
        setForm({
          group_id: typed.group_id,
          monday: typed.monday,
          tuesday: typed.tuesday,
          wednesday: typed.wednesday,
          thursday: typed.thursday,
          friday: typed.friday,
          saturday: typed.saturday,
          sunday: typed.sunday,
          effective_from: typed.effective_from,
          effective_to: typed.effective_to || '',
          notes: typed.notes || '',
        })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load timetable')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timetableId])

  const anyDaySelected = Object.entries({
    monday: form.monday,
    tuesday: form.tuesday,
    wednesday: form.wednesday,
    thursday: form.thursday,
    friday: form.friday,
    saturday: form.saturday,
    sunday: form.sunday,
  }).some(([, enabled]) => enabled)

  const handleCancel = () => router.push('/admin/lunch/billing/timetable')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!timetableId) return
    setSubmitting(true)
    setError('')
    try {
      if (!form.group_id) throw new Error('Please select a group')
      if (!form.effective_from) throw new Error('Effective from is required')
      if (!anyDaySelected) throw new Error('Please select at least one billable day')

      const payload = {
        group_id: form.group_id,
        monday: form.monday,
        tuesday: form.tuesday,
        wednesday: form.wednesday,
        thursday: form.thursday,
        friday: form.friday,
        saturday: form.saturday,
        sunday: form.sunday,
        effective_from: form.effective_from,
        effective_to: form.effective_to || null,
        notes: form.notes || undefined,
      }

      await supabase.from('billing_timetable').update(payload).eq('id', timetableId).select().single()

      alert('Timetable updated successfully!')
      router.push('/admin/lunch/billing/timetable')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save timetable')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-6">
        <button
          type="button"
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Timetables
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
        {error && <ErrorAlert message={error} />}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="group_id" className="block text-sm font-medium text-gray-700 mb-2">
                Group <span className="text-red-500">*</span>
              </label>
              <select
                id="group_id"
                value={form.group_id}
                onChange={(e) => setForm((p) => ({ ...p, group_id: e.target.value }))}
                required
                disabled={submitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Select a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.age_range})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Billable Days <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(
                  [
                    ['monday', 'Monday'],
                    ['tuesday', 'Tuesday'],
                    ['wednesday', 'Wednesday'],
                    ['thursday', 'Thursday'],
                    ['friday', 'Friday'],
                    ['saturday', 'Saturday'],
                    ['sunday', 'Sunday'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      checked={form[key]}
                      onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Select which days of the week should be billable for this group.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="effective_from" className="block text-sm font-medium text-gray-700 mb-2">
                  Effective From <span className="text-red-500">*</span>
                </label>
                <input
                  id="effective_from"
                  value={form.effective_from}
                  onChange={(e) => setForm((p) => ({ ...p, effective_from: e.target.value }))}
                  type="date"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
              </div>
              <div>
                <label htmlFor="effective_to" className="block text-sm font-medium text-gray-700 mb-2">
                  Effective To (optional)
                </label>
                <input
                  id="effective_to"
                  value={form.effective_to}
                  onChange={(e) => setForm((p) => ({ ...p, effective_to: e.target.value }))}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  disabled={submitting}
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for ongoing schedule</p>
              </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Optional notes about this timetable..."
                disabled={submitting}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <IOSButton type="button" variant="secondary" onClick={handleCancel} disabled={submitting}>
                Cancel
              </IOSButton>
              <IOSButton type="submit" disabled={submitting || !form.group_id || !anyDaySelected}>
                {submitting ? 'Saving...' : 'Update'}
              </IOSButton>
            </div>
          </form>
        )}
      </IOSCard>
    </div>
  )
}

