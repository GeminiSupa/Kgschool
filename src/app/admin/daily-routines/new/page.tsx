'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.daily-routines.new'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDailyRoutinesStore, type DailyRoutine } from '@/stores/dailyRoutines'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type RoutineForm = {
  group_id: string
  routine_name: string
  start_time: string
  end_time: string
  day_of_week: number | null
  description: string
  location: string
}

function toTimeDefault() {
  // Keep it simple; the user can adjust.
  return '08:00'
}

export default function AdminDailyRoutinesNewPage() {
  const { t } = useI18n()

  const router = useRouter()
  const dailyRoutinesStore = useDailyRoutinesStore()
  const groupsStore = useGroupsStore()

  const groups = groupsStore.groups

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [form, setForm] = useState<RoutineForm>({
    group_id: '',
    routine_name: '',
    start_time: toTimeDefault(),
    end_time: '',
    day_of_week: null,
    description: '',
    location: '',
  })

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        await groupsStore.fetchGroups()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load groups')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isFormValid = form.group_id && form.routine_name && form.start_time

  const handleSubmit = async () => {
    if (!isFormValid) return
    setError('')

    try {
      const payload: Partial<DailyRoutine> = {
        group_id: form.group_id,
        routine_name: form.routine_name,
        start_time: form.start_time,
        end_time: form.end_time ? form.end_time : undefined,
        day_of_week: form.day_of_week === null ? undefined : form.day_of_week,
        description: form.description ? form.description : undefined,
        location: form.location ? form.location : undefined,
        is_active: true,
      }

      await dailyRoutinesStore.createDailyRoutine(payload)
      alert('Daily routine created successfully!')
      router.push('/admin/daily-routines')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create daily routine')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/daily-routines')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Daily Routines
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="max-w-3xl p-6">
        {error && <ErrorAlert message={error} />}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="group_id" className="block text-sm font-medium text-gray-700 mb-2">
              Group <span className="text-red-500">*</span>
            </label>
            <select
              id="group_id"
              value={form.group_id}
              onChange={(e) => setForm((p) => ({ ...p, group_id: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="routine_name" className="block text-sm font-medium text-gray-700 mb-2">
              Routine Name <span className="text-red-500">*</span>
            </label>
            <input
              id="routine_name"
              value={form.routine_name}
              onChange={(e) => setForm((p) => ({ ...p, routine_name: e.target.value }))}
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Morning Circle, Nap Time"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                id="start_time"
                value={form.start_time}
                onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                type="time"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                id="end_time"
                value={form.end_time}
                onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                type="time"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700 mb-2">
              Day of Week (leave empty for every day)
            </label>
            <select
              id="day_of_week"
              value={form.day_of_week === null ? '' : String(form.day_of_week)}
              onChange={(e) => {
                const val = e.target.value
                setForm((p) => ({ ...p, day_of_week: val === '' ? null : Number(val) }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Every Day</option>
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
              <option value="2">Tuesday</option>
              <option value="3">Wednesday</option>
              <option value="4">Thursday</option>
              <option value="5">Friday</option>
              <option value="6">Saturday</option>
            </select>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              id="location"
              value={form.location}
              onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Indoor, Outdoor, Gym"
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
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the routine..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => router.push('/admin/daily-routines')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <IOSButton
              type="submit"
              className="px-4 py-2"
              disabled={!isFormValid}
            >
              Create Routine
            </IOSButton>
          </div>
        </form>
      </IOSCard>
    </div>
  )
}

